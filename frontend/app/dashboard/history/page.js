
'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './history.module.css';
import Cookies from 'js-cookie';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL;

// --- SVG Icon Components ---
const SearchIcon = () => (
    <svg className={styles.searchIcon} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);

const EmptyVideoIcon = () => (
    <svg className={styles.emptyIcon} xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15.6 11.6L22 7v10l-6.4-4.6a2 2 0 0 0-2.3.2L8 16.6a2 2 0 0 1-2.4-.4l-1-1.2a2 2 0 0 0-2.8-.2L2 16.9V7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v3.5"></path><path d="m2 12.8 2-2.5a2 2 0 0 1 2.8-.2l1.1 1.1"></path></svg>
);

const UploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
);

export default function HistoryPage() {
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const videoRefs = useRef({});

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        setIsLoading(true);
        const token = Cookies.get('auth_token');
        if (!token) {
            setError('Authentication token not found. Please log in again.');
            setIsLoading(false);
            return;
        }
        try {
            const res = await fetch(`${API}/video/history`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) {
                throw new Error('Failed to fetch video history.');
            }
            const data = await res.json();
            setHistory(data.videos || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const clearHistory = async () => {
        if (!window.confirm('Are you sure you want to clear all video history? This action cannot be undone.')) {
            return;
        }
        
        setIsLoading(true);
        const token = Cookies.get('auth_token');
        if (!token) {
            setError('Authentication token not found. Please log in again.');
            setIsLoading(false);
            return;
        }
        
        try {
            const res = await fetch(`${API}/video/history/clear`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!res.ok) {
                throw new Error('Failed to clear history.');
            }
            
            setHistory([]);
            setSearchTerm('');
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredHistory = history.filter(video =>
        video.filename.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className={styles.historyContainer}>
            <div className={styles.headerCard}>
                <div>
                    <h1>Video History</h1>
                    <p className={styles.subtitle}>Manage and view all your processed videos with geolocation data</p>
                </div>
                <div className={styles.totalVideos}>
                    <span>{history.length}</span>
                    <p>Total Videos</p>
                </div>
            </div>

                <div className={styles.controlsContainer}>
                    <div className={styles.searchBar}>
                        <SearchIcon />
                        <input
                            type="text"
                            placeholder="Search videos by filename..."
                            className={styles.searchInput}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    {history.length > 0 && (
                        <button 
                            onClick={clearHistory}
                            className={styles.clearButton}
                            disabled={isLoading}
                        >
                            <TrashIcon />
                            Clear History
                        </button>
                    )}
                </div>

                {isLoading && <p className={styles.loadingText}>Loading history...</p>}
                {error && <p className={styles.errorText}>{error}</p>}

                {!isLoading && !error && history.length === 0 && (
                    <div className={styles.emptyState}>
                        <EmptyVideoIcon />
                        <h2>No videos uploaded yet</h2>
                        <p>Upload your first video to get started with geolocation processing</p>
                        <Link href="/dashboard/upload" className={styles.uploadButton}>
                            <UploadIcon />
                            Upload First Video
                        </Link>
                    </div>
                )}

                {!isLoading && history.length > 0 && filteredHistory.length === 0 && (
                     <div className={styles.emptyState}>
                        <h2>No videos match your search</h2>
                        <p>Try searching for a different filename.</p>
                    </div>
                )}

                {!isLoading && filteredHistory.length > 0 && (
                    <div className={styles.historyGrid}>
                        {filteredHistory.map((video, idx) => (
                            <div key={`${video.filename}-${idx}`} className={styles.historyCard}>
                                <div className={styles.cardHeader}>
                                    <h3 title={video.filename.split('_').slice(1).join('_')}>
                                        {video.filename.split('_').slice(1).join('_')}
                                    </h3>
                                    <span className={styles.uploadDate}>
                                        {video.upload_date ? new Date(video.upload_date).toLocaleDateString() : 'Unknown date'}
                                    </span>
                                </div>

                                <div className={styles.videoSection}>
                                    <h4>Processed Video</h4>
                                    <video
                                        ref={el => videoRefs.current[video.filename] = el}
                                        controls
                                        preload="metadata"
                                        className={styles.videoPlayer}
                                    >
                                        <source src={`${API}${video.processed_url}`} type="video/mp4" />
                                        Your browser does not support the video tag.
                                    </video>
                                    <div className={styles.videoInfo}>
                                        <span className={styles.videoLabel}>Video Status</span>
                                        <span className={styles.videoStatus}>Processing Complete</span>
                                    </div>
                                    {video.timeline && video.timeline.length > 0 && (
                                        <div className={styles.coordinateInfo}>
                                            <span className={styles.coordinateLabel}>GPS Data Available</span>
                                            <span className={styles.coordinateCount}>{video.timeline.length} coordinate points</span>
                                        </div>
                                    )}
                                    {/* Download buttons */}
                                    {video.reports && video.reports.csv && (
                                        <a
                                            href={API + video.reports.csv}
                                            className={styles.csvDownloadButton}
                                            download
                                        >
                                            Download CSV Report
                                        </a>
                                    )}
                                    {video.reports && video.reports.pdf && (
                                        <a
                                            href={API + video.reports.pdf}
                                            className={styles.csvDownloadButton}
                                            download
                                        >
                                            Download PDF Report
                                        </a>
                                    )}
                                    {/* Shareable link */}
                                    {video.share_id && (
                                        <a
                                            href={`${API}/video/share/${video.share_id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={styles.shareLink}
                                        >
                                            🔗 Share Link
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
        </div>
    );
}