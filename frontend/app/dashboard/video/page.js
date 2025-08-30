'use client';

import { useState, useRef, useEffect } from 'react';
import styles from '../upload/upload.module.css'; // Reusing upload styles
import VideoPlayer from '../upload/VideoPlayer';
import GeoServerMap from '../upload/GeoServerMap';
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

const ModelIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.cardIcon}>
    <path d="M12 2L2 7v10c0 5.55 3.84 9.95 9 11 5.16-1.05 9-5.45 9-11V7l-10-5z" stroke="#4a5568" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 12l2 2 4-4" stroke="#4a5568" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Sample video URLs - you can replace these with your actual video URLs
const SAMPLE_VIDEOS = [
  { 
    id: 1, 
    name: "River Monitoring Sample", 
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    description: "Sample video showing river and infrastructure monitoring"
  },
  { 
    id: 2, 
    name: "Highway Infrastructure", 
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    description: "Highway and road infrastructure detection sample"
  },
  { 
    id: 3, 
    name: "Urban Analysis", 
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    description: "Urban infrastructure analysis demonstration"
  }
];

// Sample SRT data for demonstration
const SAMPLE_SRT_DATA = [
  { start: 0, end: 5, lat: 40.7128, lon: -74.0060 },
  { start: 5, end: 10, lat: 40.7130, lon: -74.0062 },
  { start: 10, end: 15, lat: 40.7132, lon: -74.0064 },
  { start: 15, end: 20, lat: 40.7134, lon: -74.0066 },
  { start: 20, end: 25, lat: 40.7136, lon: -74.0068 }
];

export default function VideoPage() {
  const [availableModels, setAvailableModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoStatus, setVideoStatus] = useState('idle'); // idle, loading, ready
  const [showSrt, setShowSrt] = useState(false);
  const [srtData, setSrtData] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [error, setError] = useState('');
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchAvailableModels();
  }, []);

  const fetchAvailableModels = async () => {
    try {
      const token = Cookies.get('auth_token');
      const response = await fetch(`${API}/video/models`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAvailableModels(data.models || []);
        if (data.models && data.models.length > 0) {
          setSelectedModel(data.models[0].filename);
        }
      } else {
        console.error('Available models API error:', response.status);
      }
    } catch (error) {
      console.error('Error fetching available models:', error);
    }
  };

  const handleVideoSelect = (video) => {
    setSelectedVideo(video);
    setSelectedFile(null);
    setVideoStatus('loading');
    setError('');
    
    // Simulate loading progress
    let progress = 0;
    const loadingInterval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(loadingInterval);
        setTimeout(() => {
          setVideoUrl(video.url);
          setVideoStatus('ready');
          setLoadingProgress(0);
        }, 500);
      }
      setLoadingProgress(progress);
    }, 200);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      setError('Please select a valid video file');
      return;
    }

    setSelectedFile(file);
    setSelectedVideo(null);
    setVideoStatus('loading');
    setError('');
    
    // Create URL for the selected file
    const fileUrl = URL.createObjectURL(file);
    
    // Simulate loading progress
    let progress = 0;
    const loadingInterval = setInterval(() => {
      progress += Math.random() * 20;
      if (progress >= 100) {
        progress = 100;
        clearInterval(loadingInterval);
        setTimeout(() => {
          setVideoUrl(fileUrl);
          setVideoStatus('ready');
          setLoadingProgress(0);
        }, 500);
      }
      setLoadingProgress(progress);
    }, 150);
  };

  const handleSrtToggle = () => {
    setShowSrt(!showSrt);
    if (!showSrt) {
      setSrtData(SAMPLE_SRT_DATA);
    } else {
      setSrtData([]);
    }
  };

  const handleLocationUpdate = (location) => {
    setCurrentLocation(location);
  };

  const getLocationName = async (lat, lon) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'GeoVideo-LocationApp/1.0'
          }
        }
      );
      const data = await response.json();
      return data.display_name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    } catch (error) {
      return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.breadcrumb}>
            <Link href="/dashboard">Dashboard</Link> / Video Analysis Demo
          </div>
          <h1>Video Analysis Demo</h1>
          <p className={styles.subtitle}>
            Select a model and sample video to see AI-powered analysis in action
          </p>
        </div>

        {videoStatus === 'idle' && (
          <div className={styles.uploadForm}>
            <div className={styles.uploadLayout}>
              {/* Video Selection */}
              <div className={styles.uploadCard}>
                <div className={styles.cardHeader}>
                  <VideoIcon />
                  <h3>Choose Sample Video</h3>
                  <p>Select from our demo videos</p>
                </div>
                <div className={styles.cardContent}>
                  <div className={styles.videoGrid}>
                    {SAMPLE_VIDEOS.map((video) => (
                      <div 
                        key={video.id}
                        className={`${styles.videoCard} ${selectedVideo?.id === video.id ? styles.selectedVideo : ''}`}
                        onClick={() => handleVideoSelect(video)}
                      >
                        <div className={styles.videoIcon}>
                          <VideoIcon />
                        </div>
                        <h4>{video.name}</h4>
                        <p>{video.description}</p>
                        {selectedVideo?.id === video.id && (
                          <div className={styles.selectedBadge}>✓ Selected</div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* File Upload Section */}
                  <div className={styles.customVideoSection}>
                    <h4 className={styles.sectionTitle}>Or upload your own video file:</h4>
                    <div className={styles.fileUploadArea}>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleFileSelect}
                        ref={fileInputRef}
                        className={styles.fileInput}
                        id="video-upload"
                      />
                      <label htmlFor="video-upload" className={styles.fileUploadLabel}>
                        <div className={styles.uploadIcon}>
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="#4a5568" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <polyline points="17 8 12 3 7 8" stroke="#4a5568" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <line x1="12" y1="3" x2="12" y2="15" stroke="#4a5568" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <span className={styles.uploadText}>
                          {selectedFile ? selectedFile.name : 'Click to select video file or drag and drop'}
                        </span>
                        <span className={styles.uploadSubtext}>
                          Supports MP4, AVI, MOV, and other video formats
                        </span>
                      </label>
                    </div>
                    {selectedFile && (
                      <div className={styles.customVideoInfo}>
                        <p>✓ File selected: {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Model Selection */}
              <div className={styles.uploadCard}>
                <div className={styles.cardHeader}>
                  <ModelIcon />
                  <h3>AI Model Selection</h3>
                  <p>Choose the AI model for analysis</p>
                </div>
                <div className={styles.cardContent}>
                  <div className={styles.modelSelectionSection}>
                    {availableModels.length === 0 ? (
                      <div className={styles.noModels}>
                        <p>Loading models...</p>
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

            {/* Options Section */}
            <div className={styles.optionsSection}>
              <div className={styles.uploadCard}>
                <div className={styles.cardHeader}>
                  <FileIcon />
                  <h3>Demo Options</h3>
                  <p>Configure demonstration settings</p>
                </div>
                <div className={styles.cardContent}>
                  <div className={styles.checkboxGroup}>
                    <label className={styles.checkboxLabel}>
                      <input 
                        type="checkbox" 
                        checked={showSrt}
                        onChange={handleSrtToggle}
                        className={styles.checkbox}
                      />
                      <span className={styles.checkboxText}>
                        Enable GPS Tracking Demo (Show sample location data on map)
                      </span>
                    </label>
                  </div>
                  
                  {error && (
                    <div className={styles.error}>
                      <p>{error}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading Screen */}
        {videoStatus === 'loading' && (
          <div className={styles.loadingContainer}>
            <div className={styles.loadingCard}>
              <div className={styles.loadingSpinner}></div>
              <h3>Preparing Video Analysis</h3>
              <p>Loading {selectedVideo?.name || selectedFile?.name} with {selectedModel} model...</p>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill} 
                  style={{ width: `${loadingProgress}%` }}
                ></div>
              </div>
              <p className={styles.progressText}>{Math.round(loadingProgress)}% Complete</p>
            </div>
          </div>
        )}

        {/* Results */}
        {videoStatus === 'ready' && videoUrl && (
          <div className={styles.resultsContainer}>
            <div className={styles.header}>
              <h2>Video Analysis Results</h2>
              <p className={styles.subtitle}>
                Viewing: {selectedVideo?.name || selectedFile?.name} | Model: {selectedModel}
              </p>
              <button 
                className={styles.newAnalysisBtn}
                onClick={() => {
                  setVideoStatus('idle');
                  setVideoUrl('');
                  setSelectedVideo(null);
                  setSelectedFile(null);
                  setSrtData([]);
                  setShowSrt(false);
                  setError('');
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
              >
                <PlusIcon />
                New Analysis
              </button>
            </div>
            
            <div className={styles.resultsGrid}>
              <div className={styles.resultsCard}>
                <h3>Processed Video</h3>
                <VideoPlayer 
                  ref={videoRef}
                  src={videoUrl} 
                  status="done"
                  className={styles.videoPlayer}
                />
                <div className={styles.videoControls}>
                  <p><strong>Model Used:</strong> {selectedModel}</p>
                  <p><strong>Status:</strong> Analysis Complete</p>
                  {currentLocation && (
                    <p><strong>Current Location:</strong> {currentLocation}</p>
                  )}
                </div>
              </div>
              <div className={styles.resultsCard}>
                <h3>GPS Tracking</h3>
                <GeoServerMap 
                  srtData={srtData}
                  videoRef={videoRef}
                  onLocationUpdate={handleLocationUpdate}
                  getLocationName={getLocationName}
                />
                <div className={styles.locationInfo}>
                  <p><strong>GPS Points:</strong> {srtData.length}</p>
                  <p><strong>Tracking:</strong> Live location sync</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}