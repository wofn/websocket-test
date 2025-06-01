import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polygon, Polyline,  useMapEvent } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import DroneMarker from './DroneMarker';

// 기본 아이콘 설정
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});
// 번호 마커 아이콘 생성 함수
const numberedIcon = (number) =>
  L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="
      background-color: white;
      border: 2px solid #333;
      border-radius: 50%;
      width: 28px;
      height: 28px;
      line-height: 28px;
      text-align: center;
      font-weight: bold;
      font-size: 14px;
      color: black;
    ">${number}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
  });

// 시작점: 빨간 마커
const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// 그 외 점: 파란 마커
const blueIcon = new L.Icon.Default();

// 지도 클릭 이벤트 핸들러
function ClickHandler({ missionActive, onAddPoint }) {
  useMapEvent('click', (e) => {
    if (!missionActive) return;
    const { lat, lng } = e.latlng;
    onAddPoint([lat, lng]);
  });
  return null;
}

export default function MapPanel({ missionActive, resetCounter, completeCounter, dronePosition, dronePath }) {
  console.log('🟡 MapPanel props 확인 → dronePath:', dronePath);
  console.log('🟡 MapPanel props 확인 → dronePosition:', dronePosition);
  const [points, setPoints] = useState([]);
  const [inputLat, setInputLat] = useState('');
  const [inputLng, setInputLng] = useState('');
  const mapRef = useRef();

  const HOST = process.env.REACT_APP_API_HOST || window.location.hostname;
  const PORT = process.env.REACT_APP_API_PORT || 8000;
  const SERVER_URL = `http://${HOST}:${PORT}`;

  useEffect(() => {
    if (missionActive) setPoints([]);
  }, [missionActive]);

  useEffect(() => {
    setPoints([]);
  }, [resetCounter]);

  useEffect(() => {
    if (completeCounter > 0) {
      if (points.length < 2) {
        console.warn('⚠️ 최소한 시작점 + 다각형 좌표가 필요합니다.');
        return;
      }

      const start = points[0];
      const polygon = points.slice(1);

      console.log('🛰️ 임무 완료 좌표:');
      console.log(`시작 좌표: [${start[0].toFixed(6)}, ${start[1].toFixed(6)}]`);
      polygon.forEach((p, idx) => {
        console.log(`  ${idx + 1}: [${p[0].toFixed(6)}, ${p[1].toFixed(6)}]`);
      });

      fetch(`${SERVER_URL}/mission_complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start, polygon }),
      })
        .then((res) => res.json())
        .then((data) => console.log('✅ 서버 응답:', data))
        .catch((err) => console.error('❌ POST 요청 실패:', err));
    }
  }, [completeCounter, points, SERVER_URL]);

  const addPoint = (latlng) => {
    setPoints((prev) => [...prev, latlng]);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    const lat = parseFloat(inputLat);
    const lng = parseFloat(inputLng);
    if (!isNaN(lat) && !isNaN(lng)) {
      const newPos = [lat, lng];
      mapRef.current?.setView(newPos, 15);
      setInputLat('');
      setInputLng('');
    }
  };

  const center = points.length > 0 ? points[0] : [37.5705, 126.9810];

useEffect(() => {
  if (mapRef.current && dronePath && dronePath.length > 1) {
    const bounds = L.latLngBounds(dronePath);
    mapRef.current.fitBounds(bounds, { padding: [30, 30] });
    console.log('📐 드론 경로에 맞게 지도 확대/이동');
  }
}, [dronePath]);

  return (
    <>
      {/* 좌표 입력 폼 */}
      <form
        onSubmit={handleManualSubmit}
        style={{
          position: 'absolute',
          top: 10,
          left: 10,
          zIndex: 1000,
          background: '#fff',
          padding: '10px',
          borderRadius: '6px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
        }}
      >
        <input
          type="text"
          placeholder="위도"
          value={inputLat}
          onChange={(e) => setInputLat(e.target.value)}
          style={{ width: '100px', marginRight: '5px' }}
        />
        <input
          type="text"
          placeholder="경도"
          value={inputLng}
          onChange={(e) => setInputLng(e.target.value)}
          style={{ width: '100px', marginRight: '5px' }}
        />
        <button type="submit">이동</button>
      </form>

      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        whenCreated={(m) => {
          mapRef.current = m;
        }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <ClickHandler missionActive={missionActive} onAddPoint={addPoint} />

        {points.map((pos, idx) => (
          <Marker key={idx} position={pos} icon={idx === 0 ? redIcon : blueIcon} />
        ))}

        {points.length > 2 && (
          <Polygon
            positions={points.slice(1)}
            pathOptions={{ color: 'green', fillColor: 'green', fillOpacity: 0.3 }}
          />
        )}

        {/* ✅ 드론 경로 표시 (Polyline) */}
        {dronePath && dronePath.length > 1 && (
          <Polyline positions={dronePath} pathOptions={{ color: 'purple' }} />
        )}

         {/* ✅ 드론 경로에 번호 마커 표시 */}
  {dronePath && dronePath.length > 0 && (
    dronePath.map((pos, idx) => (
      <Marker
        key={`number-${idx}`}
        position={pos}
        icon={numberedIcon(idx + 1)}
      />
    ))
  )}

        {/* ✅ 드론 현재 위치 표시 (노란 마커) */}
        <DroneMarker position={dronePosition} />
      </MapContainer>
    </>
  );
}
