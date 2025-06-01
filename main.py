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
    # 클라이언트 연결 수락
    await websocket.accept()
    clients.append(websocket)  # 연결된 클라이언트 추가

    try:
        while True:
            # 클라이언트로부터 메시지 수신
            data = await websocket.receive_text()
            print(f"📨 Received: {data}")  # 서버 콘솔 로그

            # 연결된 클라이언트에게 메시지 전송
            for client in clients:
                if client.application_state == websocket.application_state:
                    await client.send_text(f"[Echo] {data}")
    except Exception as e:
        # 예외 발생 시 로그 출력
        print(f"❌ Client disconnected: {e}")
    finally:
        # 연결 종료 시 클라이언트 목록에서 제거
        clients.remove(websocket)
