# backend/main.py
from fastapi import FastAPI, WebSocket, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import threading
import ros_client
from ros_client import publish_coords, publish_mission_complete
from broadcast import connected_clients

# 반드시 최상단에 선언
app = FastAPI()

# CORS 허용 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 서버 시작 시 ROS 연결 및 더미 데이터 루프 시작
@app.on_event("startup")
async def startup_event():
    try:
        ros_client.loop = asyncio.get_event_loop()
        threading.Thread(target=ros_client.init_ros, daemon=True).start()
        print("✅ ROS 연결 시작됨 (비동기 스레드)")
    except Exception as e:
        print(f"❌ ROS 연결 실패: {e}")

    # ✅ 더미 탐지 이벤트 루프 실행
    if hasattr(ros_client, "send_dummy_detection_loop"):
        print("🟡 더미 탐지 루프 실행 시작")
        asyncio.create_task(ros_client.send_dummy_detection_loop())

# WebSocket 엔드포인트
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_clients.add(websocket)
    print("🟢 WebSocket 클라이언트 연결됨")
    try:
        while True:
            await asyncio.sleep(1)  # 연결 유지용 루프
    except Exception:
        print("🔴 WebSocket 클라이언트 해제됨")
        connected_clients.remove(websocket)

# 클릭 좌표 수신 → ROS에 발행
@app.post("/coordinates")
async def receive_coordinates(request: Request):
    data = await request.json()
    lat = data.get("lat")
    lng = data.get("lng")
    print(f"📍 좌표 수신: 위도 {lat}, 경도 {lng}")
    publish_coords(lat, lng)
    return JSONResponse(content={"status": "ok"})

# 임무 완료 시 전체 좌표 전송
@app.post("/mission_complete")
async def mission_complete(request: Request):
    data = await request.json()
    start = data.get("start")
    polygon = data.get("polygon", [])

    print("🚁 임무 완료 수신:")
    print("시작 좌표:", start)
    for i, point in enumerate(polygon):
        print(f"  {i+1}: {point}")

    # ROS2로 publish
    publish_mission_complete(start, polygon)

    # ✅ WebSocket으로 연결된 클라이언트들에게 응답 전송
    for client in list(connected_clients):  # 복사본 순회
        try:
            await client.send_json({
                "type": "path_confirmed",
                "payload": {
                    "message": "경로 생성 및 전송 완료됨",
                    "start": start,
                    "polygon": polygon
                }
            })
        except Exception as e:
            print("🔴 WebSocket 응답 실패:", e)
            connected_clients.remove(client)

    return JSONResponse(content={"status": "mission_received"})

# 카메라 이미지 WebSocket
@app.websocket("/ws/image")
async def websocket_image_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("🧠 /ws/image 클라이언트 수신 시작")

    def handle_image(msg):
        image_base64 = msg['data']
        asyncio.run_coroutine_threadsafe(websocket.send_text(image_base64), ros_client.loop)

    try:
        ros_client.subscribe('/camera/base64', handle_image)
    except Exception as e:
        print("❌ 토픽 구독 실패:", e)
        await websocket.close()
        return

    try:
        while True:
            await asyncio.sleep(1)
    except Exception as e:
        print("🔴 WebSocket 이미지 연결 종료:", e)
