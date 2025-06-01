# 현재 연결된 모든 WebSocket 클라이언트를 저장하는 집합
connected_clients = set()

# 연결된 모든 클라이언트에게 message(JSON)를 전송하는 비동기 함수
async def broadcast(message: dict): #broadcast()는 ROS에서 받은 메시지 등을 실시간으로 모든 클라이언트에게 전파
    dead_clients = set()  # 전송 중 연결이 끊어진 클라이언트를 모아두는 임시 set

    # 연결된 모든 클라이언트에게 순차적으로 메시지를 전송
    for client in connected_clients: #connected_clients는 WebSocket으로 접속한 React 등 클라이언트들을 관리하는 전역 저장소
        try:
            # JSON 형태로 메시지를 전송
            await client.send_json(message)
        except Exception as e:
            # 전송 실패한 클라이언트를 dead_clients에 저장
            print(f"❌ WebSocket 전송 실패 → 클라이언트 제거: {e}")
            dead_clients.add(client)
    
    # dead_clients에 저장된 클라이언트를 connected_clients에서 제거
    for dc in dead_clients:
        connected_clients.remove(dc)
