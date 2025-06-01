// src/components/DroneStatus.jsx
import React from 'react';

export default function DroneStatus({ connected, lat, lon, alt, battery }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '5px',
      height: '100%',                    // 추가: 헤더 높이에 맞춰 늘리기
      justifyContent: 'center'           // 콘텐츠 중앙 정렬
    }}>
      <h4 style={{ margin: 0 }}>드론 상태 {connected ? '🟢' : '🔴 연결 끊김'}</h4>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        <li>
          위치:{' '}
          {Number.isFinite(lat) && Number.isFinite(lon)
            ? `${lat.toFixed(6)}, ${lon.toFixed(6)}`
            : '-'}
        </li>
        <li>
          고도:{' '}
          {Number.isFinite(alt) ? `${alt.toFixed(1)} m` : '-'}
        </li>
        <li>
          배터리:{' '}
          {Number.isFinite(battery) ? `${battery.toFixed(1)} %` : '-'}
        </li>
      </ul>
    </div>
  );
}
