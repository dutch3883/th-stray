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
  height: 'calc(100vh - 120px)'
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

// Helper function to get marker color based on status
const getMarkerColor = (status: ReportStatus): string => {
  switch (status) {
    case ReportStatus.PENDING:
      return '#FFE44D'; // Softer Gold
    case ReportStatus.COMPLETED:
      return '#7FFF00'; // Softer Green
    case ReportStatus.ON_HOLD:
      return '#FFB6C1'; // Light Pink
    case ReportStatus.CANCELLED:
      return '#FF8C00'; // Dark Orange
    default:
      return '#FFFFFF'; // White
  }
};

export const MapView = () => {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Get initial states from URL parameters
  const reportId = searchParams.get('reportId') ? Number(searchParams.get('reportId')) : null;
  const initialTypeFilter = searchParams.get('type') as CatType || 'all';
  const initialStatusFilter = searchParams.get('status') as ReportStatus || 'all';
  
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<ReportStatus>(ReportStatus.PENDING);
  const [remark, setRemark] = useState('');
  const [typeFilter, setTypeFilter] = useState<CatType | 'all'>(initialTypeFilter);
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>(initialStatusFilter);
  const [mapRef, setMapRef] = useState<google.maps.Map | null>(null);
  const markersRef = useRef<any[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const reportsRef = useRef<Report[]>([]);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY,
    language: TH_LANG,
    region: TH_REGION,
  });

  // Update reportsRef when reports change
  useEffect(() => {
    reportsRef.current = reports;
  }, [reports]);

  // Update URL when filters change
  useEffect(() => {
    const params: Record<string, string> = {};
    if (reportId) params.reportId = reportId.toString();
    if (typeFilter !== 'all') params.type = typeFilter;
    if (statusFilter !== 'all') params.status = statusFilter;
    setSearchParams(params);
  }, [reportId, typeFilter, statusFilter, setSearchParams]);

  const handleMarkerClick = useCallback((report: Report) => {
    setSearchParams({ reportId: report.id.toString() });
    
    if (infoWindowRef.current) {
      infoWindowRef.current.close();
    }
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
                background-color: ${getMarkerColor(report.status)};
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
              onclick="console.log('Button clicked'); window.dispatchEvent(new CustomEvent('updateStatus', { detail: ${report.id} }))"
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
    }
  }, [mapRef, setSearchParams, t]);

  // Custom marker class that extends OverlayView
  const createCustomMarker = (
    position: google.maps.LatLng,
    status: ReportStatus,
    reportId: number,
    map: google.maps.Map
  ) => {
    class CustomMarker extends google.maps.OverlayView {
      public position: google.maps.LatLng;
      public status: ReportStatus;
      public reportId: number;
      public marker: google.maps.Marker;
      private statusText: HTMLDivElement;
      private map: google.maps.Map;

      constructor() {
        super();
        this.position = position;
        this.status = status;
        this.reportId = reportId;
        this.map = map;

        // Create marker
        this.marker = new google.maps.Marker({
          position: position,
          map: map,
          icon: {
            path: "M12,2C8.13,2 5,5.13 5,9c0,5.25 7,13 7,13s7,-7.75 7,-13c0,-3.87 -3.13,-7 -7,-7zM9.5,9c0,-1.38 1.12,-2.5 2.5,-2.5s2.5,1.12 2.5,2.5 -1.12,2.5 -2.5,2.5 -2.5,-1.12 -2.5,-2.5z",
            fillColor: "#FF0000",
            fillOpacity: 1,
            strokeWeight: 1,
            strokeColor: "#000000",
            scale: 1.5,
            anchor: new google.maps.Point(12, 24),
          },
          title: `${t('map.report')} #${reportId}`,
          zIndex: 1
        });

        // Create status text
        this.statusText = document.createElement('div');
        this.statusText.style.position = 'absolute';
        this.statusText.style.color = getMarkerColor(status);
        this.statusText.style.fontSize = '12px';
        this.statusText.style.fontWeight = 'bold';
        this.statusText.style.textAlign = 'center';
        this.statusText.style.width = '100px';
        this.statusText.style.marginLeft = '-50px';
        this.statusText.style.marginTop = '-60px';
        this.statusText.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.statusText.style.padding = '2px 4px';
        this.statusText.style.borderRadius = '4px';
        this.statusText.style.zIndex = '1';

        // Set status text content with both status and ID
        let statusText = '';
        switch (status) {
          case ReportStatus.PENDING:
            statusText = t('report.status.pending');
            break;
          case ReportStatus.COMPLETED:
            statusText = t('report.status.completed');
            break;
          case ReportStatus.ON_HOLD:
            statusText = t('report.status.on_hold');
            break;
          case ReportStatus.CANCELLED:
            statusText = t('report.status.cancelled');
            break;
          default:
            statusText = status;
        }
        this.statusText.textContent = `#${reportId} - ${statusText}`;

        this.setMap(map);
      }

      onAdd() {
        const panes = this.getPanes();
        if (panes && panes.overlayLayer) {
          panes.overlayLayer.appendChild(this.statusText);
          (panes.overlayLayer as HTMLElement).style.zIndex = '1';
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
        this.marker.addListener('click', callback);
      }
    }

    return new CustomMarker();
  };

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
        report.id,
        mapRef
      );

      marker.addClickListener(() => handleMarkerClick(report));
      return marker;
    });

    markersRef.current = newMarkers;

    // If there's a specific report to focus on
    if (reportId) {
      const targetReport = reportsRef.current.find(r => r.id === reportId);
      if (targetReport) {
        const position = { lat: targetReport.location.lat, lng: targetReport.location.long };
        mapRef.setCenter(position);
        mapRef.setZoom(16);
        
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

        newMarkers.forEach(marker => {
          const position = marker.marker.getPosition();
          if (position && isWithinBangkokArea(position.lat(), position.lng())) {
            bounds.extend(position);
            hasValidMarkers = true;
          }
        });

        if (hasValidMarkers) {
          const ne = bounds.getNorthEast();
          const sw = bounds.getSouthWest();
          const latPadding = (ne.lat() - sw.lat()) * 0.1;
          const lngPadding = (ne.lng() - sw.lng()) * 0.1;

          bounds.extend(new google.maps.LatLng(ne.lat() + latPadding, ne.lng() + lngPadding));
          bounds.extend(new google.maps.LatLng(sw.lat() - latPadding, sw.lng() - lngPadding));

          mapRef.fitBounds(bounds);
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
    const statusColor = getMarkerColor(status);
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

  if (loading || !isLoaded) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
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

      <div className="flex-1 w-full">
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