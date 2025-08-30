// Test script for enhanced location detection
// Testing with Bangalore coordinates from your SRT file

const testCoordinates = [
  { lat: 12.936080, lon: 77.610699, name: "Sample Point 1" },
  { lat: 12.936180, lon: 77.610799, name: "Sample Point 2" },
  { lat: 12.936280, lon: 77.610899, name: "Sample Point 3" },
  { lat: 12.936380, lon: 77.610999, name: "Sample Point 4" },
  { lat: 12.936480, lon: 77.611099, name: "Sample Point 5" }
];

// Enhanced location detection function (same as in your upload page)
const getLocationName = async (lat, lon) => {
  try {
    console.log('Fetching precise location for coordinates:', lat, lon);
    
    // Enhanced Nominatim query with higher zoom and detailed address components
    try {
      console.log('Trying enhanced OpenStreetMap Nominatim service...');
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1&extratags=1&namedetails=1&accept-language=en`,
        {
          headers: {
            'User-Agent': 'GeoVideo-LocationApp/1.0 (contact@geovideo.app)'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        console.log('Enhanced Nominatim response for', lat, lon, ':', data);
        
        if (data && data.address) {
          const address = data.address;
          const extratags = data.extratags || {};
          
          // Priority order for city extraction (most specific to general)
          const cityName = address.city || address.town || address.village || 
                          address.municipality || address.county || 
                          address.state_district || address.suburb;
          
          // Enhanced area/ward detection with multiple fallbacks
          const wardName = address.suburb || address.neighbourhood || address.residential || 
                         address.quarter || address.hamlet || address.city_district || 
                         address.borough || address.ward || address.district ||
                         address.locality || address.sublocality;
          
          // Enhanced water body detection with extratags
          const waterBodyName = address.water || address.river || address.stream || 
                              address.canal || address.lake || address.reservoir || 
                              address.pond || extratags.waterway || extratags.water;
          
          // Enhanced highway detection with road hierarchy
          const highwayName = address.trunk || address.primary || address.secondary || 
                            address.motorway || address.highway || 
                            extratags.highway || extratags.route;
          
          const roadName = address.road || address.pedestrian || address.footway || 
                         address.path || address.cycleway;
          
          console.log('Enhanced extraction results:');
          console.log('- City/Town:', cityName);
          console.log('- Ward/Area:', wardName);
          console.log('- Water Body:', waterBodyName);
          console.log('- Highway/Route:', highwayName);
          console.log('- Road:', roadName);
          console.log('- Extratags:', extratags);
          
          // Build mandatory location string: City + Ward + (River OR Highway)
          let locationParts = [];
          let mandatoryFields = { city: false, waterOrHighway: false };
          
          // 1. City is mandatory
          if (cityName) {
            locationParts.push(cityName);
            mandatoryFields.city = true;
          }
          
          // 2. Ward/Area (dynamic based on coordinates)
          if (wardName && wardName !== cityName) {
            locationParts.push(wardName);
          }
          
          // 3. Water body OR Highway (mandatory - prioritize water bodies)
          if (waterBodyName) {
            const formattedWaterName = waterBodyName.toLowerCase().includes('river') || 
                                     waterBodyName.toLowerCase().includes('stream') || 
                                     waterBodyName.toLowerCase().includes('canal') || 
                                     waterBodyName.toLowerCase().includes('lake') ? 
                                     waterBodyName : `${waterBodyName} River`;
            locationParts.push(formattedWaterName);
            mandatoryFields.waterOrHighway = true;
          } else if (highwayName) {
            const formattedHighwayName = highwayName.toLowerCase().includes('highway') || 
                                       highwayName.toLowerCase().includes('expressway') || 
                                       highwayName.toLowerCase().includes('national') ? 
                                       highwayName : `${highwayName} Highway`;
            locationParts.push(formattedHighwayName);
            mandatoryFields.waterOrHighway = true;
          } else if (roadName) {
            // Use road as fallback for highway requirement
            locationParts.push(roadName);
            mandatoryFields.waterOrHighway = true;
          }
          
          // Return if we have mandatory fields
          if (mandatoryFields.city && mandatoryFields.waterOrHighway && locationParts.length >= 2) {
            return locationParts.join(' : ');
          }
        }
      }
    } catch (error) {
      console.warn('Enhanced Nominatim service error:', error);
    }
    
    // Return fallback if no good result
    const region = lat > 0 ? (lon > 0 ? 'Northeast' : 'Northwest') : (lon > 0 ? 'Southeast' : 'Southwest');
    return `${region} Region : Coordinate Area : Local Route (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
    
  } catch (error) {
    console.error('Error in enhanced location fetching:', error);
    return `Location Area : Coordinate Zone : Local Route (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
  }
};

// Test function
async function testLocationDetection() {
  console.log('=== TESTING ENHANCED LOCATION DETECTION ===\n');
  
  for (const coord of testCoordinates) {
    console.log(`\n--- Testing ${coord.name} (${coord.lat}, ${coord.lon}) ---`);
    const location = await getLocationName(coord.lat, coord.lon);
    console.log(`Result: ${location}`);
    console.log('---');
    
    // Add delay between requests to be respectful to APIs
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n=== TESTING COMPLETE ===');
}

// Run the test
testLocationDetection();
