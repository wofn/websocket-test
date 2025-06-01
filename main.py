from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 모든 출처 허용 (테스트 용)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

clients = []

@app.get("/")
def read_root():
    return HTMLResponse(content="WebSocket server is live")

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    clients.append(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            print(f"📨 Received: {data}")
            for client in clients:
                if client.application_state == websocket.application_state:
                    await client.send_text(f"[Echo] {data}")
    except Exception as e:
        print(f"❌ Client disconnected: {e}")
    finally:
        clients.remove(websocket)
