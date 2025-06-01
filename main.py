from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse

# FastAPI 앱 초기화
app = FastAPI()

# CORS 설정: 모든 도메인에서 접근 허용 (개발/테스트용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],            # 출처 제한 없이 허용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 연결된 WebSocket 클라이언트를 저장할 리스트
clients = []

# 루트 경로 접근 시 단순 메시지 반환 (헬스 체크 용도)
@app.get("/")
def read_root():
    return HTMLResponse(content="WebSocket server is live")

# WebSocket 연결 핸들러
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    clients.append(websocket)

    try:
        while True:
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                print(f"📨 Received: {data}")
                for client in clients:
                    await client.send_text(data)
            except asyncio.TimeoutError:
                await websocket.send_text("💓 ping")  # 서버에서 응답 유지 시도
    except Exception as e:
        print(f"❌ Client disconnected: {e}")
    finally:
        clients.remove(websocket)
