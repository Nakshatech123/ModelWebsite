'use client';

import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

export default function MapComponent({ srtData, videoRef, timeToSeconds, onLocationUpdate, getLocationName }) {
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  // Debug logging
  useEffect(() => {
    console.log('MapComponent mounted with props:', {
      srtData: srtData?.length,
      videoRef: !!videoRef,
      videoRefCurrent: !!videoRef?.current,
      timeToSeconds: !!timeToSeconds,
      onLocationUpdate: !!onLocationUpdate
    });
    
    if (videoRef?.current) {
      console.log('Video element found:', {
        tagName: videoRef.current.tagName,
        src: videoRef.current.src,
        duration: videoRef.current.duration,
        currentTime: videoRef.current.currentTime
      });
    } else {
      console.warn('Video element not found or not ready');
    }
  }, [srtData, videoRef, timeToSeconds, onLocationUpdate, getLocationName]);

  // Initialize the map
  useEffect(() => {
    if (mapRef.current) return;

    const initialCoords = srtData?.[0] ? [srtData[0].lat, srtData[0].lon] : [20.5937, 78.9629];
    console.log('Initializing map with coordinates:', initialCoords);
    
    const map = L.map('geoserver-map-container', {
      center: initialCoords,
      zoom: srtData?.[0] ? 19 : 5,
      maxZoom: 19
    });

    L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri',
      maxZoom: 19
    }).addTo(map);

    // Only add GeoServer layer if you have it configured
    // L.tileLayer.wms('http://localhost:8080/geoserver/wms', {
    //   layers: 'YOUR_WORKSPACE:YOUR_LAYER',
    //   format: 'image/png',
    //   transparent: true,
    // }).addTo(map);

    mapRef.current = map;

    // Add initial marker if SRT data exists
    if (srtData && srtData.length > 0) {
      const firstPosition = [srtData[0].lat, srtData[0].lon];
      const icon = L.icon({ 
        iconUrl: '/marker1.png', 
        iconSize: [32, 32], 
        iconAnchor: [16, 32] 
      });
      markerRef.current = L.marker(firstPosition, { icon }).addTo(map);
      
      // Add click event for coordinates display
      markerRef.current.on('click', () => {
        L.popup()
          .setLatLng(firstPosition)
          .setContent(`Lat: ${srtData[0].lat.toFixed(6)}, Lon: ${srtData[0].lon.toFixed(6)}`)
          .openOn(map);
      });
      
      console.log('Initial marker placed at:', firstPosition);
      
      // Get initial location name
      console.log('Checking location update functions:', {
        onLocationUpdate: !!onLocationUpdate,
        getLocationName: !!getLocationName
      });
      
      if (onLocationUpdate) {
        console.log('Calling onLocationUpdate with:', srtData[0].lat, srtData[0].lon);
        onLocationUpdate(srtData[0].lat, srtData[0].lon);
      } else {
        console.warn('onLocationUpdate function not provided');
      }
    }
  }, [srtData]);

  // Fix sizing issue
  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => {
        mapRef.current.invalidateSize();
      }, 100);
    }
  }, [srtData]);

  // Sync video time with the map marker
  useEffect(() => {
    const videoElement = videoRef?.current;
    if (!videoElement || !mapRef.current || !srtData || !timeToSeconds) {
      console.log('Missing dependencies for video sync:', {
        videoElement: !!videoElement,
        mapRef: !!mapRef.current,
        srtData: !!srtData,
        timeToSeconds: !!timeToSeconds
      });
      return;
    }

    // Add a small delay to ensure video is fully loaded
    const setupVideoSync = () => {
      console.log('Setting up video sync for:', videoElement.src);
      
      const onTimeUpdate = () => {
        const currentTime = videoElement.currentTime;
        console.log('Video current time:', currentTime);
        
        const segment = srtData.find(s => {
          const startTime = timeToSeconds(s.start);
          const endTime = timeToSeconds(s.end);
          return currentTime >= startTime && currentTime <= endTime;
        });

        if (segment) {
          const position = [segment.lat, segment.lon];
          console.log('Moving marker to:', position, 'for time:', currentTime);
          
          if (!markerRef.current) {
            const icon = L.icon({ 
              iconUrl: '/marker1.png', 
              iconSize: [32, 32], 
              iconAnchor: [16, 32] 
            });
            markerRef.current = L.marker(position, { icon }).addTo(mapRef.current);
          } else {
            markerRef.current.setLatLng(position);
          }

          // Update click event to display current coordinates
          markerRef.current.off('click');
          markerRef.current.on('click', () => {
            L.popup()
              .setLatLng(position)
              .setContent(`Lat: ${segment.lat.toFixed(6)}, Lon: ${segment.lon.toFixed(6)}<br>Time: ${segment.start} - ${segment.end}`)
              .openOn(mapRef.current);
          });

          // Smoothly pan to the new position
          mapRef.current.panTo(position);
          
          // Update location name when marker moves
          console.log('Marker moved to new position:', segment.lat, segment.lon);
          if (onLocationUpdate) {
            console.log('Calling onLocationUpdate for new position');
            onLocationUpdate(segment.lat, segment.lon);
          } else {
            console.warn('onLocationUpdate function not available during video sync');
          }
        } else {
          console.log('No matching segment found for time:', currentTime);
        }
      };

      videoElement.addEventListener('timeupdate', onTimeUpdate);
      videoElement.addEventListener('play', onTimeUpdate);
      videoElement.addEventListener('loadedmetadata', onTimeUpdate);
      
      return () => {
        videoElement.removeEventListener('timeupdate', onTimeUpdate);
        videoElement.removeEventListener('play', onTimeUpdate);
        videoElement.removeEventListener('loadedmetadata', onTimeUpdate);
      };
    };

    // Check if video is already loaded or wait for it
    if (videoElement.readyState >= 1) {
      return setupVideoSync();
    } else {
      const onLoadedMetadata = () => {
        videoElement.removeEventListener('loadedmetadata', onLoadedMetadata);
        return setupVideoSync();
      };
      videoElement.addEventListener('loadedmetadata', onLoadedMetadata);
      
      return () => {
        videoElement.removeEventListener('loadedmetadata', onLoadedMetadata);
      };
    }
  }, [srtData, videoRef, timeToSeconds, onLocationUpdate, getLocationName]);

  return (
    <div>
      <div id="geoserver-map-container" style={{ height: '400px', width: '100%' }}></div>
      {srtData?.length > 0 ? (
        <div style={{ marginTop: '10px', fontSize: '14px', color: '#f7f3f3ff' }}>
          {/* <p>🌍 Map shows GPS coordinates from your SRT file. The marker moves as the video plays.</p>
          <p>📍 Found {srtData.length} coordinate points in the timeline.</p>
          <p>🎯 First coordinate: {srtData[0].lat.toFixed(6)}, {srtData[0].lon.toFixed(6)}</p> */}
        </div>
      ) : (
        <div style={{ marginTop: '10px', fontSize: '14px', color: '#999' }}>
          <p>⚠️ No coordinate data found in SRT file. Make sure your SRT file contains latitude and longitude information.</p>
        </div>
      )}
    </div>
  );
}
