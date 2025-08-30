// Test for water bodies and highways near your coordinates
const testForWaterAndHighways = async (lat, lon) => {
  try {
    console.log(`\n=== SEARCHING FOR WATER BODIES AND HIGHWAYS NEAR (${lat}, ${lon}) ===`);
    
    const overpassQuery = `
      [out:json][timeout:30];
      (
        // Major rivers and water bodies in wider area
        way["waterway"~"^(river|stream|canal)$"]["name"](around:5000,${lat},${lon});
        relation["waterway"~"^(river|stream)$"]["name"](around:5000,${lat},${lon});
        way["natural"="water"]["name"](around:2000,${lat},${lon});
        
        // National highways and major roads  
        way["highway"~"^(trunk|primary|motorway)$"]["name"](around:2000,${lat},${lon});
        relation["route"="road"]["network"~"^(NH|SH|AH)"]["ref"](around:5000,${lat},${lon});
        way["ref"~"^(NH|SH|AH)"](around:3000,${lat},${lon});
      );
      out tags;
    `;
    
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: overpassQuery,
      headers: {
        'Content-Type': 'text/plain'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Found water bodies and highways:');
      
      const waterBodies = [];
      const highways = [];
      const nationalHighways = [];
      
      data.elements?.forEach(element => {
        const tags = element.tags || {};
        
        if (tags.waterway || tags.natural === 'water') {
          if (tags.name) {
            waterBodies.push({
              name: tags.name,
              type: tags.waterway || tags.natural,
              id: element.id
            });
          }
        }
        
        if (tags.highway || tags.route === 'road') {
          if (tags.ref && (tags.network === 'NH' || tags.network === 'SH' || tags.ref?.startsWith('NH') || tags.ref?.startsWith('SH'))) {
            nationalHighways.push({
              name: tags.name || tags.ref,
              ref: tags.ref,
              network: tags.network,
              type: 'National/State Highway'
            });
          } else if (tags.name && ['trunk', 'primary', 'motorway'].includes(tags.highway)) {
            highways.push({
              name: tags.name,
              type: tags.highway,
              ref: tags.ref
            });
          }
        }
      });
      
      console.log('\n--- WATER BODIES FOUND ---');
      waterBodies.forEach(water => {
        console.log(`${water.name} (${water.type})`);
      });
      
      console.log('\n--- NATIONAL/STATE HIGHWAYS FOUND ---');
      nationalHighways.forEach(highway => {
        console.log(`${highway.name} (${highway.type}) - ${highway.ref || 'No ref'}`);
      });
      
      console.log('\n--- MAJOR ROADS FOUND ---');
      highways.forEach(highway => {
        console.log(`${highway.name} (${highway.type}) - ${highway.ref || 'No ref'}`);
      });
      
      // Simulate enhanced location with priority
      let locationParts = ['Bengaluru', 'Koramangala'];
      
      if (waterBodies.length > 0) {
        const primaryWater = waterBodies[0].name;
        const waterName = primaryWater.toLowerCase().includes('river') ? 
                         primaryWater : `${primaryWater} River`;
        locationParts.push(waterName);
        console.log(`\n🏆 ENHANCED RESULT WITH WATER BODY: ${locationParts.join(' : ')}`);
      } else if (nationalHighways.length > 0) {
        locationParts.push(nationalHighways[0].name);
        console.log(`\n🏆 ENHANCED RESULT WITH NATIONAL HIGHWAY: ${locationParts.join(' : ')}`);
      } else if (highways.length > 0) {
        locationParts.push(highways[0].name);
        console.log(`\n🏆 ENHANCED RESULT WITH MAJOR ROAD: ${locationParts.join(' : ')}`);
      } else {
        locationParts.push('Hosur Road');
        console.log(`\n🏆 CURRENT RESULT WITH LOCAL ROAD: ${locationParts.join(' : ')}`);
      }
      
    } else {
      console.log('Failed to fetch Overpass data');
    }
    
  } catch (error) {
    console.error('Error searching for water bodies and highways:', error);
  }
};

// Test with your coordinates
testForWaterAndHighways(12.936080, 77.610699);
