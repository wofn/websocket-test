import { useState, useEffect, useRef } from 'react';

const HOST = process.env.REACT_APP_API_HOST || window.location.hostname;
const PORT = process.env.REACT_APP_API_PORT || 8000;
const DEFAULT_WS_URL = `ws://${HOST}:${PORT}/ws`;

function safeParseJSON(input) {
  try {
    return typeof input === 'string' ? JSON.parse(input) : input;
  } catch (e) {
    console.warn('⚠️ JSON 파싱 실패:', e, input);
    return null;
  }
}

export function useRosWebsocket(url = DEFAULT_WS_URL) {
  const [connected, setConnected] = useState(false);
  const [droneState, setDroneState] = useState({
    lat: null,
    lon: null,
    alt: null,
    battery: null,
  });
  const [flightParams, setFlightParams] = useState({
    speed: null,
    altitude: null,
    avoidance: null,
  });
  const [detectionEvents, setDetectionEvents] = useState([]);
  const timeoutRef = useRef(null);
  const [cameraImage, setCameraImage] = useState('');


  useEffect(() => {
    const socket = new WebSocket(url);

    const resetTimeout = () => {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setConnected(false), 5000);
      setConnected(true);
    };

    socket.onopen = () => {
      setConnected(true);
      resetTimeout();
    };

    socket.onclose = () => setConnected(false);
    socket.onerror = () => setConnected(false);

    socket.onmessage = (event) => {
      try {
        const msg = safeParseJSON(event.data);
        let payload = safeParseJSON(msg?.payload);

        switch (msg?.type) {
          case 'drone_state': {
            console.log('📡 원본 drone_state 메시지:', payload);
            const inner = safeParseJSON(payload?.data);
            if (inner && inner.lat && inner.lon) {
              console.log('✅ 파싱된 drone_state:', inner);
              setDroneState({
                lat: parseFloat(inner.lat),
                lon: parseFloat(inner.lon),
                alt: parseFloat(inner.alt),
                battery: parseFloat(inner.battery),
              });
              resetTimeout();
            }
            break;
          }

          case 'param_update':
            setFlightParams(payload);
            break;

          case 'detection_event':
            setDetectionEvents((prev) => {
              const updated = [...prev, payload];
              return updated.length > 10 ? updated.slice(-10) : updated;
            });
            break;

          case 'camera': {
            try {
               const camera = typeof payload === 'string' ? JSON.parse(payload) : payload;
               if (camera && camera.image_base64) {
                 setCameraImage(camera.image_base64);
               }
             } catch (err) {
               console.warn('📛 camera payload 파싱 실패:', err, payload);
            }
             break;
           }
            
            

          default:
            break;
        }
      } catch (e) {
        console.warn('❌ WS 메시지 처리 실패:', e);
      }
    };

    return () => {
      clearTimeout(timeoutRef.current);
      socket.close();
    };
  }, [url]);

  return { connected, droneState, flightParams, detectionEvents,cameraImage };
}
