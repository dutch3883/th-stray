// src/LocationPicker.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '400px',
};

const center = {
  lat: 13.7563,
  lng: 100.5018,
};

export default function LocationPicker() {
  const navigate = useNavigate();
  const [mapCenter, setMapCenter] = useState(center);
  const [description, setDescription] = useState('');

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY,
  });

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(pos => {
      setMapCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    });
  }, []);

  const handleConfirm = () => {
    localStorage.setItem('pickedLocation', JSON.stringify({
      lat: mapCenter.lat,
      lng: mapCenter.lng,
      description,
    }));
    navigate('/');
  };

  if (!isLoaded) return <div>Loading map...</div>;

  return (
    <div className="space-y-4 p-4">
      <div className="text-center text-lg font-bold">เลือกตำแหน่งของแมว</div>
      <input
        type="text"
        className="w-full p-2 border"
        placeholder="รายละเอียดสถานที่ (เช่น หน้าร้านสะดวกซื้อใกล้ BTS)"
        value={description}
        onChange={e => setDescription(e.target.value)}
      />
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={mapCenter}
        zoom={16}
        onCenterChanged={() => {
          const map = window.google?.maps?.Map;
          if (map) setMapCenter(map.getCenter().toJSON());
        }}
        onDragEnd={(e) => {
          setMapCenter(e.center.toJSON());
        }}
      />
      <div className="text-center">
        <button onClick={handleConfirm} className="bg-green-600 text-white px-4 py-2 rounded">
          ยืนยันตำแหน่งนี้
        </button>
      </div>
    </div>
  );
}
