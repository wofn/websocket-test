// src/components/MissionControl.jsx
import React from 'react';

export default function MissionControl({ onStart, onComplete, onReset }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      justifyContent: 'center'
    }}>
      <h4 style={{ margin: 0, textAlign: 'center' }}>임무 제어</h4>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
        <button onClick={onStart}>좌표 찍기 허용</button>
        <button onClick={onComplete}>좌표 전송</button>
        <button onClick={onReset}>초기화</button>
      </div>
    </div>
  );
}
