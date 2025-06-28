import { useEffect, useState } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from './contexts/LanguageContext';
import { env } from './config/environment';

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
const TH_REGION = 'TH';

// Bangkok and connected provinces boundaries
const BANGKOK_BOUNDS = {
  north: 14.2,  // Northern boundary
  south: 13.4,  // Southern boundary
  east: 100.8,  // Eastern boundary
  west: 100.3   // Western boundary
};

// Function to check if a location is within Bangkok and connected provinces
const isWithinBangkokArea = (lat: number, lng: number): boolean => {
  return lat >= BANGKOK_BOUNDS.south && 
         lat <= BANGKOK_BOUNDS.north && 
         lng >= BANGKOK_BOUNDS.west && 
         lng <= BANGKOK_BOUNDS.east;
};

export default function LocationPicker({ initialLocation, onConfirm, onCancel }: LocationPickerProps) {
  const { t, language } = useLanguage();
  const [searchParams] = useSearchParams();
  const bypassLocation = searchParams.get('bypassLocation') === 'true';

  // Use a fixed language for the loader to prevent conflicts
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: env.googleMaps.apiKey,
    libraries: ['places'],
    language: language || 'th', // Use current language with fallback to prevent conflicts
    region: 'TH',
    nonce: '1234567890'
  });

  const [center, setCenter] = useState<google.maps.LatLngLiteral>(initialLocation ?? fallbackCenter);
  const [address, setAddress] = useState<string>(initialLocation?.description ?? t('location.searching_address'));
  const [mapRef, setMapRef] = useState<google.maps.Map | null>(null);
  const [geocoder, setGeocoder] = useState<google.maps.Geocoder | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);

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
      { location: loc, language: language }, // Use current language for geocoding
      (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
        if (status === 'OK' && results?.[0]) {
          setAddress(cleanPlusCode(results[0].formatted_address));
        } else {
          setAddress(t('location.address_not_found'));
        }
      }
    );
  };

  const getCurrentLocation = async () => {
    setIsRequestingLocation(true);
    setLocationError(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        });
      });

      const { latitude, longitude } = position.coords;
      
      if (!bypassLocation && !isWithinBangkokArea(latitude, longitude)) {
        setLocationError(t('location.outside_bangkok_area'));
        return;
      }

      const newPosition = { lat: latitude, lng: longitude };
      setCenter(newPosition);
      refreshAddress(newPosition);
      
      if (mapRef) {
        mapRef.setCenter(newPosition);
        mapRef.setZoom(16);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      if (error instanceof GeolocationPositionError) {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError(t('location.error.permission_denied'));
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError(t('location.error.position_unavailable'));
            break;
          case error.TIMEOUT:
            setLocationError(t('location.error.timeout'));
            break;
          default:
            setLocationError(t('location.error.general'));
        }
      } else {
        setLocationError(t('location.error.general'));
      }
    } finally {
      setIsRequestingLocation(false);
    }
  };

  /* ───── Browser geolocation (first load) ───── */
  useEffect(() => {
    if (initialLocation) return;
    getCurrentLocation();
  }, [initialLocation]);

  /* ───── Debounce address lookup ───── */
  useEffect(() => {
    if (!geocoder) return;
    const id = setTimeout(() => refreshAddress(center), 300);
    return () => clearTimeout(id);
  }, [center, geocoder, language]);

  if (!isLoaded) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white p-4 rounded shadow">{t('location.loading_map')}</div>
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
          <h2 className="text-lg font-bold text-center pb-2">{t('location.title')}</h2>
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

          {/* Current location button */}
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={getCurrentLocation}
              disabled={isRequestingLocation}
              className="bg-white p-3 rounded-full shadow-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              title={t('location.use_current_location')}
            >
              {isRequestingLocation ? (
                <svg className="animate-spin h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5 text-gray-600" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" 
                    />
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" 
                    />
                  </svg>
                  <span className="text-sm font-medium text-gray-600">{t('location.current_location')}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error message */}
        {locationError && (
          <div className="px-4 py-2 text-sm text-red-600 bg-red-50">
            {locationError}
          </div>
        )}
  
        {/* Action buttons - fixed to bottom */}
        <div className="p-4 bg-white border-t mt-auto">
          <div className="flex gap-2">
            {onCancel && (
              <button 
                onClick={onCancel} 
                className="flex-1 px-4 py-3 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                {t('common.cancel')}
              </button>
            )}
            <button
              onClick={() => onConfirm({ ...center, description: address })}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              {t('common.confirm')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}