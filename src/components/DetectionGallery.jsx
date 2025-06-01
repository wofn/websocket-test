import React from 'react';

export default function DetectionGallery({ objects = [] }) {
  return (
    <div style={{ width: '50%', padding: '10px', overflowY: 'auto', background: '#fff' }}>
      <h3>탐지된 이미지</h3>
      {objects.length === 0 ? (
        <p>아직 탐지된 이미지가 없습니다.</p>
      ) : (
        objects.map((obj, idx) => (
          <div
            key={obj.timestamp || idx}
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '15px',
              borderBottom: '1px solid #ccc',
              paddingBottom: '10px'
            }}
          >
            {obj.image_base64 ? (
              <img
                src={`data:image/png;base64,${obj.image_base64}`}
                alt={obj.label || '탐지 객체'}
                width="180"
                height="135"
                style={{ border: '1px solid #999', marginRight: '12px' }}
              />
            ) : (
              <div
                style={{
                  width: '180px',
                  height: '135px',
                  background: '#eee',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '12px',
                  border: '1px solid #999',
                  fontSize: '0.9rem',
                  color: '#666'
                }}
              >
                이미지 없음
              </div>
            )}

            <div>
              <div><strong>{obj.label || 'Label 없음'}</strong></div>
              <div>신뢰도: {Math.round((obj.confidence || 0) * 100)}%</div>
              <div>
                시각:{' '}
                {obj.timestamp
                  ? new Date(obj.timestamp).toLocaleString('ko-KR', {
                      timeZone: 'Asia/Seoul',
                      hour12: false
                    })
                  : '정보 없음'}
              </div>
              {obj.location && (
                <div style={{ fontSize: '0.85rem', color: '#555' }}>
                  위치: {obj.location.lat}, {obj.location.lon}
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
