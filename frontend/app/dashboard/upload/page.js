'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './upload.module.css';
import VideoPlayer from './VideoPlayer';
import GeoServerMap from './GeoServerMap';
import Cookies from 'js-cookie';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL;
const VideoIcon = () => (
 <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.cardIcon}>
  <path d="M17 10.5V7C17 6.46957 16.7893 5.96086 16.4142 5.58579C16.0391 5.21071 15.5304 5 15 5H4C3.46957 5 2.96086 5.21071 2.58579 5.58579C2.21071 5.96086 2 6.46957 2 7V17C2 17.5304 2.21071 18.0391 2.58579 18.4142C2.96086 18.7893 3.46957 19 4 19H15C15.5304 19 16.0391 18.7893 16.4142 18.4142C16.7893 18.0391 17 17.5304 17 17V13.5L22 18.5V5.5L17 10.5Z" stroke="#4a5568" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
 </svg>
);
const FileIcon = () => (
 <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.cardIcon}>
  <path d="M13 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V9L13 2Z" stroke="#4a5568" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  <polyline points="13 2 13 9 20 9" stroke="#4a5568" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></polyline>
 </svg>
);
const PlusIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 5V19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M5 12H19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const DownloadIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="7 10 12 15 17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const ModelIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.cardIcon}>
        <path d="M12 2L2 7v10c0 5.55 3.84 9.95 9 11 5.16-1.05 9-5.45 9-11V7l-10-5z" stroke="#4a5568" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9 12l2 2 4-4" stroke="#4a5568" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);


const getProjectIcon = (projectType) => {
  switch(projectType) {
    case 'Infrastructure':
    case 'national_highway':
      return (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M2 20h20l-2-6H4l-2 6z"/>
          <path d="M7 16V4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v12"/>
        </svg>
      );
    case 'Environmental':
    case 'river_monitoring':
      return (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
        </svg>
      );
    case 'Urban':
    case 'urban_infrastructure':
      return (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 21h18M5 21V7l8-4v18M13 9h4v12"/>
        </svg>
      );
    case 'forest_survey':
      return (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
      );
    case 'Construction':
    case 'construction_site':
      return (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
      );
    default:
      return (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      );
  }
};

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [csvReportUrl, setCsvReportUrl] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [availableModels, setAvailableModels] = useState([]);
  const [srtFile, setSrtFile] = useState(null);
  const [srtData, setSrtData] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [processedUrl, setProcessedUrl] = useState('');
  const [reports, setReports] = useState(null);
  const [reportProgress, setReportProgress] = useState({
    stepsCompleted: 0,
    totalSteps: 0,
    progressPercent: 0,
    active: true
  });
  const [videoStatus, setVideoStatus] = useState('idle');
  const [error, setError] = useState('');
  const [currentLocation, setCurrentLocation] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [processingProgress, setProcessingProgress] = useState({
    framesProcessed: 0,
    totalFrames: 0,
    progressPercent: 0
  });
  const [uploadType, setUploadType] = useState('video'); // <-- ADD THIS LINE
  const lastLocationFetch = useRef(null);
  const fileInputRef = useRef(null);
  const srtInputRef = useRef(null);
  const processedVideoRef = useRef(null);


 

 useEffect(() => {
  // Fetch available models
  fetchAvailableModels();
  
  const savedResult = localStorage.getItem('video_result');
  if (savedResult) {
   const { processedUrl, srtData, reports } = JSON.parse(savedResult);
   setProcessedUrl(processedUrl);
   setSrtData(srtData);
   setReports(reports || null);
   setVideoStatus('done');
   return;
  }
  const savedJobId = localStorage.getItem('video_job_id');
  const savedPreviewUrl = localStorage.getItem('video_preview_url');
  if (savedJobId) {
   setVideoStatus('processing');
   setPreviewUrl(savedPreviewUrl || '');
   pollStatus(savedJobId);
  }
  return () => {
   if (previewUrl) URL.revokeObjectURL(previewUrl);
  };
 }, []);

 const fetchAvailableModels = async () => {
   try {
     const token = Cookies.get('auth_token');
     console.log('Auth token:', token ? 'present' : 'missing');
     
     const response = await fetch(`${API}/video/models`, {
       headers: {
         'Authorization': `Bearer ${token}`
       }
     });
     
     console.log('Available models API response status:', response.status);
     
     if (response.ok) {
       const data = await response.json();
       console.log('Model data received:', data);
       setAvailableModels(data.models || []);
       // Set first model as default
       if (data.models && data.models.length > 0) {
         setSelectedModel(data.models[0].filename);
       }
     } else {
       console.error('Available models API error:', response.status, response.statusText);
       const errorText = await response.text();
       console.error('Error details:', errorText);
     }
   } catch (error) {
     console.error('Error fetching available models:', error);
   }
 };
  const pollStatus = (jobId) => {
  const token = Cookies.get('auth_token');
  const interval = setInterval(async () => {
   try {
    const res = await fetch(`${API}/video/status/${jobId}`, {
     headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    
    // Update progress if available
    if (data.status === 'processing' && data.frames_processed !== undefined) {
      setProcessingProgress({
        framesProcessed: data.frames_processed || 0,
        totalFrames: data.total_frames || 0,
        progressPercent: data.progress_percent || 0
      });
    }
    
    if (data.status === 'done') {
     const finalProcessedUrl = `${API}${data.processed_video_url}`;
     setProcessedUrl(finalProcessedUrl);
     setVideoStatus('done');

     if (data.reports && data.reports.csv) {
  setCsvReportUrl(`${API}${data.reports.csv}`);
}

     // Show report progress bar
     setReportProgress({
       stepsCompleted: 0,
       totalSteps: 5,
       progressPercent: 0,
       active: true
     });
     // Simulate report progress
     let step = 0;
     const reportInterval = setInterval(() => {
       step++;
       setReportProgress(prev => ({
         ...prev,
         stepsCompleted: step,
         progressPercent: Math.round((step / 5) * 100),
         active: step < 5
       }));
       if (step >= 5) {
         clearInterval(reportInterval);
         setReportProgress(prev => ({ ...prev, active: false }));
       }
     }, 700);

     // Reset progress
     setProcessingProgress({
       framesProcessed: 0,
       totalFrames: 0,
       progressPercent: 0
     });
     
     // Use server timeline data if available, otherwise keep client-parsed data
     const finalSrtData = data.timeline && data.timeline.length > 0 ? data.timeline : srtData;
     setSrtData(finalSrtData);
     
     // Store report URLs if available
     const resultToSave = { 
       processedUrl: finalProcessedUrl, 
       srtData: finalSrtData,
       hasMetrics: data.has_metrics || false,
       modelUsed: data.model_used || '',
       reports: data.reports || null
     };
     
     // Set reports state for UI display
     setReports(data.reports || null);
     
     localStorage.setItem('video_result', JSON.stringify(resultToSave));
     localStorage.removeItem('video_job_id');
     localStorage.removeItem('video_preview_url');
     clearInterval(interval);
    } else if (['cancelled', 'error', 'not_found'].includes(data.status)) {
     setError(data.detail || 'Processing failed or was cancelled.');
     setVideoStatus('preview');
     localStorage.removeItem('video_job_id');
     localStorage.removeItem('video_preview_url');
     clearInterval(interval);
    }
   } catch (err) {
    setError('Connection to server lost during polling.');
    setVideoStatus('preview');
    localStorage.removeItem('video_job_id');
    localStorage.removeItem('video_preview_url');
    clearInterval(interval);
   }
  }, 10000);
 };
 
 // Function to get location name from coordinates using reverse geocoding
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
         console.log('Enhanced Nominatim response:', data);
         
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
     
     // Enhanced Overpass API query for missing mandatory fields
     try {
       console.log('Trying enhanced Overpass API for mandatory fields...');
       const overpassQuery = `
         [out:json][timeout:30];
         (
           // Water bodies (rivers, streams, canals, lakes) - prioritized
           way["waterway"~"^(river|stream|canal|drain)$"]["name"](around:500,${lat},${lon});
           way["natural"="water"]["name"](around:1000,${lat},${lon});
           relation["waterway"~"^(river|stream)$"]["name"](around:2000,${lat},${lon});
           
           // National highways and major roads with refs
           way["highway"~"^(trunk|primary|secondary|motorway)$"]["name"](around:300,${lat},${lon});
           way["ref"~"^(NH|SH|AH)"]["name"](around:1000,${lat},${lon});
           relation["route"="road"]["network"~"^(NH|SH|AH)"]["ref"](around:1500,${lat},${lon});
           
           // Administrative boundaries for city and ward
           relation["boundary"="administrative"]["admin_level"~"^[4-9]$"]["name"](around:3000,${lat},${lon});
           way["place"~"^(city|town|village|suburb|neighbourhood|hamlet)$"]["name"](around:2000,${lat},${lon});
         );
         out tags;
       `;
       
       const overpassResponse = await fetch('https://overpass-api.de/api/interpreter', {
         method: 'POST',
         body: overpassQuery,
         headers: {
           'Content-Type': 'text/plain'
         }
       });
       
       if (overpassResponse.ok) {
         const overpassData = await overpassResponse.json();
         console.log('Enhanced Overpass API response:', overpassData);
         
         let cityFound = null, areaFound = null, waterFound = null, highwayFound = null;
         let nationalHighway = null, waterBodies = [], highways = [];
         
         overpassData.elements?.forEach(element => {
           const tags = element.tags || {};
           
           // Extract administrative boundaries and places
           if (tags.boundary === 'administrative' || tags.place) {
             if (tags.admin_level === '8' || tags.admin_level === '9' || 
                 tags.place === 'suburb' || tags.place === 'neighbourhood') {
               if (!areaFound && tags.name) areaFound = tags.name;
             }
             if (tags.admin_level === '4' || tags.admin_level === '5' || tags.admin_level === '6' || 
                 tags.place === 'city' || tags.place === 'town' || tags.place === 'village') {
               if (!cityFound && tags.name) cityFound = tags.name;
             }
           }
           
           // Collect water features with priority ranking
           if (tags.waterway || tags.natural === 'water') {
             if (tags.name) {
               const priority = tags.waterway === 'river' ? 1 : 
                              tags.waterway === 'stream' ? 2 : 
                              tags.natural === 'water' ? 3 : 4;
               waterBodies.push({ name: tags.name, priority, type: tags.waterway || tags.natural });
             }
           }
           
           // Collect highways with priority for national highways
           if (tags.highway || tags.route === 'road' || tags.ref) {
             if (tags.ref && (tags.ref.startsWith('NH') || tags.ref.startsWith('SH') || tags.ref.startsWith('AH'))) {
               const hwName = tags.name || tags.ref;
               highways.push({ name: hwName, ref: tags.ref, priority: 1, type: 'national' });
             } else if (tags.name && ['trunk', 'primary', 'secondary', 'motorway'].includes(tags.highway)) {
               highways.push({ name: tags.name, ref: tags.ref, priority: 2, type: tags.highway });
             }
           }
         });
         
         // Sort by priority and select best options
         waterBodies.sort((a, b) => a.priority - b.priority);
         highways.sort((a, b) => a.priority - b.priority);
         
         if (waterBodies.length > 0) waterFound = waterBodies[0].name;
         if (highways.length > 0) {
           const topHighway = highways[0];
           if (topHighway.type === 'national' && topHighway.ref) {
             nationalHighway = topHighway.ref.includes(topHighway.name) ? 
                              topHighway.name : `${topHighway.ref} ${topHighway.name}`;
           } else {
             highwayFound = topHighway.name;
           }
         }
         
         console.log('Enhanced Overpass extraction:');
         console.log('- City Found:', cityFound);
         console.log('- Area Found:', areaFound);
         console.log('- Water Found:', waterFound, `(from ${waterBodies.length} options)`);
         console.log('- National Highway:', nationalHighway);
         console.log('- Highway Found:', highwayFound, `(from ${highways.length} options)`);
         
         // Build enhanced location string with strict priority: Water > National Highway > Major Road
         let locationParts = [];
         
         // Add city (mandatory)
         if (cityFound) {
           locationParts.push(cityFound);
         }
         
         // Add area/ward (dynamic)
         if (areaFound && areaFound !== cityFound) {
           locationParts.push(areaFound);
         }
         
         // Add infrastructure (mandatory - strict priority order)
         if (waterFound) {
           // PRIORITY 1: Water bodies (rivers, lakes, streams)
           const waterName = waterFound.toLowerCase().includes('river') || 
                           waterFound.toLowerCase().includes('lake') ||
                           waterFound.toLowerCase().includes('stream') ? 
                           waterFound : `${waterFound} River`;
           locationParts.push(waterName);
         } else if (nationalHighway) {
           // PRIORITY 2: National/State highways
           locationParts.push(nationalHighway);
         } else if (highwayFound) {
           // PRIORITY 3: Major roads and highways
           const highwayName = highwayFound.toLowerCase().includes('highway') ||
                             highwayFound.toLowerCase().includes('road') ? 
                             highwayFound : `${highwayFound} Highway`;
           locationParts.push(highwayName);
         }
         
         // Return if we have at least city and infrastructure
         if (locationParts.length >= 2) {
           return locationParts.join(' : ');
         }
       }
     } catch (error) {
       console.warn('Enhanced Overpass API error:', error);
     }
     
     // Final enhanced fallback with specific coordinate-based naming
     try {
       console.log('Trying coordinate-specific fallback services...');
       
       // Try multiple geocoding services in parallel for better coverage
       const geocodingPromises = [
         fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`),
         fetch(`https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lon}&key=YOUR_API_KEY&language=en&pretty=1&no_annotations=1`)
           .catch(() => null), // This will fail without API key, but that's expected
       ];
       
       const responses = await Promise.allSettled(geocodingPromises);
       
       for (const result of responses) {
         if (result.status === 'fulfilled' && result.value && result.value.ok) {
           const data = await result.value.json();
           console.log('Fallback geocoding response:', data);
           
           if (data) {
             // BigDataCloud format
             const city = data.city || data.locality || data.principalSubdivision || data.countryName;
             const area = data.localityInfo?.administrative?.[3]?.name || 
                         data.localityInfo?.administrative?.[4]?.name ||
                         data.localityInfo?.administrative?.[2]?.name;
             
             let locationParts = [];
             if (city) locationParts.push(city);
             if (area && area !== city) locationParts.push(area);
             
             // Add a generic feature if we have location but missing water/highway
             if (locationParts.length > 0) {
               locationParts.push('Local Area');
               return locationParts.join(' : ');
             }
           }
         }
       }
     } catch (error) {
       console.warn('Fallback geocoding error:', error);
     }
     
     // Ultimate fallback with coordinate-based naming
     const region = lat > 0 ? (lon > 0 ? 'Northeast' : 'Northwest') : (lon > 0 ? 'Southeast' : 'Southwest');
     return `${region} Region : Coordinate Area : Local Route (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
     
   } catch (error) {
     console.error('Error in enhanced location fetching:', error);
     return `Location Area : Coordinate Zone : Local Route (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
   }
 };
 
 // Wrapper function to handle location updates with loading state
 const handleLocationUpdate = async (lat, lon) => {
   // Rate limiting: don't fetch if same coordinates or too recent
   const coordKey = `${lat.toFixed(4)},${lon.toFixed(4)}`;
   const now = Date.now();
   
   if (lastLocationFetch.current && 
       (lastLocationFetch.current.coords === coordKey || 
        now - lastLocationFetch.current.time < 2000)) {
     return; // Skip if same coordinates or within 2 seconds
   }
   
   lastLocationFetch.current = { coords: coordKey, time: now };
   
   // Immediately show coordinates while loading
   setCurrentLocation(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
   setLocationLoading(true);
   
   try {
     console.log('Starting location fetch for:', lat, lon);
     const locationName = await getLocationName(lat, lon);
     console.log('Location fetch completed:', locationName);
     setCurrentLocation(locationName);
   } catch (error) {
     console.error('Error updating location:', error);
     setCurrentLocation(`Coordinates: ${lat.toFixed(4)}, ${lon.toFixed(4)}`);
   } finally {
     setLocationLoading(false);
   }
 };

 const downloadReport = async (reportUrl, filename) => {
  try {
   const token = Cookies.get('auth_token');
   const response = await fetch(`${API}${reportUrl}`, {
    headers: {
     'Authorization': `Bearer ${token}`
    }
   });
   
   if (response.ok) {
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
   } else {
    setError('Failed to download report');
   }
  } catch (error) {
   console.error('Download error:', error);
   setError('Failed to download report');
  }
 };

 const resetState = () => {
  setSelectedFile(null);
  setSrtFile(null);
  setSrtData(null);
  setPreviewUrl('');
  setProcessedUrl('');
  setReports(null);
  setVideoStatus('idle');
  setError('');
  setCurrentLocation('');
  setLocationLoading(false);
  setProcessingProgress({
    framesProcessed: 0,
    totalFrames: 0,
    progressPercent: 0
  });
  localStorage.removeItem('video_result');
  localStorage.removeItem('video_job_id');
  localStorage.removeItem('video_preview_url');
 };
 const handleCancel = async () => {
  const jobId = localStorage.getItem('video_job_id');
  if (!jobId) return;
  try {
   const token = Cookies.get('auth_token');
   await fetch(`${API}/video/cancel/${jobId}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
   });
  } catch (err) {
   console.error("Failed to send cancel request, but resetting UI anyway.");
  } finally {
   resetState();
  }
 };
  const handleFileChange = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (
    (uploadType === 'video' && file.type.startsWith('video/')) ||
    (uploadType === 'image' && file.type.startsWith('image/'))
  ) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setProcessedUrl('');
    const newPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(newPreviewUrl);
    setVideoStatus('preview');
    setError('');
  } else {
    if (file) setError(`Please select a valid ${uploadType} file.`);
  }
 };
 const handleSrtChange = (e) => {
  const file = e.target.files[0];
  if (file && file.name.toLowerCase().endsWith('.srt')) {
   console.log('SRT file selected:', file.name);
   setSrtFile(file);
   const reader = new FileReader();
   reader.onload = (ev) => {
    const text = ev.target.result;
    console.log('SRT file content length:', text.length);
    const parsed = parseSrtCoordinates(text);
    console.log('Parsed SRT data:', parsed);
    setSrtData(parsed);
    
    if (!parsed) {
      setError('No GPS coordinates found in SRT file. Make sure it contains latitude and longitude data.');
    } else {
      setError(''); // Clear any previous errors
    }
   };
   reader.readAsText(file);
  } else {
      if (file) setError('Please select a valid SRT file.');
  }
 };
 function parseSrtCoordinates(text) {
  console.log('Parsing SRT file:', text.substring(0, 500) + '...');
  const blocks = text.split(/\n\s*\n/);
  const result = [];
  
  for (const block of blocks) {
    const lines = block.split(/\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) continue;
    
    const timeMatch = lines[1]?.match(/(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/);
    if (!timeMatch) continue;

    const textContent = lines.slice(2).join(' ');
    console.log('Processing block text:', textContent);
    
    // More flexible coordinate matching - handles both "latitude" and "lat", "longitude" and "lon"
    // Also handles common typos like "longtitude"
    const latMatch = textContent.match(/lat(?:itude)?\s*[:=]?\s*([-]?\d+\.?\d*)/i);
    const lonMatch = textContent.match(/lon(?:g?titude|gitude)?\s*[:=]?\s*([-]?\d+\.?\d*)/i);
    
    if (latMatch && lonMatch) {
      const lat = parseFloat(latMatch[1]);
      const lon = parseFloat(lonMatch[1]);
      
      // Validate coordinates are within reasonable ranges
      if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
        result.push({
          start: timeMatch[1],
          end: timeMatch[2],
          lat: lat,
          lon: lon,
        });
        console.log('Found coordinates:', { lat, lon, start: timeMatch[1], end: timeMatch[2] });
      } else {
        console.warn('Invalid coordinates found:', { lat, lon });
      }
    } else {
      console.log('No coordinates found in block:', textContent);
    }
  }
  
  console.log('Total coordinates parsed:', result.length);
  return result.length ? result : null;
 }
 const handleVideoDropZoneClick = () => fileInputRef.current.click();
 const handleSrtDropZoneClick = () => srtInputRef.current.click();
 const handleDragOver = (e) => e.preventDefault();
 const handleVideoDrop = (e) => {
  e.preventDefault();
  handleFileChange({ target: { files: e.dataTransfer.files } });
 };
  const handleSrtDrop = (e) => {
  e.preventDefault();
  handleSrtChange({ target: { files: e.dataTransfer.files } });
 };
const handleSubmit = async (e) => {
  e.preventDefault();
  if (!selectedFile) return;
  if (!selectedModel) {
    setError('Please select an AI model for processing');
    return;
  }
  setVideoStatus('processing');
  setError('');
  const token = Cookies.get('auth_token');
  const formData = new FormData();
  formData.append('file', selectedFile);
  formData.append('model_file', selectedModel); // Send the model file name directly

  // Include SRT file if selected
  if (srtFile) {
    formData.append('srt', srtFile);
  }

  localStorage.setItem('video_preview_url', previewUrl);

  try {
    const res = await fetch(`${API}/video/upload/`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Upload failed');

    // Set SRT data from server response if available
    if (data.timeline && data.timeline.length > 0) {
      setSrtData(data.timeline);
    }

    // --- NEW LOGIC STARTS HERE ---
    if (data.job_id) {
      // It's a video: poll the status endpoint
      localStorage.setItem('video_job_id', data.job_id);
      pollStatus(data.job_id);
    } else if (data.url) {
      // It's an image: show it immediately, do NOT poll status
      setProcessedUrl(`${API}${data.url}`);
      setVideoStatus('done');
      if (data.reports && data.reports.csv) {
    setCsvReportUrl(`${API}${data.reports.csv}`);
  }
      localStorage.removeItem('video_job_id');
    } else {
      setError('Processing failed or was cancelled.');
      setVideoStatus('preview');
      localStorage.removeItem('video_job_id');
    }
    // --- NEW LOGIC ENDS HERE ---

  } catch (err) {
    setError(err.message);
    setVideoStatus('preview');
  }
};
  
 return (
    <div className={styles.pageWrapper}>
        <div className={`${styles.container} ${videoStatus === 'done' ? styles.resultsContainer : ''}`}>
         {error && <div className={styles.errorBanner}>{error}<button onClick={() => setError('')}>×</button></div>}

            <div className={styles.header}>
                <p className={styles.breadcrumb}>Video & Processing</p>
             <h1>Upload Your {uploadType === 'video' ? 'Video' : 'Image'}</h1>
             <p className={styles.subtitle}>
                  Upload your {uploadType} file and optional .srt subtitle file to extract and visualize location data
                </p>
            </div>

         {(videoStatus === 'preview' || videoStatus === 'processing') && (
          <div className={styles.previewContainer}>
           {previewUrl && videoStatus === 'preview' && (
            uploadType === 'video'
              ? <VideoPlayer src={previewUrl} status={videoStatus} className={styles.videoPlayer} />
              : <img src={previewUrl} alt="Preview" className={styles.videoPlayer} style={{maxWidth: '100%', maxHeight: 400, borderRadius: 12}} />
           )}
           
           {previewUrl && videoStatus === 'processing' && (
            uploadType === 'video'
              ? <VideoPlayer src={previewUrl} status={videoStatus} className={styles.videoPlayer} />
              : <img src={previewUrl} alt="Preview" className={styles.videoPlayer} style={{maxWidth: '100%', maxHeight: 400, borderRadius: 12}} />
           )}

           {videoStatus === 'processing' && (
            <>
              <div className={styles.progressContainer}>
                <div className={styles.progressHeader}>
                  <h3>Processing {uploadType === 'video' ? 'Video' : 'Image'}</h3>
                  <span className={styles.progressText}>
                    {processingProgress.framesProcessed} / {processingProgress.totalFrames} frames
                    {processingProgress.progressPercent > 0 && ` (${processingProgress.progressPercent}%)`}
                  </span>
                </div>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill}
                    style={{ 
                      width: `${processingProgress.progressPercent}%`,
                      transition: 'width 0.3s ease'
                    }}
                  ></div>
                </div>
                <div className={styles.progressDetails}>
                  <small>
                    {processingProgress.totalFrames > 0 
                      ? `Processing frame ${processingProgress.framesProcessed} of ${processingProgress.totalFrames}`
                      : `Initializing ${uploadType} processing...`
                    }
                  </small>
                </div>
              </div>
              {/* Report Generation Progress */}
              {reportProgress.active && (
                <div className={styles.progressContainer} style={{ marginTop: '2rem' }}>
                  <div className={styles.progressHeader}>
                    <h3>Generating Report</h3>
                    <span className={styles.progressText}>
                      {reportProgress.stepsCompleted} / {reportProgress.totalSteps} steps
                      {reportProgress.progressPercent > 0 && ` (${reportProgress.progressPercent}%)`}
                    </span>
                  </div>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{
                        width: `${reportProgress.progressPercent}%`,
                        transition: 'width 0.3s ease'
                      }}
                    ></div>
                  </div>
                  <div className={styles.progressDetails}>
                    <small>
                      {reportProgress.totalSteps > 0
                        ? `Processing step ${reportProgress.stepsCompleted} of ${reportProgress.totalSteps}`
                        : 'Initializing report generation...'}
                    </small>
                  </div>
                </div>
              )}
              <button onClick={handleCancel} className={styles.cancelButton}>
               Stop Processing
              </button>
            </>
           )}
          </div>
         )}

         {videoStatus === 'done' ? (
          <>
           <div className={`${styles.resultsGrid} ${!srtData ? styles.singleVideo : ''}`}>
    <div className={styles.resultsCard}>
     <h2>Processed {uploadType === 'video' ? 'Video' : 'Image'}</h2>
     <div className={styles.videoContainer}>
      {processedUrl && (
        uploadType === 'video'
          ? <VideoPlayer src={processedUrl} status="done" ref={processedVideoRef} className={styles.videoPlayer} />
          : <img src={processedUrl} alt="Processed" className={styles.videoPlayer} style={{maxWidth: '100%', maxHeight: 400, borderRadius: 12}} />
      )}
      {/* ✅ unified CSV button check */}
      {/* {(csvReportUrl || (reports && reports.csv)) && (
        <a
          href={csvReportUrl || `${API}${reports.csv}`}
          className={styles.csvDownloadButton}
          download
          target="_blank"
          rel="noopener noreferrer"
          style={{ marginTop: '1rem', display: 'inline-block' }}
        >
          Download CSV Report
        </a>
      )} */}

      <div className={styles.videoInfoDisplay}>
        <div className={styles.videoLabel}>{uploadType === 'video' ? 'Video' : 'Image'} Information</div>
        <div className={styles.videoDetails}>
          {selectedFile ? `${selectedFile.name}` : `Processed ${uploadType === 'video' ? 'Video' : 'Image'}`} • Ready for Analysis
        </div>
      </div>
     </div>
    </div>
    {srtData && (
     <div className={styles.resultsCard}>
    <h2>GeoServer Map</h2>
    <div className={styles.mapContainer}>
      <GeoServerMap 
        srtData={srtData} 
        videoRef={processedVideoRef} 
        onLocationUpdate={handleLocationUpdate}
        getLocationName={getLocationName}
      />
       <div className={styles.locationDisplay} style={{ borderRadius: '50px' }}>
         <div className={styles.locationLabel}>Current Location</div>
         {locationLoading ? (
           <div className={styles.loadingLocation}>Loading location...</div>
         ) : currentLocation ? (
           <div className={styles.locationName}>{currentLocation}</div>
         ) : (
           <div className={styles.loadingLocation}>No location data</div>
         )}
       </div>
      </div>
     </div>
    )}
   </div>
   
   {/* Reports Section */}
   {reports && reports.csv && (
    <div className={styles.reportsSection}>
     <h3>Analysis Reports</h3>
     <p>Download detailed analysis reports with metrics and location data</p>
     <div className={styles.reportsGrid}>
      <button 
       onClick={() => downloadReport(reports.csv, `${selectedFile?.name || (uploadType === 'video' ? 'video' : 'image')}_metrics.csv`)}
       className={styles.reportButton}
      >
       <DownloadIcon />
       <span>Download CSV Report</span>
       <small>Spreadsheet with detailed metrics</small>
      </button>
     </div>
    </div>
   )}
   
   <div className={styles.actions}>
    <p>Find this and other files in your <Link href="/dashboard/history">History</Link>.</p>
    <button onClick={resetState} className={`${styles.mainButton} ${styles.fullWidth}`}>Upload Another {uploadType === 'video' ? 'Video' : 'Image'}</button>
   </div>
          </>
         ) : (
          <>
            {/* Only show upload form when not processing */}
            {videoStatus !== 'processing' && (
              <form onSubmit={handleSubmit} className={styles.uploadForm}>
                <div className={styles.uploadLayout}>
                    <div className={styles.fileUploadSection}>
                        {/* Upload Type Dropdown */}
                         <div style={{
                                        marginBottom: '2rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '1rem'
                                                  }}>
                                                    <label
                                                      htmlFor="uploadType"
                                                      style={{
                                                        fontWeight: 700,
                                                        fontSize: '1.1rem',
                                                        color: '#fff',
                                                        letterSpacing: '0.5px'
                                                      }}
                                                    >
                                                      Upload Type:
                                                    </label>
                                                    <select
                                                      id="uploadType"
                                                      value={uploadType}
                                                      onChange={e => {
                                                        setUploadType(e.target.value);
                                                        setSelectedFile(null);
                                                        setPreviewUrl('');
                                                        setError('');
                                                      }}
                                                      style={{
                                                        padding: '0.5rem 1.5rem',
                                                        fontSize: '1.05rem',
                                                        borderRadius: '8px',
                                                        border: '1.5px solid #4a90e2',
                                                        background: '#232b3b',
                                                        color: '#fff',
                                                        outline: 'none',
                                                        boxShadow: '0 2px 8px 0 rgba(0,0,0,0.08)',
                                                        transition: 'border 0.2s'
                                                      }}
                                                      onFocus={e => e.target.style.border = '1.5px solid #50e3c2'}
                                                      onBlur={e => e.target.style.border = '1.5px solid #4a90e2'}
                                                    >
                                                      <option value="video">🎬 Video</option>
                                                      <option value="image">🖼️ Image</option>
                                                    </select>
                                                  </div>
                        {/* Upload Card */}
                        <div className={styles.uploadCard} onClick={handleVideoDropZoneClick} onDragOver={handleDragOver} onDrop={handleVideoDrop}>
                            <div className={styles.cardHeader}>
                                <p>{uploadType === 'video' ? 'Video File (Required)' : 'Image File (Required)'}</p>
                            </div>
                            <div className={styles.cardBody}>
                                <input
                                  type="file"
                                  ref={fileInputRef}
                                  onChange={handleFileChange}
                                  className={styles.fileInput}
                                  accept={uploadType === 'video' ? 'video/*' : 'image/*'}
                                />
                                {uploadType === 'video' ? <VideoIcon /> : <FileIcon />}
                                <h3 className={styles.cardTitle}>
                                  {selectedFile
                                    ? `Selected: ${selectedFile.name}`
                                    : uploadType === 'video'
                                    ? 'Upload Video File'
                                    : 'Upload Image File'}
                                </h3>
                                <p className={styles.cardSubtitle}>
                                  Drag & drop your {uploadType} file here or click to browse
                                </p>
                                <button type="button" onClick={(e) => { e.stopPropagation(); fileInputRef.current.click(); }} className={styles.chooseFileButton}>
                                    Choose File
                                </button>
                            </div>
                        </div>

                        <div className={styles.uploadCard} onClick={handleSrtDropZoneClick} onDragOver={handleDragOver} onDrop={handleSrtDrop}>
                            <div className={styles.cardHeader}>
                                <p>Subtitle File (Optional)</p>
                            </div>
                            <div className={styles.cardBody}>
                                <input type="file" ref={srtInputRef} onChange={handleSrtChange} className={styles.fileInput} accept=".srt" />
                                <FileIcon />
                                <h3 className={styles.cardTitle}>
                                  {srtFile ? `SRT Selected: ${srtFile.name}` : 'Upload .srt Subtitle File'}
                                </h3>
                                <p className={styles.cardSubtitle}>Optional: Upload subtitle file containing location data</p>
                                <button type="button" onClick={(e) => { e.stopPropagation(); srtInputRef.current.click(); }} className={styles.chooseFileButton}>
                                    Choose File
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className={styles.modelSelectionSection}>
                        <div className={styles.uploadCard}>
                            <div className={styles.cardHeader}>
                                <p>AI Model Selection (Required)</p>
                            </div>
                            <div className={styles.cardBody}>
                                <ModelIcon />
                                <h3 className={styles.cardTitle}>
                                  {selectedModel ? 
                                    `Selected: ${selectedModel}` : 
                                    'Choose Your Model'
                                  }
                                </h3>
                                <p className={styles.cardSubtitle}>Select the AI model file for video processing</p>
                                <div className={styles.modelSelection}>
                                  {availableModels.length === 0 ? (
                                    <div className={styles.noModels}>
                                      <p>No models available. Please contact administrator.</p>
                                    </div>
                                  ) : (
                                    <div className={styles.modelGrid}>
                                      {availableModels.map((modelInfo) => (
                                        <div 
                                          key={modelInfo.filename} 
                                          className={`${styles.modelCard} ${selectedModel === modelInfo.filename ? styles.selectedModel : ''}`}
                                          onClick={() => setSelectedModel(modelInfo.filename)}
                                        >
                                          <div className={styles.modelIcon}>
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                              <path d="M12 2L2 7v10c0 5.55 3.84 9.95 9 11 5.16-1.05 9-5.45 9-11V7l-10-5z"/>
                                              <path d="M9 12l2 2 4-4"/>
                                            </svg>
                                          </div>
                                          <h4 className={styles.modelName}>{modelInfo.name}</h4>
                                          <p className={styles.modelDescription}>
                                            {modelInfo.description}
                                            {modelInfo.supports_metrics && (
                                              <span className={styles.metricsSupport}> • Advanced Metrics</span>
                                            )}
                                          </p>
                                          {selectedModel === modelInfo.filename && (
                                            <div className={styles.selectedBadge}>✓ Selected</div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                {selectedModel && (
                                  <div className={styles.modelInfo}>
                                    {(() => {
                                      const selectedModelInfo = availableModels.find(m => m.filename === selectedModel);
                                      return (
                                        <>
                                          <p><strong>Selected Model:</strong> {selectedModelInfo?.name || selectedModel}</p>
                                          <p><strong>Use Case:</strong> {selectedModelInfo?.description || 'General purpose AI model'}</p>
                                          {selectedModelInfo?.supports_metrics && (
                                            <p><strong>Features:</strong> <span className={styles.metricsHighlight}>Advanced metrics and reporting available</span></p>
                                          )}
                                        </>
                                      );
                                    })()}
                                  </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                
               <button type="submit" className={`${styles.mainButton} ${styles.fullWidth}`} disabled={videoStatus === 'processing' || !selectedFile}>
                <PlusIcon />
                      {videoStatus === 'processing' 
                        ? `Processing... ${processingProgress.progressPercent > 0 ? `${processingProgress.progressPercent}%` : ''}`
                        : `Process ${uploadType === 'video' ? 'Video' : 'Image'}`
                      }
               </button>
              </form>
            )}
          </>
         )}
        </div>
    </div>
 );
}



