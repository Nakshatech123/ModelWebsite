
'use client';

import { useContext, useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './dashboard.module.css';
import { AuthContext } from '../AuthProvider';

// SVG Icons for Main Content
const VideoIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 7l-7 5 7 5V7z" /><path d="M14 5H3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z" /></svg>;
const ClockIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
const ChartIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="M18.7 8a6 6 0 0 0-6.4 0l-6.3 6.3" /><path d="M14 16h6v-6" /></svg>;
const UploadCloudIcon = () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" /><polyline points="16 16 12 12 8 16" /></svg>;
const PlayIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3" /></svg>;
const NoVideoIcon = () => <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 16v2a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10" /><line x1="1" y1="1" x2="23" y2="23" /></svg>;
const RefreshIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" /></svg>;

const DashboardPage = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    totalVideos: 0,
    processing: 0,
    totalDuration: '0s',
  });
  const [recentVideos, setRecentVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const fetchDashboardData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1];

      if (!token) {
        console.log('No auth token found');
        return;
      }

      // Fetch statistics
      const statsResponse = await fetch(`${API_URL}/video/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        console.log('Stats data received:', statsData); // Debug log
        // Map backend field names to frontend state
        setStats({
          totalVideos: statsData.total_videos,
          processing: statsData.processing,
          totalDuration: statsData.total_duration
        });
      } else {
        console.error('Failed to fetch stats:', statsResponse.status, statsResponse.statusText);
      }

      // Fetch recent videos
      const videosResponse = await fetch(`${API_URL}/video/history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (videosResponse.ok) {
        const videosData = await videosResponse.json();
        console.log('Videos data received:', videosData); // Debug log
        setRecentVideos(videosData.videos || []);
      } else {
        console.error('Failed to fetch videos:', videosResponse.status, videosResponse.statusText);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData();
      
      // Set up auto-refresh every 30 seconds to update processing status
      const interval = setInterval(() => {
        fetchDashboardData();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [user]);

  const getUserName = () => {
    if (!user || !user.email) {
      return 'User';
    }
    const namePart = user.email.split('@')[0];
    return namePart.charAt(0).toUpperCase() + namePart.slice(1);
  };

  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  return (
    <>
      {/* --- WELCOME HEADER --- */}
      <div className={styles.pageHeader}>
        <div>
          <h1>Welcome back, {getUserName()}!</h1>
          <p className={styles.subtitle}>Ready to process and visualize your video locations?</p>
        </div>
        <button 
          onClick={handleRefresh} 
          className={styles.refreshButton}
          disabled={refreshing}
          title="Refresh dashboard data"
        >
          <RefreshIcon />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* --- STATS GRID --- */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <VideoIcon />
          <div className={styles.statContent}>
            <p>{loading ? '...' : stats.totalVideos}</p>
            <h3>Total Videos</h3>
            <span>Videos processed with geolocation</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <ClockIcon />
          <div className={styles.statContent}>
            <p>{loading ? '...' : stats.processing}</p>
            <h3>Processing</h3>
            <span>Videos currently being processed</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <ChartIcon />
          <div className={styles.statContent}>
            <p>{loading ? '...' : stats.totalDuration}</p>
            <h3>Total Duration</h3>
            <span>Minutes of video content</span>
          </div>
        </div>
      </div>

      {/* --- MAIN ACTION GRID --- */}
      <div className={styles.mainGrid}>
        <div className={styles.mainCard}>
            <div className={styles.cardHeader}>
                <UploadCloudIcon />
                <h3>Upload New Video</h3>
            </div>
            <p>Upload your video files with optional .srt subtitle files to extract and visualize location data on an interactive map.</p>
            <Link href="/dashboard/upload" className={styles.primaryButton}>
                Start Upload
            </Link>
        </div>

        <div className={styles.mainCard}>
            <div className={styles.cardHeader}>
                <PlayIcon />
                <h3>Recent Videos</h3>
            </div>
            {loading ? (
              <div className={styles.loadingState}>
                <p>Loading videos...</p>
              </div>
            ) : recentVideos.length > 0 ? (
              <div className={styles.videosList}>
                {recentVideos.slice(0, 3).map((video, index) => (
                  <div key={index} className={styles.videoItem}>
                    <div className={styles.videoInfo}>
                      <span className={styles.videoName}>{video.filename}</span>
                      <small className={styles.videoStatus}>Processed</small>
                    </div>
                    <a 
                      href={`${API_URL}${video.processed_url}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={styles.videoLink}
                    >
                      View
                    </a>
                  </div>
                ))}
                {recentVideos.length > 3 && (
                  <Link href="/dashboard/history" className={styles.viewAllLink}>
                    View all {recentVideos.length} videos
                  </Link>
                )}
              </div>
            ) : (
              <div className={styles.emptyState}>
                  <NoVideoIcon />
                  <p>No videos uploaded yet</p>
                  <Link href="/dashboard/upload" className={styles.secondaryButton}>
                      Upload Your First Video
                  </Link>
              </div>
            )}
        </div>
      </div>
    </>
  );
}

 export default DashboardPage;