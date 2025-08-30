'use client';

import { useEffect, useState } from 'react';

export default function GeoServerMap({ srtData, videoRef, onLocationUpdate, getLocationName }) {
  const [isClient, setIsClient] = useState(false);
  const [MapComponent, setMapComponent] = useState(null);

  useEffect(() => {
    setIsClient(true);
    // Dynamically import the map component to avoid SSR issues
    import('./MapComponent').then((module) => {
      setMapComponent(() => module.default);
    });
  }, []);

  if (!isClient || !MapComponent) {
    return (
      <div id="geoserver-map-container" style={{ height: '400px', width: '100%' }}>
        <div style={{ 
          height: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: '#f5f5f5',
          color: '#666'
        }}>
          Loading map...
        </div>
      </div>
    );
  }

  // Helper function to convert SRT timestamp to seconds
  const timeToSeconds = (timeValue) => {
    // If it's already a number (float seconds), return as is
    if (typeof timeValue === 'number') {
      return timeValue;
    }
    
    // If it's a string in SRT format (HH:MM:SS,mmm), parse it
    if (typeof timeValue === 'string' && timeValue.includes(':')) {
      const [time, ms] = timeValue.split(',');
      const [hours, minutes, seconds] = time.split(':').map(Number);
      return hours * 3600 + minutes * 60 + seconds + parseInt(ms || 0) / 1000;
    }
    
    // Fallback: try to parse as float
    return parseFloat(timeValue) || 0;
  };

  return (
    <MapComponent 
      srtData={srtData} 
      videoRef={videoRef} 
      timeToSeconds={timeToSeconds}
      onLocationUpdate={onLocationUpdate}
      getLocationName={getLocationName}
    />
  );
}
