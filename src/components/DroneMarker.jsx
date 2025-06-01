import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

export default function DroneMarker({ position }) {
  if (!position) return null;
  console.log('🟡 현재 마커 위치:', position);


  const yellowIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png',
    shadowUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });

  return (
    <Marker position={position} icon={yellowIcon}>
      <Popup>드론 현재 위치<br />위도: {position[0]}<br />경도: {position[1]}</Popup>
    </Marker>
  );
}
