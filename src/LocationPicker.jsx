// src/LocationPicker.jsx — modal picker (Thai, no Plus Code)
import React, { useEffect, useState } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';

const containerStyle = { width: '100%', height: '320px' };
const fallbackCenter = { lat: 13.7563, lng: 100.5018 }; // Bangkok
const TH_LANG = 'th';
const TH_REGION = 'TH';

export default function LocationPicker({ initialLocation, onConfirm, onCancel }) {
  /* ───── Load Maps JS API in Thai ───── */
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY,
    libraries: ['places'],
    language: TH_LANG,
    region: TH_REGION,
  });

  const [center, setCenter] = useState(initialLocation ?? fallbackCenter);
  const [address, setAddress] = useState(initialLocation?.description ?? 'กำลังค้นหาที่อยู่…');
  const [mapRef, setMapRef] = useState(null);
  const [geocoder, setGeocoder] = useState(null);

  /* ───── Initialise Geocoder ───── */
  useEffect(() => {
    if (isLoaded && !geocoder) setGeocoder(new window.google.maps.Geocoder());
  }, [isLoaded, geocoder]);

  /* ───── Reverse‑geocode helper (strip Plus Code) ───── */
  const PLUS_CODE_RE = /^[A-Z0-9]{4,7}\+[A-Z0-9]{2,3}\s*/i; // e.g. "PJ52+J8G "
  const cleanPlusCode = (full) => full.replace(PLUS_CODE_RE, '').trim();

  const refreshAddress = (loc) => {
    if (!geocoder) return;
    geocoder.geocode({ location: loc, language: TH_LANG }, (results, status) => {
      if (status === 'OK' && results?.[0]) {
        const raw = results[0].formatted_address;
        setAddress(cleanPlusCode(raw));
      } else {
        setAddress('ไม่พบชื่อสถานที่');
      }
    });
  };

  /* ───── Try browser geolocation (first load) ───── */
  useEffect(() => {
    if (initialLocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { timeout: 4000 }
    );
  }, [initialLocation]);

  /* ───── Debounce address lookup when centre changes ───── */
  useEffect(() => {
    if (!geocoder) return;
    const id = setTimeout(() => refreshAddress(center), 300);
    return () => clearTimeout(id);
  }, [center, geocoder]);

  if (!isLoaded) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white p-4 rounded shadow">กำลังโหลดแผนที่…</div>
      </div>
    );
  }

  /* ───── UI ───── */
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white w-[92%] max-w-xl rounded-lg shadow-lg p-4 space-y-4">
        <h2 className="text-lg font-bold text-center">เลือกตำแหน่งของแมว</h2>

        <p className="text-sm text-gray-700 line-clamp-2">{address}</p>

        {/* Map wrapper with pinned centre */}
        <div className="relative">
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={16}
            onLoad={setMapRef}
            onDragEnd={() => {
              if (!mapRef) return;
              const pos = mapRef.getCenter();
              if (pos) setCenter(pos.toJSON());
            }}
          />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z" />
              <circle cx="12" cy="10" r="3" fill="#ef4444" />
            </svg>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-2">
          {onCancel && (
            <button onClick={onCancel} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">
              ยกเลิก
            </button>
          )}
          <button
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            onClick={() => onConfirm({ ...center, description: address })}
          >
            ยืนยัน
          </button>
        </div>
      </div>
    </div>
  );
}
