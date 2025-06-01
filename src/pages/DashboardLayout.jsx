import React, { useState, useEffect } from 'react';
import DroneStatus from '../components/DroneStatus';
import MissionControl from '../components/MissionControl';
import ParameterControl from '../components/ParameterControl';
import MapPanel from '../components/MapPanel';
import CameraPanel from '../components/CameraPanel';
import DetectionGallery from '../components/DetectionGallery';
import DetectionLog from '../components/DetectionLog';
import { useRosWebsocket } from '../hooks/useRosWebsocket';

export default function DashboardLayout() {
  const { connected, droneState, flightParams, detectionEvents, cameraImage } = useRosWebsocket();

  const [missionActive, setMissionActive] = useState(false);
  const [resetCounter, setResetCounter] = useState(0);
  const [completeCounter, setCompleteCounter] = useState(0);
  const [detectedObjects, setDetectedObjects] = useState([]);

  const [dronePosition, setDronePosition] = useState(null);      // ⬅ 드론 현재 위치
  const [dronePath, setDronePath] = useState([]);                // ⬅ 경로 배열

  useEffect(() => {
    const HOST = process.env.REACT_APP_API_HOST || window.location.hostname;
    const PORT = process.env.REACT_APP_API_PORT || 8000;
    const socket = new WebSocket(`ws://${HOST}:${PORT}/ws`);

    socket.onopen = () => {
      console.log('🟢 WebSocket 연결됨');
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log('📡 WebSocket 수신:', message);

      if (message.type === 'path_update') {
        const { path, position } = message.payload;
        console.log('🟣 path:', path);
        console.log('🟡 position:', position);

        if (Array.isArray(path)) {
          const formattedPath = path.map(p => {
            console.log('🟣 path 점:', p);  // 각 점 로그 출력
            return [p.lat, p.lng];
          });
          setDronePath(formattedPath);
        }

        if (position?.lat && position?.lng) {
          setDronePosition([position.lat, position.lng]);
        }
      }

      if (message.type === 'path_confirmed') {
        alert('✅ 경로가 성공적으로 전송되었습니다!');
      }

      if (message.type === 'detection_event') {
        let parsed = message.payload;
        if (typeof parsed === 'object' && parsed.data) {
          try {
            parsed = JSON.parse(parsed.data);
          } catch (e) {
            console.error('❌ detection_event JSON 파싱 실패:', e);
            return;
          }
        }

        if (!parsed.image_base64) {
          console.warn('⚠️ image_base64 없음 → 렌더링 제외됨:', parsed);
          return;
        }

        console.log('🖼️ 탐지 이벤트 수신:', parsed);
        setDetectedObjects(prev => {
          if (prev.some(obj => obj.timestamp === parsed.timestamp)) return prev;
          return [parsed, ...prev.slice(0, 9)];
        });
      }

      if (message.type === 'detection_info') {
        const parsed = message.payload;
        console.log('📥 실제 탐지 정보 수신:', parsed);
        setDetectedObjects(prev => {
          if (prev.some(obj => obj.timestamp === parsed.timestamp)) return prev;
          return [parsed, ...prev.slice(0, 9)];
        });
      }
    };

    socket.onerror = (err) => {
      console.error('❌ WebSocket 에러:', err);
    };

    socket.onclose = () => {
      console.log('🔴 WebSocket 연결 종료됨');
    };

    return () => socket.close();
  }, []);

  const handleStart = () => setMissionActive(true);
  const handleComplete = () => setCompleteCounter(c => c + 1);
  const handleReset = () => {
    setMissionActive(false);
    setResetCounter(c => c + 1);
    setCompleteCounter(0);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <header style={{
        height: '90px',
        background: '#f5f5f5',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 20px'
      }}>
        <DroneStatus
          connected={connected}
          lat={droneState.lat}
          lon={droneState.lon}
          alt={droneState.alt}
          battery={droneState.battery}
        />
        <MissionControl
          onStart={handleStart}
          onComplete={handleComplete}
          onReset={handleReset}
        />
        <ParameterControl
          speed={flightParams.speed}
          altitude={flightParams.altitude}
          avoidance={flightParams.avoidance}
        />
      </header>

      <main style={{ display: 'flex', flex: 1 }}>
        <MapPanel
          missionActive={missionActive}
          resetCounter={resetCounter}
          completeCounter={completeCounter}
          dronePosition={dronePosition}
          dronePath={dronePath}  // ⬅ 추가됨
        />
        <CameraPanel base64Image={cameraImage} />
      </main>

      <footer style={{
        height: '300px',
        background: '#f0f0f0',
        display: 'flex'
      }}>
        <DetectionGallery objects={detectedObjects} />
        <DetectionLog events={detectionEvents} />
      </footer>
    </div>
  );
}
