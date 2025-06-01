// src/components/ParameterControl.jsx
import React from 'react';

export default function ParameterControl({ speed, altitude, avoidance }) {
  return (
    <div style={{
      textAlign: 'right',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',                    // 추가: 헤더 높이에 맞춰 늘리기
      justifyContent: 'center'           // 텍스트 중앙 정렬
    }}>
      <h4 style={{ margin: 0 }}>파라미터 조정</h4>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        <li>비행속도: {Number.isFinite(speed) ? `${speed.toFixed(1)} m/s` : '-'}</li>
        <li>비행고도: {Number.isFinite(altitude) ? `${altitude.toFixed(1)} m` : '-'}</li>
        <li>회피 민감도: {avoidance ?? '-'}</li>
      </ul>
    </div>
  );
}
