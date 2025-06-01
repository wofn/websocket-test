import React from 'react';

export default function CameraPanel({ base64Image }) {
  return (
    <div style={{ width: '50%', padding: '10px', background: '#eaeaea' }}>
      {base64Image ? (
        <img
          src={`data:image/jpeg;base64,${base64Image}`}
          alt="camera feed"
          style={{ width: '100%', height: '100%' }}
        />
      ) : (
        <p>카메라 데이터를 기다리는 중...</p>
      )}
    </div>
  );
}
