import { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, InfoWindow } from '@react-google-maps/api';
import { api } from '../services/apiService';
import { Report, ReportStatus, CatType } from '../types/report';
import { Spinner } from '../components/Spinner';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { StatusUpdateModal } from '../components/StatusUpdateModal';
import { useLanguage } from '../contexts/LanguageContext';

const containerStyle = {
  width: '100%',
  height: 'calc(100vh - 64px)' // Account for the filter bar height
};

const defaultCenter = {
  lat: 13.7563,
  lng: 100.5018
};

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

const TH_LANG = 'th';
const TH_REGION = 'TH';

// Custom marker SVG path - Modern teardrop design
const MARKER_PATH = "M12,2C8.13,2 5,5.13 5,9c0,5.25 7,13 7,13s7,-7.75 7,-13c0,-3.87 -3.13,-7 -7,-7zM9.5,9c0,-1.38 1.12,-2.5 2.5,-2.5s2.5,1.12 2.5,2.5 -1.12,2.5 -2.5,2.5 -2.5,-1.12 -2.5,-2.5z";

// Helper function to get marker color based on cat type
const getMarkerColor = (type: CatType): string => {
  switch (type) {
    case CatType.STRAY:
      return '#D4AF37'; // Darker gold for stray cats
    case CatType.INJURED:
      return '#E63946'; // Darker coral red for injured cats
    case CatType.SICK:
      return '#2A9D8F'; // Darker turquoise for sick cats
    case CatType.KITTEN:
      return '#457B9D'; // Darker blue for kittens
    default:
      return '#FFFFFF'; // White
  }
};

// Helper function to get status color
const getStatusColor = (status: ReportStatus): string => {
  switch (status) {
    case ReportStatus.PENDING:
      return '#D4AF37'; // Darker gold
    case ReportStatus.COMPLETED:
      return '#2A9D8F'; // Darker green
    case ReportStatus.ON_HOLD:
      return '#E76F51'; // Darker orange
    case ReportStatus.CANCELLED:
      return '#E63946'; // Darker red
    default:
      return '#FFFFFF'; // White
  }
};

// Constants for map bounds
const MIN_ZOOM_AREA = 9; // 9 square kilometers
const DEGREES_PER_KM = 0.009; // Approximately 0.009 degrees per kilometer at the equator

// Function to calculate zoom level for a given area in square kilometers
const calculateZoomForArea = (area: number, lat: number): number => {
  // Convert area to degrees
  const sideLengthKm = Math.sqrt(area);
  const latDelta = sideLengthKm * DEGREES_PER_KM;
  const lngDelta = sideLengthKm * DEGREES_PER_KM / Math.cos(lat * Math.PI / 180);
  
  // Calculate zoom level (approximate formula)
  const zoom = Math.floor(Math.log2(360 / Math.max(latDelta, lngDelta)));
  return zoom;
};

// Function to calculate bounds for a minimum area
const calculateMinBounds = (center: google.maps.LatLng): google.maps.LatLngBounds => {
  const halfSide = Math.sqrt(MIN_ZOOM_AREA) / 2; // Half the side length of the square
  const latDelta = halfSide * DEGREES_PER_KM;
  const lngDelta = halfSide * DEGREES_PER_KM / Math.cos(center.lat() * Math.PI / 180);

  return new google.maps.LatLngBounds(
    new google.maps.LatLng(center.lat() - latDelta, center.lng() - lngDelta),
    new google.maps.LatLng(center.lat() + latDelta, center.lng() + lngDelta)
  );
};

// Function to check if bounds are smaller than minimum area
const isBoundsSmallerThanMinArea = (bounds: google.maps.LatLngBounds): boolean => {
  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();
  const latDelta = ne.lat() - sw.lat();
  const lngDelta = ne.lng() - sw.lng();
  const centerLat = (ne.lat() + sw.lat()) / 2;
  
  // Convert degrees to kilometers
  const latKm = latDelta / DEGREES_PER_KM;
  const lngKm = (lngDelta * Math.cos(centerLat * Math.PI / 180)) / DEGREES_PER_KM;
  
  // Calculate area in square kilometers
  const area = latKm * lngKm;
  
  return area < MIN_ZOOM_AREA;
};

export const MapView = () => {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Get initial states from URL parameters
  const reportId = searchParams.get('reportId') ? Number(searchParams.get('reportId')) : null;
  const initialTypeFilter = searchParams.get('type') as CatType || 'all';
  const initialStatusFilter = searchParams.get('status') as ReportStatus || 'all';
  const isSamePage = searchParams.get('samePage') === 'true';
  const showModal = searchParams.get('modal') === 'true';
  
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [statusModalOpen, setStatusModalOpen] = useState(showModal);
  const [newStatus, setNewStatus] = useState<ReportStatus>(ReportStatus.PENDING);
  const [remark, setRemark] = useState('');
  const [typeFilter, setTypeFilter] = useState<CatType | 'all'>(initialTypeFilter);
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>(initialStatusFilter);
  const [mapRef, setMapRef] = useState<google.maps.Map | null>(null);
  const markersRef = useRef<any[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const reportsRef = useRef<Report[]>([]);
  const [isLegendCollapsed, setIsLegendCollapsed] = useState(false);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY,
    language: TH_LANG,
    region: TH_REGION,
  });

  // Update reportsRef when reports change
  useEffect(() => {
    reportsRef.current = reports;
  }, [reports]);

  // Update URL when filters or modal state changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    
    if (reportId) {
      params.set('reportId', reportId.toString());
    } else {
      params.delete('reportId');
    }
    
    if (typeFilter !== 'all') {
      params.set('type', typeFilter);
    } else {
      params.delete('type');
    }
    
    if (statusFilter !== 'all') {
      params.set('status', statusFilter);
    } else {
      params.delete('status');
    }
    
    if (isSamePage) {
      params.set('samePage', 'true');
    } else {
      params.delete('samePage');
    }
    
    if (statusModalOpen) {
      params.set('modal', 'true');
    } else {
      params.delete('modal');
    }
    
    setSearchParams(params);
  }, [reportId, typeFilter, statusFilter, isSamePage, statusModalOpen, setSearchParams, searchParams]);

  const handleMarkerClick = useCallback((report: Report) => {
    setSearchParams({ 
      reportId: report.id.toString(),
      samePage: 'true'
    });
    
    if (infoWindowRef.current) {
      infoWindowRef.current.close();
    }

    // Create and open info window immediately
    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div style="
          min-width: 250px;
          padding: 16px;
          font-family: 'Sarabun', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        ">
          <div style="
            display: flex;
            flex-direction: column;
            gap: 12px;
          ">
            <div style="
              display: flex;
              align-items: center;
              gap: 8px;
              border-bottom: 2px solid #e5e7eb;
              padding-bottom: 8px;
            ">
              <div style="
                background-color: ${getMarkerColor(report.type)};
                width: 12px;
                height: 12px;
                border-radius: 50%;
              "></div>
              <h3 style="
                margin: 0;
                font-size: 18px;
                font-weight: 600;
                color: #1f2937;
              ">${t('map.report')} #${report.id}</h3>
            </div>

            <div style="
              display: grid;
              grid-template-columns: auto 1fr;
              gap: 8px 16px;
              font-size: 14px;
            ">
              <div style="color: #6b7280;">${t('map.status')}:</div>
              <div style="color: #1f2937; font-weight: 500;">${t(`report.status.${report.status.toLowerCase()}`)}</div>
              
              <div style="color: #6b7280;">${t('map.type')}:</div>
              <div style="color: #1f2937; font-weight: 500;">${t(`common.cat.type.${report.type.toLowerCase()}`)}</div>
              
              <div style="color: #6b7280;">${t('map.numberOfCats')}:</div>
              <div style="color: #1f2937; font-weight: 500;">${report.numberOfCats} ${t('map.cats')}</div>
              
              ${report.description ? `
                <div style="color: #6b7280;">${t('map.description')}:</div>
                <div style="color: #1f2937; font-weight: 500;">${report.description}</div>
              ` : ''}
            </div>

            <button
              id="updateStatusBtn"
              style="
                background-color: #3b82f6;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 8px 16px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: background-color 0.2s;
                margin-top: 8px;
                width: 100%;
              "
              onmouseover="this.style.backgroundColor='#2563eb'"
              onmouseout="this.style.backgroundColor='#3b82f6'"
            >
              ${t('map.updateStatus')}
            </button>
          </div>
        </div>
      `,
      pixelOffset: new google.maps.Size(0, -10),
    });

    // Find the marker by report ID and open the info window
    const marker = markersRef.current.find(m => m.reportId === report.id);
    if (marker && marker.marker) {
      infoWindow.open(mapRef, marker.marker);
      infoWindowRef.current = infoWindow;
      setSelectedReport(report);

      // Add click listener to the button after the info window is opened
      google.maps.event.addListenerOnce(infoWindow, 'domready', () => {
        const button = document.getElementById('updateStatusBtn');
        if (button) {
          button.addEventListener('click', () => {
            setStatusModalOpen(true);
          });
        }
      });
    }
  }, [mapRef, setSearchParams, t]);

  // Custom marker class that extends OverlayView
  const createCustomMarker = (
    position: google.maps.LatLng,
    status: ReportStatus,
    type: CatType,
    reportId: number,
    map: google.maps.Map
  ) => {
    class CustomMarker extends google.maps.OverlayView {
      public position: google.maps.LatLng;
      public status: ReportStatus;
      public type: CatType;
      public reportId: number;
      public marker: google.maps.Marker;
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
        this.statusText.style.width = '120px';
        this.statusText.style.marginLeft = '-60px';
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

        // Set status text content with enhanced styling
        const typeText = t('common.cat.type.' + type.toLowerCase());
        const statusText = t('report.status.' + status.toLowerCase());
        
        // Create HTML content with enhanced styling
        this.statusText.innerHTML = `
          <div style="
            color: #1a1a1a;
            margin-bottom: 2px;
            font-size: 11px;
            opacity: 0.8;
          ">#${reportId} - ${typeText}</div>
          <div style="
            color: ${getStatusColor(status)};
            font-size: 12px;
            font-weight: 600;
          ">${statusText}</div>
        `;

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
        if (this.statusText.parentNode) {
          this.statusText.parentNode.removeChild(this.statusText);
        }
        this.marker.setMap(null);
      }

      addClickListener(callback: () => void) {
        this.clickCallback = callback;
        this.marker.addListener('click', callback);
      }
    }

    return new CustomMarker();
  };

  // Show info window when page loads with reportId
  useEffect(() => {
    if (reportId && mapRef && reports.length > 0 && !infoWindowRef.current) {
      const targetReport = reports.find(r => r.id === reportId);
      if (targetReport) {
        // Small delay to ensure map and markers are ready
        setTimeout(() => {
          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div style="
                min-width: 250px;
                padding: 16px;
                font-family: 'Sarabun', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
              ">
                <div style="
                  display: flex;
                  flex-direction: column;
                  gap: 12px;
                ">
                  <div style="
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    border-bottom: 2px solid #e5e7eb;
                    padding-bottom: 8px;
                  ">
                    <div style="
                      background-color: ${getMarkerColor(targetReport.type)};
                      width: 12px;
                      height: 12px;
                      border-radius: 50%;
                    "></div>
                    <h3 style="
                      margin: 0;
                      font-size: 18px;
                      font-weight: 600;
                      color: #1f2937;
                    ">${t('map.report')} #${targetReport.id}</h3>
                  </div>

                  <div style="
                    display: grid;
                    grid-template-columns: auto 1fr;
                    gap: 8px 16px;
                    font-size: 14px;
                  ">
                    <div style="color: #6b7280;">${t('map.status')}:</div>
                    <div style="color: #1f2937; font-weight: 500;">${t('report.status.' + targetReport.status.toLowerCase())}</div>
                    
                    <div style="color: #6b7280;">${t('map.type')}:</div>
                    <div style="color: #1f2937; font-weight: 500;">${t('common.cat.type.' + targetReport.type.toLowerCase())}</div>
                    
                    <div style="color: #6b7280;">${t('map.numberOfCats')}:</div>
                    <div style="color: #1f2937; font-weight: 500;">${targetReport.numberOfCats} ${t('map.cats')}</div>
                    
                    ${targetReport.description ? `
                      <div style="color: #6b7280;">${t('map.description')}:</div>
                      <div style="color: #1f2937; font-weight: 500;">${targetReport.description}</div>
                    ` : ''}
                  </div>

                  <button
                    id="updateStatusBtn"
                    style="
                      background-color: #3b82f6;
                      color: white;
                      border: none;
                      border-radius: 6px;
                      padding: 8px 16px;
                      font-size: 14px;
                      font-weight: 500;
                      cursor: pointer;
                      transition: background-color 0.2s;
                      margin-top: 8px;
                      width: 100%;
                    "
                    onmouseover="this.style.backgroundColor='#2563eb'"
                    onmouseout="this.style.backgroundColor='#3b82f6'"
                  >
                    ${t('map.updateStatus')}
                  </button>
                </div>
              </div>
            `,
            pixelOffset: new google.maps.Size(0, -10),
          });

          const marker = markersRef.current.find(m => m.reportId === targetReport.id);
          if (marker && marker.marker) {
            infoWindow.open(mapRef, marker.marker);
            infoWindowRef.current = infoWindow;
            setSelectedReport(targetReport);

            // Add click listener to the button after the info window is opened
            google.maps.event.addListenerOnce(infoWindow, 'domready', () => {
              const button = document.getElementById('updateStatusBtn');
              if (button) {
                button.addEventListener('click', () => {
                  setStatusModalOpen(true);
                });
              }
            });
          }
        }, 100);
      }
    }
  }, [reportId, mapRef, reports, t]);

  // Update markers when map or filtered reports change
  useEffect(() => {
    if (!mapRef || !isLoaded) return;

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

      // Only apply drop animation to the marker matching reportId
      if (reportId && report.id === reportId) {
        marker.marker.setAnimation(google.maps.Animation.DROP);
        marker.marker.setZIndex(1000); // Set high z-index for selected marker
      } else {
        marker.marker.setAnimation(null);
        marker.marker.setZIndex(1); // Set normal z-index for other markers
      }

      // Add click listener to the marker
      marker.marker.addListener('click', () => handleMarkerClick(report));
      return marker;
    });

    markersRef.current = newMarkers;

    // If there's a specific report to focus on
    if (reportId) {
      const targetReport = reportsRef.current.find(r => r.id === reportId);
      if (targetReport) {
        const position = new google.maps.LatLng(targetReport.location.lat, targetReport.location.long);
        mapRef.setCenter(position);
        
        // Only apply min zoom if not navigating within the same page
        if (!isSamePage) {
          mapRef.setZoom(calculateZoomForArea(MIN_ZOOM_AREA, targetReport.location.lat));
        }
        
        // Find and click the marker for this report
        const targetMarker = newMarkers.find(m => m.reportId === reportId);
        if (targetMarker) {
          google.maps.event.trigger(targetMarker, 'click');
        }
      }
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
          const minZoom = calculateZoomForArea(MIN_ZOOM_AREA, centerLat);
          
          if (isBoundsSmallerThanMinArea(bounds) && currentZoom > minZoom) {
            mapRef.setCenter(center);
            mapRef.setZoom(minZoom);
          } else {
            mapRef.fitBounds(bounds);
          }
        } else {
          // If no valid markers, set default view of Bangkok
          mapRef.setCenter(defaultCenter);
          mapRef.setZoom(12);
        }
      }
    }
  }, [mapRef, reports, isLoaded, reportId, typeFilter, statusFilter, handleMarkerClick, t]);

  // Add event listener for update status button
  useEffect(() => {
    const handleUpdateStatus = (event: CustomEvent) => {
      console.log('Update status event received:', event.detail);
      const reportId = Number(event.detail);
      const report = reports.find(r => r.id === reportId);
      console.log('Found report:', report);
      if (report) {
        setSelectedReport(report);
        setStatusModalOpen(true);
      }
    };

    window.addEventListener('updateStatus', handleUpdateStatus as EventListener);
    return () => {
      window.removeEventListener('updateStatus', handleUpdateStatus as EventListener);
    };
  }, [reports]);

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
    } catch (error) {
      console.error('Error fetching reports:', error);
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
      setStatusModalOpen(false);
      setSelectedReport(null);
      setRemark('');
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  // Get marker SVG configuration after Google Maps is loaded
  const getMarkerSVG = (type: CatType, status: ReportStatus) => {
    const statusColor = getMarkerColor(type);
    return {
      path: "M12,2C8.13,2 5,5.13 5,9c0,5.25 7,13 7,13s7,-7.75 7,-13c0,-3.87 -3.13,-7 -7,-7zM9.5,9c0,-1.38 1.12,-2.5 2.5,-2.5s2.5,1.12 2.5,2.5 -1.12,2.5 -2.5,2.5 -2.5,-1.12 -2.5,-2.5z",
      fillColor: "#FF0000", // Default red color for marker
      fillOpacity: 1,
      strokeWeight: 1,
      strokeColor: "#000000",
      scale: 1.5,
      anchor: new google.maps.Point(12, 24),
      labelOrigin: new google.maps.Point(12, 8),
      label: {
        text: t(`report.status.${status.toLowerCase()}`),
        color: statusColor,
        fontSize: "12px",
        fontWeight: "bold",
        padding: "2px 4px"
      }
    };
  };

  const handleLegendClick = (type: CatType) => {
    // If the clicked type is already selected, clear the filter
    if (typeFilter === type) {
      setTypeFilter('all');
    } else {
      setTypeFilter(type);
    }
    setSelectedReport(null);
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

  // Add click outside handler to close info window
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (infoWindowRef.current) {
        const infoWindowElement = document.querySelector('.gm-style-iw');
        if (infoWindowElement && !infoWindowElement.contains(event.target as Node)) {
          infoWindowRef.current.close();
          infoWindowRef.current = null;
          setSelectedReport(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (loading || !isLoaded) {
    return (
      <div className="h-[calc(100vh-64px)] w-full flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col overflow-hidden">
      <div className="bg-white p-4 shadow-sm">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('report.filter.type')}</label>
            <select
              className="w-full p-2 border rounded"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as CatType | 'all');
                setSelectedReport(null);
              }}
            >
              <option value="all">{t('report.filter.all_type')}</option>
              <option value={CatType.STRAY}>{t('common.cat.type.stray')}</option>
              <option value={CatType.INJURED}>{t('common.cat.type.injured')}</option>
              <option value={CatType.SICK}>{t('common.cat.type.sick')}</option>
              <option value={CatType.KITTEN}>{t('common.cat.type.kitten')}</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('report.filter.status')}</label>
            <select
              className="w-full p-2 border rounded"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as ReportStatus | 'all');
                setSelectedReport(null);
              }}
            >
              <option value="all">{t('report.filter.all_status')}</option>
              <option value={ReportStatus.PENDING}>{t('report.status.pending')}</option>
              <option value={ReportStatus.COMPLETED}>{t('report.status.completed')}</option>
              <option value={ReportStatus.ON_HOLD}>{t('report.status.on_hold')}</option>
              <option value={ReportStatus.CANCELLED}>{t('report.status.cancelled')}</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full relative">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={defaultCenter}
          zoom={13}
          onLoad={(map) => {
            setMapRef(map);
          }}
          options={{
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
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-lg text-center">
            <div className="text-gray-500 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-lg font-medium text-gray-700 mb-1">{t('map.no_matches')}</div>
            <div className="text-sm text-gray-500">
              {typeFilter !== 'all' && statusFilter !== 'all' 
                ? t('map.no_matches.both_filters')
                : typeFilter !== 'all'
                ? t('map.no_matches.type_filter')
                : statusFilter !== 'all'
                ? t('map.no_matches.status_filter')
                : t('map.no_matches.no_reports')}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-[104px] right-4 bg-white rounded-lg shadow-lg overflow-hidden">
          <div 
            className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
            onClick={() => setIsLegendCollapsed(!isLegendCollapsed)}
          >
            <div className="text-sm font-medium text-gray-700">{t('map.legend')}</div>
            <button 
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
              onClick={(e) => {
                e.stopPropagation();
                setIsLegendCollapsed(!isLegendCollapsed);
              }}
            >
              <svg 
                className={`w-4 h-4 transform transition-transform ${isLegendCollapsed ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          <div className={`transition-all duration-300 ease-in-out ${isLegendCollapsed ? 'h-0' : 'h-auto'}`}>
            <div className="p-3 pt-0 space-y-2">
              <div 
                className={`flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-gray-50 ${typeFilter === CatType.STRAY ? 'bg-gray-100' : ''}`}
                onClick={() => handleLegendClick(CatType.STRAY)}
              >
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: getMarkerColor(CatType.STRAY) }}></div>
                <span className="text-sm text-gray-600">{t('common.cat.type.stray')}</span>
              </div>
              <div 
                className={`flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-gray-50 ${typeFilter === CatType.INJURED ? 'bg-gray-100' : ''}`}
                onClick={() => handleLegendClick(CatType.INJURED)}
              >
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: getMarkerColor(CatType.INJURED) }}></div>
                <span className="text-sm text-gray-600">{t('common.cat.type.injured')}</span>
              </div>
              <div 
                className={`flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-gray-50 ${typeFilter === CatType.SICK ? 'bg-gray-100' : ''}`}
                onClick={() => handleLegendClick(CatType.SICK)}
              >
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: getMarkerColor(CatType.SICK) }}></div>
                <span className="text-sm text-gray-600">{t('common.cat.type.sick')}</span>
              </div>
              <div 
                className={`flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-gray-50 ${typeFilter === CatType.KITTEN ? 'bg-gray-100' : ''}`}
                onClick={() => handleLegendClick(CatType.KITTEN)}
              >
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: getMarkerColor(CatType.KITTEN) }}></div>
                <span className="text-sm text-gray-600">{t('common.cat.type.kitten')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <StatusUpdateModal
        isOpen={statusModalOpen}
        onClose={() => {
          setStatusModalOpen(false);
          setSelectedReport(null);
        }}
        report={selectedReport}
        onStatusUpdated={fetchReports}
      />
    </div>
  );
}; 