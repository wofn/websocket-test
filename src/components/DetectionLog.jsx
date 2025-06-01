import React from 'react';

export default function DetectionLog({ events }) {
  return (
    <div style={{ width: '50%', background: '#ddd', padding: '10px', overflowY: 'auto' }}>
      <h3>탐지 이벤트 로그</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {events.map((event, index) => (
          <li key={index}>[{event.time}] {event.type} 감지</li>
        ))}
      </ul>
    </div>
  );
}