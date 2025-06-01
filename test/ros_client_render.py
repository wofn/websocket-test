import roslibpy
import asyncio
import json
import os
import websockets
from dotenv import load_dotenv

# ✅ 환경 변수 로드
load_dotenv()

render_ws_url = os.getenv("RENDER_WS_URL", "wss://your-render-server.onrender.com/ws")
rosbridge_host = os.getenv("ROSBRIDGE_HOST", "localhost")

client = None
websocket = None
loop = asyncio.get_event_loop()

# ✅ 메시지 Render 서버로 전송
async def send_to_render(msg):
    global websocket
    try:
        if websocket is not None and websocket.open:
            await websocket.send(json.dumps(msg))
        else:
            print("⚠️ WebSocket이 열려있지 않음. 메시지 전송 실패:", msg)
    except Exception as e:
        print("❌ WebSocket 전송 실패:", e)

# ✅ 콜백 함수들
def on_drone_state(message):
    payload = json.loads(message.get("data", "{}"))
    print("📡 드론 상태:", payload)
    asyncio.run_coroutine_threadsafe(send_to_render({"type": "drone_state", "payload": payload}), loop)

def on_param_update(message):
    payload = json.loads(message.get("data", "{}"))
    asyncio.run_coroutine_threadsafe(send_to_render({"type": "param_update", "payload": payload}), loop)

def on_detection_event(message):
    payload = json.loads(message.get("data", "{}"))
    asyncio.run_coroutine_threadsafe(send_to_render({"type": "detection_event", "payload": payload}), loop)

def on_detection_info(message):
    payload = json.loads(message.get("data", "{}"))
    asyncio.run_coroutine_threadsafe(send_to_render({"type": "detection_info", "payload": payload}), loop)

def on_camera_base64(message):
    payload = json.loads(message.get("data", "{}"))
    asyncio.run_coroutine_threadsafe(send_to_render({"type": "camera", "payload": payload}), loop)

def on_path_update(message):
    payload = json.loads(message.get("data", "{}"))
    print("🛰️ 경로 수신:", payload)
    asyncio.run_coroutine_threadsafe(send_to_render({"type": "path_update", "payload": payload.get("payload", {})}), loop)

# ✅ 메인 비동기 루프
async def main():
    global client, websocket

    try:
        websocket = await websockets.connect(render_ws_url)
        print("✅ Render WebSocket 연결 성공")
    except Exception as e:
        print("❌ Render WebSocket 연결 실패:", e)
        return

    client = roslibpy.Ros(host=rosbridge_host, port=9090)
    client.run()

    if not client.is_connected:
        print(f"❌ ROS 연결 실패 ({rosbridge_host}:9090)")
        return
    print(f"✅ ROS 연결 성공 ({rosbridge_host}:9090)")

    # ✅ 토픽 구독 시작
    roslibpy.Topic(client, '/drone/state', 'std_msgs/String').subscribe(on_drone_state)
    roslibpy.Topic(client, '/param/update', 'std_msgs/String').subscribe(on_param_update)
    roslibpy.Topic(client, '/detection/event', 'std_msgs/String').subscribe(on_detection_event)
    roslibpy.Topic(client, '/detection_info', 'std_msgs/String').subscribe(on_detection_info)
    roslibpy.Topic(client, '/camera/base64', 'std_msgs/String').subscribe(on_camera_base64)
    roslibpy.Topic(client, '/drone/path_update', 'std_msgs/String').subscribe(on_path_update)

# ✅ 프로그램 진입점
if __name__ == "__main__":
    try:
        loop.run_until_complete(main())
        loop.run_forever()
    except KeyboardInterrupt:
        print("🛑 종료 중...")
