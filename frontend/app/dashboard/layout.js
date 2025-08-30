'use client';

import { useContext, useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import styles from './dashboard.module.css';
import { AuthContext } from '../AuthProvider';
import Cookies from 'js-cookie';

// SVG Icons for Navigation
const GeoVideoLogo = () => (
    <div className={styles.logoContainer}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="24" height="24" rx="6" fill="#06b6d4"/>
            <path d="M16.5 12L9 16.3301V7.66987L16.5 12Z" fill="white"/>
        </svg>
        <h4>GeoVideo</h4>
    </div>
);
const DashboardIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>;
const AboutIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>;
const PricingIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20.59 13.41 11 3H4v7l9.59 9.59a2 2 0 0 0 2.82 0l4.18-4.18a2 2 0 0 0 0-2.82Z" />
    <path d="M6 6h.01" />
  </svg>
);
const VideoIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>;
const UploadIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>;
const HistoryIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 4v6h6"></path><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>;
const UserIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
const ProfileIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
const SettingsIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;
const LogoutIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>;
const ChevronDownIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>;


export default function DashboardLayout({ children }) {
  const { user } = useContext(AuthContext);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const getUserName = () => {
    if (!user || !user.email) return 'User';
    const namePart = user.email.split('@')[0];
    return namePart.charAt(0).toUpperCase() + namePart.slice(1);
  };

  const getUserEmail = () => {
    return user?.email || 'user@example.com';
  };

  const handleLogout = () => {
    Cookies.remove('auth_token');
    window.location.href = '/login';
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={styles.dashboardContainer}>
      {/* Top Navigation Bar */}
      <nav className={styles.topNavbar}>
        <div className={styles.navLeft}>
          <GeoVideoLogo />
        </div>
        
        <div className={styles.navCenter}>
          <Link href="/dashboard" className={styles.navLink}><DashboardIcon /> Dashboard</Link>
           <Link href="/dashboard/about" className={styles.navLink}><AboutIcon /> About</Link>
          <Link href="/dashboard/pricing" className={styles.navLink}><PricingIcon  /> Pricing</Link>
          {/* //<Link href="/dashboard/video" className={styles.navLink}><VideoIcon /> Video Demo</Link> */}
          <Link href="/dashboard/upload" className={styles.navLink}><UploadIcon /> Upload Video</Link>
          <Link href="/dashboard/history" className={styles.navLink}><HistoryIcon /> History</Link>
         
        </div>
        
        <div className={styles.navRight}>
          <div className={styles.userDropdown} ref={dropdownRef}>
            <button 
              className={styles.userProfileButton}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <UserIcon />
              <span className={styles.userName}>{getUserName()}</span>
              <ChevronDownIcon />
            </button>
            
            {isDropdownOpen && (
              <div className={styles.dropdownMenu}>
                <div className={styles.dropdownHeader}>
                  <div className={styles.userAvatar}>
                    <UserIcon />
                  </div>
                  <div className={styles.userDetails}>
                    <div className={styles.userDisplayName}>{getUserName()}</div>
                    <div className={styles.userEmailAddress}>{getUserEmail()}</div>
                  </div>
                </div>
                
                <div className={styles.dropdownDivider}></div>
                
                <div className={styles.dropdownSection}>
                  <Link href="/dashboard/profile" className={styles.dropdownItem}>
                    <ProfileIcon />
                    <span>View Profile</span>
                  </Link>
                  <Link href="/dashboard/settings" className={styles.dropdownItem}>
                    <SettingsIcon />
                    <span>Settings</span>
                  </Link>
                </div>
                
                <div className={styles.dropdownDivider}></div>
                
                <button 
                  className={`${styles.dropdownItem} ${styles.logoutDropdownItem}`}
                  onClick={handleLogout}
                >
                  <LogoutIcon />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
      
      {/* Main Content */}
      <main className={styles.content}>
        {children}
      </main>
    </div>
  );
}