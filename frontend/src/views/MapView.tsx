import { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, InfoWindow } from '@react-google-maps/api';
import { api } from '../services/apiService';
import { Report, ReportStatus, CatType } from '../types/report';
import { Spinner } from '../components/Spinner';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { StatusUpdateModal } from '../components/StatusUpdateModal';
import { useLanguage } from '../contexts/LanguageContext';
import { MapFilterBar } from '../components/MapFilterBar';
import { MapLegend } from '../components/MapLegend';
import { MapLocationButton } from '../components/MapLocationButton';
import { MapNoMatchesMessage } from '../components/MapNoMatchesMessage';
import { 
  getMarkerColor, 
  getStatusColor, 
  isWithinBangkokArea,
  MARKER_PATH,
  infoWindowStyles,
  calculateTravelTimes,
  formatTravelTime
} from '../utils/mapUtils';
import { logDebug, logInfo, logWarn, logError, logger } from '../services/LoggingService';

const containerStyle = {
  width: '100%',
  height: 'calc(100vh - 64px)' // Account for the filter bar height
};

const defaultCenter = {
  lat: 13.7563,
  lng: 100.5018
};

// Static libraries array to prevent script reloading
const GOOGLE_MAPS_LIBRARIES: ("places" | "geometry")[] = ['places', 'geometry'];

interface URLParams {
  reportId?: number | null;
  type?: CatType | 'all';
  status?: ReportStatus | 'all';
  samePage?: boolean;
  bypassLocation?: boolean;
}

// Type definition for CustomMarker
interface CustomMarker {
  position: google.maps.LatLng;
  status: ReportStatus;
  type: CatType;
  reportId: number;
  marker: google.maps.Marker;
  travelTime: string | null;
  isCalculatingTravelTime: boolean;
  hideStatusText: () => void;
  showStatusText: () => void;
  updateStatusText: () => void;
  calculateTravelTimeFromLocation: (origin: google.maps.LatLng | null) => Promise<void>;
  onRemove: () => void;
  addClickListener: (callback: () => void) => void;
}

// Global debug function for console access
declare global {
  interface Window {
    mapViewDebug: {
      getReports: () => Report[];
      getMarkers: () => CustomMarker[];
      getSelectedReport: () => Report | null;
      getFilters: () => { type: CatType | 'all'; status: ReportStatus | 'all' };
      getMapState: () => { center: any; zoom: number | undefined; isLoaded: boolean };
      setLogLevel: (level: number) => void;
      getLogLevel: () => number;
      refreshReports: () => Promise<void>;
      clearFilters: () => void;
      focusReport: (reportId: number) => void;
      getCurrentLocation: () => void;
      help: () => void;
    };
  }
}

export const MapView = () => {
  const { t, language } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const updateURLParams = (
    setSearchParams: (params: URLSearchParams) => void,
    currentParams: URLSearchParams,
    updates: URLParams,
    replace: boolean = false
  ) => {
    const params = replace ? new URLSearchParams() : new URLSearchParams(currentParams);
    
    if (replace) {
      // Replace mode: set all parameters from the updates object
      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (typeof value === 'boolean') {
            params.set(key, value.toString());
          } else {
            params.set(key, value.toString());
          }
        }
      });
    } else {
      // Update mode: only update specified fields
      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (typeof value === 'boolean') {
            params.set(key, value.toString());
          } else {
            params.set(key, value.toString());
          }
        } else {
          // Remove parameter if value is null, undefined, or empty string
          params.delete(key);
        }
      });
    }
    
    setSearchParams(params);
  };

  const getURLParams = (searchParams: URLSearchParams): URLParams => {
    return {
      reportId: searchParams.get('reportId') ? Number(searchParams.get('reportId')) : null,
      type: (searchParams.get('type') as CatType) || 'all',
      status: (searchParams.get('status') as ReportStatus) || 'all',
      samePage: searchParams.get('samePage') === 'true',
      bypassLocation: searchParams.get('bypassLocation') === 'true',
    };
  };

  // Get initial states from URL parameters using unified function
  const urlParams = getURLParams(searchParams);
  const reportId = urlParams.reportId;
  const initialTypeFilter = urlParams.type || 'all';
  const initialStatusFilter = urlParams.status || 'all';
  const isSamePage = urlParams.samePage || false;
  
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showInfoWindow, setShowInfoWindow] = useState(false);
  const [newStatus, setNewStatus] = useState<ReportStatus>(ReportStatus.PENDING);
  const [remark, setRemark] = useState('');
  const [typeFilter, setTypeFilter] = useState<CatType | 'all'>(initialTypeFilter);
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>(initialStatusFilter);
  const [mapRef, setMapRef] = useState<google.maps.Map | null>(null);
  const markersRef = useRef<CustomMarker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const reportsRef = useRef<Report[]>([]);
  const [isLegendCollapsed, setIsLegendCollapsed] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<google.maps.LatLng | null>(null);
  const [currentLocationMarker, setCurrentLocationMarker] = useState<google.maps.Marker | null>(null);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [myLocationSelected, setMyLocationSelected] = useState<google.maps.LatLng | null>(null);
  
  // Track previous marker dependency values for comparison
  const prevMarkerDepsRef = useRef<{
    hasMap: boolean;
    isLoaded: boolean;
    reportsCount: number;
    typeFilter: CatType | 'all';
    statusFilter: ReportStatus | 'all';
    reportId: number | null;
    showInfoWindow: boolean;
    currentLocation: boolean;
    language: string;
  } | null>(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
    language: language || 'th', // Use current language with fallback to prevent conflicts
    region: 'TH',
  });

  // Update reportsRef when reports change
  useEffect(() => {
    reportsRef.current = reports;
  }, [reports]);

  // Update URL when filters change using unified function
  useEffect(() => {
    updateURLParams(setSearchParams, searchParams, {
      reportId,
      type: typeFilter,
      status: statusFilter,
      samePage: isSamePage
    });
  }, [reportId, typeFilter, statusFilter, isSamePage, setSearchParams, searchParams]);

  const handleMarkerClick = useCallback((report: Report) => {
    logInfo('User selected report', { reportId: report.id, type: report.type, status: report.status });
    updateURLParams(setSearchParams, searchParams, {
      reportId: report.id,
      samePage: true
    });
    setSelectedReport(report);
    setShowInfoWindow(true);
    setMyLocationSelected(null);
  }, [setSearchParams, searchParams]);

  // Custom marker class that extends OverlayView
  const createCustomMarker = (
    position: google.maps.LatLng,
    status: ReportStatus,
    type: CatType,
    reportId: number,
    map: google.maps.Map
  ): CustomMarker => {
    class CustomMarkerClass extends google.maps.OverlayView {
      public position: google.maps.LatLng;
      public status: ReportStatus;
      public type: CatType;
      public reportId: number;
      public marker: google.maps.Marker;
      public travelTime: string | null = null;
      public isCalculatingTravelTime: boolean = false;
      private statusText: HTMLDivElement;
      private map: google.maps.Map;
      private clickCallback: (() => void) | null = null;

      constructor() {
        super();
        this.position = position;
        this.status = status;
        this.type = type;
        this.reportId = reportId;
        this.map = map;

        // Create marker with enhanced styling
        this.marker = new google.maps.Marker({
          position: position,
          map: map,
          icon: {
            path: MARKER_PATH,
            fillColor: getMarkerColor(type),
            fillOpacity: 1,
            strokeWeight: 1.5,
            strokeColor: "#FFFFFF",
            scale: 1.8,
            anchor: new google.maps.Point(12, 24),
            labelOrigin: new google.maps.Point(12, 8),
          },
          title: `${t('map.report')} #${reportId}`,
          zIndex: 1,
          animation: google.maps.Animation.DROP
        });

        // Create status text with enhanced styling
        this.statusText = document.createElement('div');
        this.statusText.style.position = 'absolute';
        this.statusText.style.fontSize = '12px';
        this.statusText.style.fontWeight = '600';
        this.statusText.style.textAlign = 'center';
        this.statusText.style.width = '140px';
        this.statusText.style.marginLeft = '-70px';
        this.statusText.style.marginTop = '-90px';
        this.statusText.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
        this.statusText.style.padding = '6px 8px';
        this.statusText.style.borderRadius = '8px';
        this.statusText.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        this.statusText.style.zIndex = '1000';
        this.statusText.style.backdropFilter = 'blur(4px)';
        this.statusText.style.border = '1px solid rgba(0,0,0,0.1)';
        this.statusText.style.cursor = 'pointer';
        this.statusText.style.transition = 'transform 0.2s, box-shadow 0.2s';

        // Set initial status text content
        this.updateStatusText();

        // Add hover effect
        this.statusText.addEventListener('mouseover', () => {
          this.statusText.style.transform = 'scale(1.05)';
          this.statusText.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
        });

        this.statusText.addEventListener('mouseout', () => {
          this.statusText.style.transform = 'scale(1)';
          this.statusText.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        });

        // Add click handler to status text
        this.statusText.addEventListener('click', () => {
          if (this.clickCallback) {
            this.clickCallback();
          }
        });

        this.setMap(map);
        
      }

      // Update status text content with travel time
      updateStatusText() {
        const typeText = t('common.cat.type.' + this.type.toLowerCase());
        const statusText = t('report.status.' + this.status.toLowerCase());
        const travelTimeText = this.travelTime ? ` (${this.travelTime})` : '';
        
        // Create HTML content with enhanced styling
        this.statusText.innerHTML = `
          <div style="
            color: #1a1a1a;
            margin-bottom: 2px;
            font-size: 11px;
            opacity: 0.8;
          ">#${this.reportId} - ${typeText}${travelTimeText}</div>
          <div style="
            color: ${getStatusColor(this.status)};
            font-size: 12px;
            font-weight: 600;
          ">${statusText}</div>
        `;
      }

      // Calculate travel time from current location
      async calculateTravelTimeFromLocation(origin: google.maps.LatLng | null) {
        if (!origin) {
          this.travelTime = null;
          this.updateStatusText();
          return;
        }

        this.isCalculatingTravelTime = true;
        this.updateStatusText();

        try {
          const travelTimes = await calculateTravelTimes(origin, [this.position], language);
          this.travelTime = travelTimes[0];
        } catch (error) {
          logError('Error calculating travel time for marker', { reportId: this.reportId, error });
          this.travelTime = null;
        } finally {
          this.isCalculatingTravelTime = false;
          this.updateStatusText();
        }
      }

      onAdd() {
        const panes = this.getPanes();
        if (panes && panes.overlayLayer) {
          panes.overlayLayer.appendChild(this.statusText);
          (panes.overlayLayer as HTMLElement).style.zIndex = '1000';
        }
      }

      draw() {
        const projection = this.getProjection();
        if (projection) {
          const position = projection.fromLatLngToDivPixel(this.position);
          if (position) {
            this.statusText.style.left = position.x + 'px';
            this.statusText.style.top = position.y + 'px';
          }
        }
      }

      onRemove() {
        logDebug('onRemove marker', this.reportId);
        if (this.statusText.parentNode) {
          this.statusText.parentNode.removeChild(this.statusText);
        }
        this.marker.setMap(null);
      }

      addClickListener(callback: () => void) {
        this.clickCallback = callback;
        this.marker.addListener('click', callback);
      }

      // Hide status text label
      hideStatusText() {
        logDebug('hideStatusText marker', this.reportId);
        this.statusText.style.display = 'none';
      }

      // Show status text label
      showStatusText() {
        logDebug('showStatusText marker', this.reportId);
        this.statusText.style.display = 'block';
      }

    }

    return new CustomMarkerClass();
  };

  // Calculate travel times for all markers in batch
  const calculateTravelTimesForAllMarkers = async (origin: google.maps.LatLng, markers: CustomMarker[]) => {
    if (markers.length === 0) return;

    try {
      const destinations = markers.map(marker => marker.position);
      const travelTimes = await calculateTravelTimes(origin, destinations, language);
      
      // Update each marker with its travel time
      markers.forEach((marker, index) => {
        marker.travelTime = travelTimes[index];
        marker.isCalculatingTravelTime = false;
        marker.updateStatusText();
      });
    } catch (error) {
      logError('Error calculating travel times for markers:', error);
      // Reset all markers to not calculating state
      markers.forEach(marker => {
        marker.travelTime = null;
        marker.isCalculatingTravelTime = false;
        marker.updateStatusText();
      });
    }
  };

  // Update markers when map or filtered reports change
  useEffect(() => {
    const currentDeps = {
      hasMap: !!mapRef,
      isLoaded,
      reportsCount: reports.length,
      typeFilter,
      statusFilter,
      reportId: reportId || null,
      showInfoWindow,
      currentLocation: !!currentLocation,
      language
    };

    // Show what changed to trigger re-render
    if (prevMarkerDepsRef.current) {
      const prev = prevMarkerDepsRef.current;
      const changes: Record<string, { from: any; to: any }> = {};
      
      Object.entries(currentDeps).forEach(([key, value]) => {
        if (prev[key as keyof typeof prev] !== value) {
          changes[key] = {
            from: prev[key as keyof typeof prev],
            to: value
          };
        }
      });

      if (Object.keys(changes).length > 0) {
        logDebug('🔍 Marker re-render:', changes);
      }
    }

    // Store current values for next comparison
    prevMarkerDepsRef.current = currentDeps;

    if (!mapRef || !isLoaded) {
      return;
    }

    // Clear existing markers
    markersRef.current.forEach(marker => marker.onRemove());
    markersRef.current = [];

    // Create new markers
    const newMarkers = reports.filter(report => {
      const typeMatch = typeFilter === 'all' || report.type === typeFilter;
      const statusMatch = statusFilter === 'all' || report.status === statusFilter;
      return typeMatch && statusMatch;
    }).map(report => {
      const marker = createCustomMarker(
        new google.maps.LatLng(report.location.lat, report.location.long),
        report.status,
        report.type,
        report.id,
        mapRef
      );

      // Add click listener to the marker
      marker.marker.addListener('click', () => {
        logDebug('Marker click event triggered:', report.id);
        handleMarkerClick(report);
      });
      return marker;
    });

    markersRef.current = newMarkers;

    // Calculate travel times for all markers if current location is available
    if (currentLocation) {
      calculateTravelTimesForAllMarkers(currentLocation, newMarkers);
    }

    // Handle info window display
    if (showInfoWindow && selectedReport) {
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
      }

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="
            min-width: 250px;
            padding: 16px;
            font-family: 'Sarabun', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            display: flex;
            flex-direction: column;
            gap: 16px;
          ">
            <div style="
              display: flex;
              align-items: center;
              gap: 8px;
              border-bottom: 2px solid #e5e7eb;
              padding-bottom: 8px;
            ">
              <div style="
                background-color: ${getMarkerColor(selectedReport.type)};
                width: 12px;
                height: 12px;
                border-radius: 50%;
              "></div>
              <h3 style="
                margin: 0;
                font-size: 18px;
                font-weight: 600;
                color: #1f2937;
              ">${t('map.report')} #${selectedReport.id}</h3>
            </div>

            <div style="
              display: flex;
              flex-direction: column;
              gap: 12px;
            ">
              <div style="
                display: flex;
                align-items: center;
                gap: 8px;
              ">
                <div style="
                  color: #6b7280;
                  min-width: 80px;
                ">${t('map.status')}:</div>
                <div style="
                  color: #1f2937;
                  font-weight: 500;
                  flex: 1;
                ">${t(`report.status.${selectedReport.status.toLowerCase()}`)}</div>
              </div>
              
              <div style="
                display: flex;
                align-items: center;
                gap: 8px;
              ">
                <div style="
                  color: #6b7280;
                  min-width: 80px;
                ">${t('map.type')}:</div>
                <div style="
                  color: #1f2937;
                  font-weight: 500;
                  flex: 1;
                ">${t(`common.cat.type.${selectedReport.type.toLowerCase()}`)}</div>
              </div>
              
              <div style="
                display: flex;
                align-items: center;
                gap: 8px;
              ">
                <div style="
                  color: #6b7280;
                  min-width: 80px;
                ">${t('map.numberOfCats')}:</div>
                <div style="
                  color: #1f2937;
                  font-weight: 500;
                  flex: 1;
                ">${selectedReport.numberOfCats} ${t('map.cats')}</div>
              </div>
              
              ${selectedReport.description ? `
                <div style="
                  display: flex;
                  flex-direction: column;
                  gap: 4px;
                ">
                  <div style="
                    color: #6b7280;
                  ">${t('map.description')}:</div>
                  <div style="
                    color: #1f2937;
                    font-weight: 500;
                    line-height: 1.4;
                  ">${selectedReport.description}</div>
                </div>
              ` : ''}
            </div>

            <div style="
              display: flex;
              flex-direction: column;
              gap: 0.5em;
              margin-top: 8px;
            ">
              <button
                id="updateStatusBtn"
                style="
                  background-color: ${selectedReport.status === ReportStatus.CANCELLED || selectedReport.status === ReportStatus.COMPLETED ? '#9ca3af' : '#3b82f6'};
                  color: white;
                  border: none;
                  border-radius: 6px;
                  padding: 8px 16px;
                  font-size: 14px;
                  font-weight: 500;
                  cursor: ${selectedReport.status === ReportStatus.CANCELLED || selectedReport.status === ReportStatus.COMPLETED ? 'not-allowed' : 'pointer'};
                  transition: background-color 0.2s;
                  flex: 1;
                  opacity: ${selectedReport.status === ReportStatus.CANCELLED || selectedReport.status === ReportStatus.COMPLETED ? '0.6' : '1'};
                "
                onmouseover="this.style.backgroundColor='${selectedReport.status === ReportStatus.CANCELLED || selectedReport.status === ReportStatus.COMPLETED ? '#9ca3af' : '#2563eb'}'"
                onmouseout="this.style.backgroundColor='${selectedReport.status === ReportStatus.CANCELLED || selectedReport.status === ReportStatus.COMPLETED ? '#9ca3af' : '#3b82f6'}'"
                ${selectedReport.status === ReportStatus.CANCELLED || selectedReport.status === ReportStatus.COMPLETED ? 'disabled' : ''}
              >
                ${selectedReport.status === ReportStatus.CANCELLED || selectedReport.status === ReportStatus.COMPLETED ? t('map.statusUpdateDisabled') : t('map.updateStatus')}
              </button>
              
              <button
                id="openGoogleMapsBtn"
                style="
                  background-color: #34a853;
                  color: white;
                  border: none;
                  border-radius: 6px;
                  padding: 8px 16px;
                  font-size: 14px;
                  font-weight: 500;
                  cursor: pointer;
                  transition: background-color 0.2s;
                  flex: 1;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  gap: 6px;
                "
                onmouseover="this.style.backgroundColor='#2d8f47'"
                onmouseout="this.style.backgroundColor='#34a853'"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                ${t('report.open_google_maps')}
              </button>
            </div>
          </div>
        `,
        pixelOffset: new google.maps.Size(0, -10)
      });

      const marker = markersRef.current.find(m => m.reportId === selectedReport.id);
      if (marker && marker.marker) {
        // Hide the selected marker's status text label
        marker.hideStatusText();
        
        // Center map on selected marker
        const position = new google.maps.LatLng(selectedReport.location.lat, selectedReport.location.long);
        mapRef.setCenter(position);
        
        infoWindow.open(mapRef, marker.marker);
        infoWindowRef.current = infoWindow;

        // Add event listeners for info window
        google.maps.event.addListener(infoWindow, 'closeclick', () => {
          logDebug('Info window close button clicked');
          // Show the marker's status text label when info window is closed
          marker.showStatusText();
          setSelectedReport(null);
          setShowInfoWindow(false);
          updateURLParams(setSearchParams, searchParams, { samePage: true });
        });

        google.maps.event.addListener(infoWindow, 'close', () => {
          logDebug('Info window closed');
          // Show the marker's status text label when info window is closed
          marker.showStatusText();
          setSelectedReport(null);
          setShowInfoWindow(false);
          updateURLParams(setSearchParams, searchParams, { samePage: true });
        });

        // Add click listener to the button after the info window is opened
        google.maps.event.addListenerOnce(infoWindow, 'domready', () => {
          logDebug('Info window DOM ready');
          const button = document.getElementById('updateStatusBtn');
          if (button) {
            logDebug('Update status button found');
            button.addEventListener('click', () => {
              setIsModalOpen(true);
            });
          } else {
            logWarn('Update status button not found in DOM');
          }

          const googleMapsButton = document.getElementById('openGoogleMapsBtn');
          if (googleMapsButton) {
            logDebug('Google Maps button found');
            googleMapsButton.addEventListener('click', () => {
              logDebug('Google Maps button clicked');
              const url = `https://www.google.com/maps?q=${selectedReport.location.lat},${selectedReport.location.long}`;
              window.open(url, '_blank');
            });
          } else {
            logWarn('Google Maps button not found in DOM');
          }
        });
      }
    }

    // If there's a specific report to focus on and it's not a same-page navigation
    if (reportId) {
      const targetReport = reportsRef.current.find(r => r.id === reportId);
      if (targetReport) {
        const position = new google.maps.LatLng(targetReport.location.lat, targetReport.location.long);
        mapRef.setCenter(position);
        mapRef.setZoom(13);
        setSelectedReport(targetReport);
        if(!isSamePage) {
          setShowInfoWindow(true);
        }
      }
    } else if (myLocationSelected) {
      // Priority: User explicitly selected their location
      mapRef.setCenter(myLocationSelected);
      mapRef.setZoom(15);
    } else {
      // Calculate bounds to fit all markers within Bangkok area
      if (newMarkers.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        let hasValidMarkers = false;
        let centerLat = 0;
        let centerLng = 0;
        let validMarkerCount = 0;

        newMarkers.forEach(marker => {
          const position = marker.marker.getPosition();
          if (position && isWithinBangkokArea(position.lat(), position.lng())) {
            bounds.extend(position);
            centerLat += position.lat();
            centerLng += position.lng();
            validMarkerCount++;
            hasValidMarkers = true;
          }
        });

        if (hasValidMarkers) {
          // Calculate center point
          centerLat /= validMarkerCount;
          centerLng /= validMarkerCount;
          const center = new google.maps.LatLng(centerLat, centerLng);

          // Add padding to bounds
          const ne = bounds.getNorthEast();
          const sw = bounds.getSouthWest();
          const latPadding = (ne.lat() - sw.lat()) * 0.1;
          const lngPadding = (ne.lng() - sw.lng()) * 0.1;

          bounds.extend(new google.maps.LatLng(ne.lat() + latPadding, ne.lng() + lngPadding));
          bounds.extend(new google.maps.LatLng(sw.lat() - latPadding, sw.lng() - lngPadding));

          // Check if bounds are smaller than minimum area and current zoom is larger than minimum
          const currentZoom = mapRef.getZoom() || 0;
          const minZoom = 13;
          
          if (currentZoom > minZoom) {
            mapRef.setCenter(center);
            mapRef.setZoom(minZoom);
          } else {
            mapRef.fitBounds(bounds);
            if (currentZoom > minZoom) mapRef.setZoom(minZoom);
          }
        } else {
          // If no valid markers, set default view of Bangkok
          mapRef.setCenter(defaultCenter);
          mapRef.setZoom(12);
        }
      }
    }

    // Debug: Print final zoom level with explanation
    const finalZoom = mapRef.getZoom();
    let zoomReason = '';
    
    if (reportId) {
      zoomReason = `Specific report focus (reportId: ${reportId}) - zoom set to 13`;
    } else if (myLocationSelected) {
      zoomReason = 'User location selected - zoom set to 15';
    } else if (newMarkers.length > 0) {
      const currentZoom = mapRef.getZoom() || 0;
      const minZoom = 13;
      if (currentZoom > minZoom) {
        zoomReason = `Bounds fitting with minimum zoom enforcement (min: ${minZoom})`;
      } else {
        zoomReason = 'Bounds fitting applied';
      }
    } else {
      zoomReason = 'No valid markers - fallback to default Bangkok view';
    }
    
    logDebug('🎯 Final zoom level after marker render', { finalZoom, zoomReason });
  }, [mapRef, reports, isLoaded, reportId, typeFilter, statusFilter, handleMarkerClick, t, isSamePage, showInfoWindow, selectedReport, currentLocation, myLocationSelected, language]);

  // Update travel times when current location changes
  useEffect(() => {
    if (currentLocation && markersRef.current.length > 0) {
      calculateTravelTimesForAllMarkers(currentLocation, markersRef.current);
    }
  }, [currentLocation]);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const data = await api.listReports({
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      setReports(data);
      logInfo('Reports fetched successfully', { count: data.length });
    } catch (error) {
      logError('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async () => {
    if (!selectedReport) return;

    try {
      switch (newStatus) {
        case ReportStatus.COMPLETED:
          await api.completeReport({ reportId: selectedReport.id, remark });
          break;
        case ReportStatus.ON_HOLD:
          await api.putReportOnHold({ reportId: selectedReport.id, remark });
          break;
        case ReportStatus.PENDING:
          await api.resumeReport({ reportId: selectedReport.id, remark });
          break;
        case ReportStatus.CANCELLED:
          await api.cancelReport({ reportId: selectedReport.id, remark });
          break;
      }
      await fetchReports();
      setIsModalOpen(false);
      setSelectedReport(null);
      setRemark('');
    } catch (error) {
      logError('Error updating status:', error);
    }
  };

  /**
   * Helper function to clear reportId and related state
   */
  const clearReportId = () => {
    updateURLParams(setSearchParams, searchParams, { reportId: null });
    setSelectedReport(null);
    setShowInfoWindow(false);
  };

  const handleLegendClick = (type: CatType) => {
    // If the clicked type is already selected, clear the filter
    if (typeFilter === type) {
      setTypeFilter('all');
      logInfo('Legend filter cleared', { previousType: type });
    } else {
      setTypeFilter(type);
      logInfo('Legend filter applied', { newType: type });
    }
    
    // Clear reportId and selected report when legend is clicked
    clearReportId();
    setMyLocationSelected(null);
  };

  // Get current location and center map
  const getCurrentLocation = () => {
    logDebug('Current location button clicked');
    if (!mapRef) return;
    
    // Clear reportId when getting current location
    clearReportId();
    
    setIsLocationLoading(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const location = new google.maps.LatLng(latitude, longitude);
          
          setCurrentLocation(location);
          setMyLocationSelected(location);
          
          // Remove existing current location marker
          if (currentLocationMarker) {
            currentLocationMarker.setMap(null);
          }
          
          // Create new current location marker
          const marker = new google.maps.Marker({
            position: location,
            map: mapRef,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#4285F4',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 2,
            },
            title: t('map.myLocation'),
            zIndex: 1000,
          });
          
          setCurrentLocationMarker(marker);
          
          // Center map on current location
          mapRef.setCenter(location);
          mapRef.setZoom(15);
          
          // Calculate travel times for all markers from new location
          if (markersRef.current.length > 0) {
            calculateTravelTimesForAllMarkers(location, markersRef.current);
          }
          
          setIsLocationLoading(false);
          logInfo('Current location acquired successfully', { latitude, longitude, markerCount: markersRef.current.length });
        },
        (error) => {
          logError('Error getting current location:', error);
          setIsLocationLoading(false);
          // You could show a toast notification here
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    } else {
      logError('Geolocation is not supported by this browser');
      setIsLocationLoading(false);
    }
  };

  // Calculate filtered reports count within Bangkok
  const getFilteredReportsCount = useCallback(() => {
    return reports.filter(report => {
      const typeMatch = typeFilter === 'all' || report.type === typeFilter;
      const statusMatch = statusFilter === 'all' || report.status === statusFilter;
      const locationMatch = isWithinBangkokArea(report.location.lat, report.location.long);
      return typeMatch && statusMatch && locationMatch;
    }).length;
  }, [reports, typeFilter, statusFilter]);

  // Add style element for info window
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = infoWindowStyles;
    document.head.appendChild(styleElement);
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // Cleanup current location marker on unmount
  useEffect(() => {
    return () => {
      if (currentLocationMarker) {
        currentLocationMarker.setMap(null);
      }
    };
  }, [currentLocationMarker]);

  // Expose debug functions to window object
  useEffect(() => {
    window.mapViewDebug = {
      getReports: () => {
        logDebug('Debug: Getting reports', { count: reports.length });
        return reports;
      },
      getMarkers: () => {
        logDebug('Debug: Getting markers', { count: markersRef.current.length });
        return markersRef.current;
      },
      getSelectedReport: () => {
        logDebug('Debug: Getting selected report', { reportId: selectedReport?.id });
        return selectedReport;
      },
      getFilters: () => {
        logDebug('Debug: Getting filters', { typeFilter, statusFilter });
        return { type: typeFilter, status: statusFilter };
      },
      getMapState: () => {
        const center = mapRef?.getCenter();
        const zoom = mapRef?.getZoom();
        logDebug('Debug: Getting map state', { center: center?.toJSON(), zoom, isLoaded });
        return { center: center?.toJSON(), zoom, isLoaded };
      },
      setLogLevel: (level: number) => {
        logger.setLevel(level);
        logInfo('Debug: Log level set', { level });
      },
      getLogLevel: () => {
        const level = logger.getLevel();
        logDebug('Debug: Getting log level', { level });
        return level;
      },
      refreshReports: async () => {
        logInfo('Debug: Refreshing reports');
        await fetchReports();
      },
      clearFilters: () => {
        logInfo('Debug: Clearing filters');
        setTypeFilter('all');
        setStatusFilter('all');
        clearReportId();
      },
      focusReport: (reportId: number) => {
        const report = reports.find(r => r.id === reportId);
        if (report) {
          logInfo('Debug: Focusing report', { reportId });
          setSelectedReport(report);
          setShowInfoWindow(true);
          updateURLParams(setSearchParams, searchParams, { reportId, samePage: true });
          
          // Center map on the report
          if (mapRef) {
            const position = new google.maps.LatLng(report.location.lat, report.location.long);
            mapRef.setCenter(position);
            mapRef.setZoom(13);
          }
        } else {
          logWarn('Debug: Report not found', { reportId });
        }
      },
      getCurrentLocation: () => {
        logInfo('Debug: Getting current location');
        getCurrentLocation();
      },
      help: () => {
        console.log(`
🎯 MapView Debug Console Commands:

📊 Data Access:
  mapViewDebug.getReports()           - Get all reports
  mapViewDebug.getMarkers()           - Get all markers
  mapViewDebug.getSelectedReport()    - Get currently selected report
  mapViewDebug.getFilters()           - Get current filters
  mapViewDebug.getMapState()          - Get map center, zoom, and load state

🔧 Actions:
  mapViewDebug.refreshReports()       - Refresh reports from API
  mapViewDebug.clearFilters()         - Clear all filters
  mapViewDebug.focusReport(id)        - Focus on specific report (e.g., focusReport(123))
  mapViewDebug.getCurrentLocation()   - Get user's current location

⚙️ Logging:
  mapViewDebug.setLogLevel(level)     - Set log level (0=ERROR, 1=WARN, 2=INFO, 3=DEBUG)
  mapViewDebug.getLogLevel()          - Get current log level

❓ Help:
  mapViewDebug.help()                 - Show this help message

💡 Examples:
  mapViewDebug.focusReport(123)       - Focus on report ID 123
  mapViewDebug.setLogLevel(3)         - Enable debug logging
  mapViewDebug.clearFilters()         - Clear all filters
        `);
      }
    };

    // Show help message when debug functions are loaded
    logInfo('Debug functions loaded', { 
      available: Object.keys(window.mapViewDebug),
      usage: 'Type mapViewDebug.help() for usage instructions'
    });

    // Cleanup on unmount
    return () => {
      (window as any).mapViewDebug = undefined;
    };
  }, [reports, selectedReport, typeFilter, statusFilter, mapRef, isLoaded, markersRef, searchParams, setSearchParams]);

  if (loading || !isLoaded) {
    return (
      <div className="h-[calc(100vh-64px)] w-full flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col overflow-hidden" style={{ paddingBottom: '4rem' }}>
      <MapFilterBar
        typeFilter={typeFilter}
        statusFilter={statusFilter}
        onTypeFilterChange={(type) => {
          setTypeFilter(type);
          logInfo('Type filter changed', { newType: type });
          clearReportId();
          setMyLocationSelected(null);
        }}
        onStatusFilterChange={(status) => {
          setStatusFilter(status);
          logInfo('Status filter changed', { newStatus: status });
          clearReportId();
          setMyLocationSelected(null);
        }}
      />

      <div className="flex-1 w-full relative">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={defaultCenter}
          zoom={13}
          onLoad={(map) => {
            setMapRef(map);
            logInfo('Google Maps initialized successfully');
          }}
          options={{
            mapTypeControl: false,
            panControl: false,
            fullscreenControl: false,
            cameraControl: false,
            gestureHandling: 'greedy',
            styles: [
              {
                featureType: "poi",
                elementType: "labels",
                stylers: [{ visibility: "off" }]
              }
            ]
          }}
        />

        {/* No Matches Message */}
        {getFilteredReportsCount() === 0 && (
          <MapNoMatchesMessage
            typeFilter={typeFilter}
            statusFilter={statusFilter}
          />
        )}

        {/* Legend */}
        <MapLegend
          isCollapsed={isLegendCollapsed}
          typeFilter={typeFilter}
          onToggleCollapse={() => setIsLegendCollapsed(!isLegendCollapsed)}
          onLegendClick={handleLegendClick}
          getMarkerColor={getMarkerColor}
        />

        {/* Current Location Button */}
        <MapLocationButton
          isLocationLoading={isLocationLoading}
          onGetCurrentLocation={getCurrentLocation}
        />
      </div>

      <StatusUpdateModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedReport(null);
        }}
        report={selectedReport}
        onStatusUpdated={fetchReports}
      />
    </div>
  );
}; 