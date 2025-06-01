from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
import asyncio

app = FastAPI()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
    print("✅ Client connected")

    async def receive_messages():
        try:
            while True:
                data = await websocket.receive_text()
                print(f"📨 Received: {data}")
                for client in clients:
                    if client != websocket:
                        await client.send_text(data)
        except Exception as e:
            print(f"❌ Receive error: {e}")
    
    async def send_pings():
        try:
            while True:
                await asyncio.sleep(10)
                await websocket.send_text("💓 ping")
        except Exception as e:
            print(f"❌ Ping error: {e}")

    receive_task = asyncio.create_task(receive_messages())
    ping_task = asyncio.create_task(send_pings())

    # wait until one fails
    done, pending = await asyncio.wait(
        [receive_task, ping_task],
        return_when=asyncio.FIRST_EXCEPTION
    )

    for task in pending:
        task.cancel()

    clients.remove(websocket)
    print("❎ Client removed")
