import { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, InfoWindow } from '@react-google-maps/api';
import { api } from '../services/apiService';
import { Report, ReportStatus, CatType } from '../types/report';
import { Spinner } from '../components/Spinner';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { StatusUpdateModal } from '../components/StatusUpdateModal';

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

// Add helper functions for Thai text
const getStatusText = (status: ReportStatus): string => {
  switch (status) {
    case ReportStatus.PENDING:
      return "กำลังดำเนินการ";
    case ReportStatus.COMPLETED:
      return "เสร็จสิ้น";
    case ReportStatus.ON_HOLD:
      return "รอดำเนินการ";
    case ReportStatus.CANCELLED:
      return "ยกเลิก";
    default:
      return status;
  }
};

const getTypeText = (type: CatType): string => {
  switch (type) {
    case CatType.STRAY:
      return "แมวจร";
    case CatType.INJURED:
      return "แมวบาดเจ็บ";
    case CatType.SICK:
      return "แมวป่วย";
    case CatType.KITTEN:
      return "ลูกแมว";
    default:
      return type;
  }
};

export const MapView = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const reportId = searchParams.get('reportId') ? Number(searchParams.get('reportId')) : null;
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<ReportStatus>(ReportStatus.PENDING);
  const [remark, setRemark] = useState('');
  const [typeFilter, setTypeFilter] = useState<CatType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('all');
  const [mapRef, setMapRef] = useState<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
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
              ">รายงาน #${report.id}</h3>
            </div>

            <div style="
              display: grid;
              grid-template-columns: auto 1fr;
              gap: 8px 16px;
              font-size: 14px;
            ">
              <div style="color: #6b7280;">สถานะ:</div>
              <div style="color: #1f2937; font-weight: 500;">${getStatusText(report.status)}</div>
              
              <div style="color: #6b7280;">ประเภท:</div>
              <div style="color: #1f2937; font-weight: 500;">${getTypeText(report.type)}</div>
              
              <div style="color: #6b7280;">จำนวนแมว:</div>
              <div style="color: #1f2937; font-weight: 500;">${report.numberOfCats} ตัว</div>
              
              ${report.description ? `
                <div style="color: #6b7280;">รายละเอียด:</div>
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
              อัปเดตสถานะ
            </button>
          </div>
        </div>
      `,
      pixelOffset: new google.maps.Size(0, -10),
    });
    infoWindow.open(mapRef, markersRef.current.find(m => m.getTitle() === `รายงาน #${report.id}`));
    infoWindowRef.current = infoWindow;
    setSelectedReport(report);
  }, [mapRef, setSearchParams]);

  // Update markers when map or filtered reports change
  useEffect(() => {
    if (!mapRef || !isLoaded) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Create new markers
    const newMarkers = reports.filter(report => {
      const typeMatch = typeFilter === 'all' || report.type === typeFilter;
      const statusMatch = statusFilter === 'all' || report.status === statusFilter;
      return typeMatch && statusMatch;
    }).map(report => {
      const marker = new google.maps.Marker({
        map: mapRef,
        position: { lat: report.location.lat, lng: report.location.long },
        icon: getMarkerSVG(report.type),
        title: `รายงาน #${report.id}`,
      });

      marker.addListener('click', () => handleMarkerClick(report));
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
        const targetMarker = newMarkers.find(m => m.getTitle() === `รายงาน #${reportId}`);
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
          const position = marker.getPosition();
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
  }, [mapRef, reports, isLoaded, reportId, typeFilter, statusFilter, handleMarkerClick]);

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

  // Helper function to get marker color based on status
  const getMarkerColor = (status: ReportStatus): string => {
    switch (status) {
      case ReportStatus.PENDING:
        return "#FFA500"; // Orange
      case ReportStatus.COMPLETED:
        return "#00FF00"; // Green
      case ReportStatus.ON_HOLD:
        return "#FFFF00"; // Yellow
      case ReportStatus.CANCELLED:
        return "#FF0000"; // Red
      default:
        return "#808080"; // Gray
    }
  };

  // Get marker SVG configuration after Google Maps is loaded
  const getMarkerSVG = (type: CatType) => {
    return {
      path: "M12,2C8.13,2 5,5.13 5,9c0,5.25 7,13 7,13s7,-7.75 7,-13c0,-3.87 -3.13,-7 -7,-7zM9.5,9c0,-1.38 1.12,-2.5 2.5,-2.5s2.5,1.12 2.5,2.5 -1.12,2.5 -2.5,2.5 -2.5,-1.12 -2.5,-2.5z",
      fillColor: "#FF0000", // Default red color
      fillOpacity: 1,
      strokeWeight: 1,
      strokeColor: "#000000",
      scale: 1.5,
      anchor: new google.maps.Point(12, 24),
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
            <label className="block text-sm font-medium text-gray-700 mb-1">กรองตามประเภท</label>
            <select
              className="w-full p-2 border rounded"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as CatType | 'all')}
            >
              <option value="all">ทุกประเภท</option>
              {Object.values(CatType).map((type) => (
                <option key={type} value={type}>
                  {getTypeText(type)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">กรองตามสถานะ</label>
            <select
              className="w-full p-2 border rounded"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ReportStatus | 'all')}
            >
              <option value="all">ทุกสถานะ</option>
              {Object.values(ReportStatus).map((status) => (
                <option key={status} value={status}>
                  {getStatusText(status)}
                </option>
              ))}
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