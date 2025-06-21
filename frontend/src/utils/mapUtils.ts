import { CatType, ReportStatus } from '../types/report';

// Bangkok and connected provinces boundaries
export const BANGKOK_BOUNDS = {
  north: 14.2,  // Northern boundary
  south: 13.4,  // Southern boundary
  east: 100.8,  // Eastern boundary
  west: 100.3   // Western boundary
};

// Function to check if a location is within Bangkok and connected provinces
export const isWithinBangkokArea = (lat: number, lng: number): boolean => {
  return lat >= BANGKOK_BOUNDS.south && 
         lat <= BANGKOK_BOUNDS.north && 
         lng >= BANGKOK_BOUNDS.west && 
         lng <= BANGKOK_BOUNDS.east;
};

// Custom marker SVG path - Modern teardrop design
export const MARKER_PATH = "M12,2C8.13,2 5,5.13 5,9c0,5.25 7,13 7,13s7,-7.75 7,-13c0,-3.87 -3.13,-7 -7,-7zM9.5,9c0,-1.38 1.12,-2.5 2.5,-2.5s2.5,1.12 2.5,2.5 -1.12,2.5 -2.5,2.5 -2.5,-1.12 -2.5,-2.5z";

// Helper function to get marker color based on cat type
export const getMarkerColor = (type: CatType): string => {
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
export const getStatusColor = (status: ReportStatus): string => {
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
export const DEGREES_PER_KM = 0.009; // Approximately 0.009 degrees per kilometer at the equator

// Add custom styles for info window
export const infoWindowStyles = `
  .gm-style-iw {
    padding: 0 !important;
    margin: 0 !important;
    max-width: none !important;
  }
  .gm-style-iw-d {
    padding: 0 !important;
    margin: 0 !important;
    overflow: hidden !important;
  }
  .gm-style-iw-c {
    padding: 0 !important;
    margin: 0 !important;
    border-radius: 8px !important;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
  }
  .gm-style-iw-ch {
    display: none !important;
  }
  .gm-style-iw-chr {
    position: absolute !important;
    right: 0 !important;
  }
  .gm-style-iw-t::after {
    display: none !important;
  }
`;

// Travel time calculation using Google Maps Distance Matrix API
export const calculateTravelTimes = async (
  origin: google.maps.LatLng,
  destinations: google.maps.LatLng[],
  language: string = 'th'
): Promise<(string | null)[]> => {
  try {
    const service = new google.maps.DistanceMatrixService();
    
    const request: google.maps.DistanceMatrixRequest = {
      origins: [origin],
      destinations: destinations,
      travelMode: google.maps.TravelMode.DRIVING,
      language: language,
      unitSystem: google.maps.UnitSystem.METRIC,
    };

    const result = await service.getDistanceMatrix(request);
    
    if (result.rows && result.rows.length > 0) {
      const row = result.rows[0];
      if (row.elements) {
        return row.elements.map(element => {
          if (element.status === 'OK' && element.duration) {
            return element.duration.text;
          }
          return null;
        });
      }
    }
    
    return destinations.map(() => null);
  } catch (error) {
    console.error('Error calculating travel times:', error);
    return destinations.map(() => null);
  }
};

// Single travel time calculation (for backward compatibility)
export const calculateTravelTime = async (
  origin: google.maps.LatLng,
  destination: google.maps.LatLng,
  language: string = 'th'
): Promise<string | null> => {
  const results = await calculateTravelTimes(origin, [destination], language);
  return results[0];
};

// Format travel time for display
export const formatTravelTime = (travelTime: string | null, t: (key: string) => string): string => {
  if (!travelTime) {
    return '';
  }
  return travelTime;
}; 