import roslibpy
import asyncio
import json
import time
import os
import base64
from dotenv import load_dotenv
from broadcast import broadcast, connected_clients

# ✅ .env 파일 로드
load_dotenv()

client = None
loop = None
clicked_coords_publisher = None
mission_complete_publisher = None

# ✅ 드론 상태 수신 (/drone/state)
def on_drone_state(message):
    try:
        data_str = message.get("data", "{}")
        payload = json.loads(data_str)
        print("📱 드론 상태 수신 →", payload)
        asyncio.run_coroutine_threadsafe(
            broadcast({"type": "drone_state", "payload": payload}), loop
        )
    except Exception as e:
        print("❌ 드론 상태 파싱 실패:", e)

# ✅ 파라미터 업데이트 수신 (/param/update)
def on_param_update(message):
    try:
        data_str = message.get("data", "{}")
        payload = json.loads(data_str)
        asyncio.run_coroutine_threadsafe(
            broadcast({"type": "param_update", "payload": payload}), loop
        )
    except Exception as e:
        print("❌ 파라미터 파싱 실패:", e)

# ✅ 탐지 이벤트 수신 (/detection/event)
def on_detection_event(message):
    try:
        data_str = message.get("data", "{}")
        payload = json.loads(data_str)
        asyncio.run_coroutine_threadsafe(
            broadcast({"type": "detection_event", "payload": payload}), loop
        )
    except Exception as e:
        print("❌ 탐지 이벤트 파싱 실패:", e)

# ✅ 탐지 정보 수신 (/detection_info)
def on_detection_info(message):
    try:
        payload = json.loads(message['data'])
        print("🧠 탐지 정보 수신:", payload)
        asyncio.run_coroutine_threadsafe(
            broadcast({"type": "detection_info", "payload": payload}), loop
        )
    except Exception as e:
        print("❌ 탐지 정보 파싱 실패:", e)

# ✅ 카메라 이미지 base64 수신 (/camera/base64)
def on_camera_base64(message):
    try:
        data_str = message['data']
        payload = json.loads(data_str)
        asyncio.run_coroutine_threadsafe(
            broadcast({"type": "camera", "payload": payload}), loop
        )
    except Exception as e:
        print("❌ base64 수신 오류:", e)

# ✅ 경로 + 위치 수신 (/drone/path_update)
def on_path_update(message):
    try:
        data = json.loads(message.get('data', '{}'))
        print("🛰️ 경로 수신 →", data)

        asyncio.run_coroutine_threadsafe(
            broadcast({"type": "path_update", "payload": data["payload"]}), loop
        )
    except Exception as e:
        print("❌ path_update 파싱 실패:", e)

# ✅ 좌표 클릭 발행
def publish_coords(lat, lng):
    global clicked_coords_publisher
    if clicked_coords_publisher is None:
        clicked_coords_publisher = roslibpy.Topic(
            client, '/clicked_coords', 'geometry_msgs/Point'
        )
        clicked_coords_publisher.advertise()
        time.sleep(1)
    clicked_coords_publisher.publish(
        roslibpy.Message({'x': lat, 'y': lng, 'z': 0.0})
    )
    print(f"[ROS 발행] 좌표 → 위도 {lat}, 경도 {lng}")

# ✅ 임무 완료 좌표 발행
def publish_mission_complete(start, polygon):
    global mission_complete_publisher
    if mission_complete_publisher is None:
        mission_complete_publisher = roslibpy.Topic(
            client, '/mission/complete', 'std_msgs/String'
        )
        mission_complete_publisher.advertise()
        time.sleep(1)
    payload = json.dumps({'start': start, 'polygon': polygon})
    mission_complete_publisher.publish(
        roslibpy.Message({'data': payload})
    )
    print(f"[ROS 발행] Mission complete → {payload}")

# ✅ ROS 연결 및 통신 초기화
def init_ros():
    global client, loop, clicked_coords_publisher, mission_complete_publisher

    rosbridge_host = os.getenv("ROSBRIDGE_HOST", "localhost")
    print("🔍 [환경변수 확인] ROSBRIDGE_HOST =", rosbridge_host)

    client = roslibpy.Ros(host=rosbridge_host, port=9090)
    client.run()

    if not client.is_connected:
        print(f"❌ ROS 연결 실패: rosbridge({rosbridge_host}:9090)에 접근할 수 없습니다.")
        return

    print(f"✅ ROS 연결 성공 ({rosbridge_host}:9090)")
    loop = asyncio.get_event_loop()

    # ✅ 토픽 구독
    roslibpy.Topic(client, '/drone/state', 'std_msgs/String').subscribe(on_drone_state)
    roslibpy.Topic(client, '/param/update', 'std_msgs/String').subscribe(on_param_update)
    roslibpy.Topic(client, '/detection/event', 'std_msgs/String').subscribe(on_detection_event)
    roslibpy.Topic(client, '/detection_info', 'std_msgs/String').subscribe(on_detection_info)
    roslibpy.Topic(client, '/camera/base64', 'std_msgs/String').subscribe(on_camera_base64)
    roslibpy.Topic(client, '/drone/path_update', 'std_msgs/String').subscribe(on_path_update)  # ✅ 변경 핵심

    # ✅ 퍼블리셔 초기화
    mission_complete_publisher = roslibpy.Topic(client, '/mission/complete', 'std_msgs/String')
    mission_complete_publisher.advertise()

    clicked_coords_publisher = roslibpy.Topic(client, '/clicked_coords', 'geometry_msgs/Point')
    clicked_coords_publisher.advertise()
