// Test file to verify geocoding works
async function testLocationFetch() {
  // Test coordinates for Bangalore
  const lat = 12.936080;
  const lon = 77.610699;
  
  console.log('Testing location fetch for:', lat, lon);
  
  try {
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
    );
    
    if (response.ok) {
      const data = await response.json();
      console.log('BigDataCloud response:', data);
      
      const city = data.city || data.locality || data.principalSubdivision;
      const area = data.localityInfo?.administrative?.[3]?.name || 
                  data.localityInfo?.administrative?.[4]?.name ||
                  data.localityInfo?.administrative?.[2]?.name;
      
      console.log('Extracted - City:', city, 'Area:', area);
      
      if (city && area && city !== area) {
        console.log('Result:', `${city}: ${area}`);
      } else if (city) {
        console.log('Result:', city);
      }
    } else {
      console.error('Response not OK:', response.status);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run test
testLocationFetch();
