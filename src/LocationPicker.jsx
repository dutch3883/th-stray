// src/LocationPicker.jsx — mobile‑friendly bottom‑sheet modal (Thai, no Plus Code)
import React, { useEffect, useState } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';

const containerStyle = { width: '100%', height: '60vh' }; // responsive map height
const fallbackCenter = { lat: 13.7563, lng: 100.5018 };   // Bangkok
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
  const PLUS_CODE_RE = /^[A-Z0-9]{4,7}\+[A-Z0-9]{2,3}\s*/i;
  const cleanPlusCode = (full) => full.replace(PLUS_CODE_RE, '').trim();
  const refreshAddress = (loc) => {
    if (!geocoder) return;
    geocoder.geocode({ location: loc, language: TH_LANG }, (results, status) => {
      if (status === 'OK' && results?.[0]) setAddress(cleanPlusCode(results[0].formatted_address));
      else setAddress('ไม่พบชื่อสถานที่');
    });
  };

  /* ───── Browser geolocation (first load) ───── */
  useEffect(() => {
    if (initialLocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { timeout: 4000 }
    );
  }, [initialLocation]);

  /* ───── Debounce address lookup ───── */
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
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
      {/* Bottom sheet on mobile, centred card on ≥sm */}
      <div className="bg-white w-full sm:w-[92%] sm:max-w-xl h-[85vh] sm:h-auto rounded-t-2xl sm:rounded-lg shadow-lg flex flex-col">
        {/* Drag handle for mobile sheet */}
        <div className="sm:hidden w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-2 mb-1"></div>

        <h2 className="text-lg font-bold text-center px-4">เลือกตำแหน่งของแมว</h2>

        <p className="text-sm text-gray-700 line-clamp-2 px-4">{address}</p>

        {/* Map section */}
        <div className="relative flex-1">
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
          {/* Center pin */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z" />
              <circle cx="12" cy="10" r="3" fill="#ef4444" />
            </svg>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-2 p-4 border-t">
          {onCancel && (
            <button onClick={onCancel} className="flex-1 sm:flex-none px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">
              ยกเลิก
            </button>
          )}
          <button
            onClick={() => onConfirm({ ...center, description: address })}
            className="flex-1 sm:flex-none px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            ยืนยัน
          </button>
        </div>
      </div>
    </div>
  );
}
