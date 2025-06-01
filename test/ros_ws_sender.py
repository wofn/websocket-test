import asyncio
import websockets

async def send_message():
    uri = "wss://websocket-test-o6mq.onrender.com/ws"
    async with websockets.connect(uri) as websocket:
        while True:
            msg = input("📝 전송할 메시지 입력: ")
            await websocket.send(msg)
            print("📤 메시지 전송 완료")

asyncio.run(send_message())
