// components/MapPlaceholder.jsx
import React from 'react';

function MapPlaceholder() {
  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const latTop = 37.7, latBottom = 37.0;
    const lngLeft = 127.0, lngRight = 127.5;

    const lat = latBottom + (1 - y / rect.height) * (latTop - latBottom);
    const lng = lngLeft + (x / rect.width) * (lngRight - lngLeft);

    console.log(`📍 클릭 위치: 위도 ${lat.toFixed(6)}, 경도 ${lng.toFixed(6)}`);
  };

  return (
    <div
      onClick={handleClick}
      style={{
        width: '100%',
        height: '500px',
        backgroundColor: '#ddd',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '1.5rem',
        fontWeight: 'bold',
        cursor: 'crosshair',
      }}
    >
      지도 화면 자리
    </div>
  );
}

export default MapPlaceholder;
