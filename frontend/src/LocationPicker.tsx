import { useEffect, useState } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';

interface Location {
  lat: number;
  lng: number;
  description: string;
}

interface LocationPickerProps {
  initialLocation: Location | null;
  onConfirm: (location: Location) => void;
  onCancel?: () => void;
}

const containerStyle = { width: '100%', height: '60vh' }; // responsive map height
const fallbackCenter = { lat: 13.7563, lng: 100.5018 };   // Bangkok
const TH_LANG = 'th';
const TH_REGION = 'TH';

export default function LocationPicker({ initialLocation, onConfirm, onCancel }: LocationPickerProps) {
  /* ───── Load Maps JS API in Thai ───── */
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY,
    libraries: ['places'],
    language: TH_LANG,
    region: TH_REGION,
  });

  
  console.log(`Google maps key: ${JSON.stringify(import.meta.env)}`);

  const [center, setCenter] = useState<google.maps.LatLngLiteral>(initialLocation ?? fallbackCenter);
  const [address, setAddress] = useState<string>(initialLocation?.description ?? 'กำลังค้นหาที่อยู่…');
  const [mapRef, setMapRef] = useState<google.maps.Map | null>(null);
  const [geocoder, setGeocoder] = useState<google.maps.Geocoder | null>(null);

  /* ───── Initialise Geocoder ───── */
  useEffect(() => {
    if (isLoaded && !geocoder) setGeocoder(new window.google.maps.Geocoder());
  }, [isLoaded, geocoder]);

  /* ───── Reverse‑geocode helper (strip Plus Code) ───── */
  const PLUS_CODE_RE = /^[A-Z0-9]{4,7}\+[A-Z0-9]{2,3}\s*/i;
  const cleanPlusCode = (full: string): string => full.replace(PLUS_CODE_RE, '').trim();
  const refreshAddress = (loc: google.maps.LatLngLiteral): void => {
    if (!geocoder) return;
    geocoder.geocode(
      { location: loc, language: TH_LANG },
      (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
        if (status === 'OK' && results?.[0]) {
          setAddress(cleanPlusCode(results[0].formatted_address));
        } else {
          setAddress('ไม่พบชื่อสถานที่');
        }
      }
    );
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
    <div className="pb-bottom-bar fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white w-full sm:w-[92%] sm:max-w-xl h-[70vh] rounded-t-2xl sm:rounded-lg shadow-lg flex flex-col">
        {/* Drag handle for mobile sheet */}
        <div className="sm:hidden w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-2 mb-1"></div>
  
        {/* Header */}
        <div className="px-4">
          <h2 className="text-lg font-bold text-center pb-2">เลือกตำแหน่งของแมว</h2>
          <p className="text-sm text-gray-700 line-clamp-2 pb-2">{address}</p>
        </div>
  
        {/* Map container - takes remaining space */}
        <div className="flex-1 relative">
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
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
  
        {/* Action buttons - fixed to bottom */}
        <div className="p-4 bg-white border-t mt-auto">
          <div className="flex gap-2">
            {onCancel && (
              <button 
                onClick={onCancel} 
                className="flex-1 px-4 py-3 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                ยกเลิก
              </button>
            )}
            <button
              onClick={() => onConfirm({ ...center, description: address })}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              ยืนยัน
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}