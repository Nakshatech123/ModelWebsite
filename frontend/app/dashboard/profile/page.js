'use client';

import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../../AuthProvider';
import styles from './profile.module.css';

// SVG Icons
const EditIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const SaveIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>;
const CancelIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const UserIcon = () => <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
const VideoIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="24" height="12" x="0" y="6" rx="2" ry="2"/><path d="M12 6L8 10L12 14"/></svg>;
const CalendarIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>;

export default function ProfilePage() {
  const { user } = useContext(AuthContext);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    organization: '',
    bio: '',
    location: '',
    timezone: 'UTC'
  });
  const [stats, setStats] = useState({
    totalVideos: 0,
    totalProcessingTime: '0h 0m',
    accountCreated: null,
    lastLogin: null
  });

  // Get user name from email
  const getUserName = () => {
    if (!user || !user.email) return 'User';
    const namePart = user.email.split('@')[0];
    return namePart.charAt(0).toUpperCase() + namePart.slice(1);
  };

  const getUserEmail = () => {
    return user?.email || 'user@example.com';
  };

  const fetchUserStats = async () => {
    try {
      const token = document.cookie.replace(/(?:(?:^|.*;\s*)auth_token\s*\=\s*([^;]*).*$)|^.*$/, "$1");
      console.log('Token for stats API:', token);
      
      const response = await fetch('http://localhost:8000/api/user-stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Stats API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Stats API response data:', data);
        setStats(data);
      } else {
        console.error('Stats API error:', response.status, await response.text());
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const fetchProfileData = async () => {
    try {
      const token = document.cookie.replace(/(?:(?:^|.*;\s*)auth_token\s*\=\s*([^;]*).*$)|^.*$/, "$1");
      console.log('Token for profile API:', token);
      
      const response = await fetch('http://localhost:8000/api/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Profile API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Profile API response data:', data);
        setProfileData(prev => ({
          ...prev,
          ...data
        }));
      } else {
        console.error('Profile API error:', response.status, await response.text());
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
    }
  };

  // Fetch user stats and profile data on component mount
  useEffect(() => {
    fetchUserStats();
    fetchProfileData();
  }, []);

  const handleSaveProfile = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${document.cookie.replace(/(?:(?:^|.*;\s*)auth_token\s*\=\s*([^;]*).*$)|^.*$/, "$1")}`
        },
        body: JSON.stringify(profileData)
      });
      
      if (response.ok) {
        setIsEditing(false);
        // Show success message
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className={styles.profileContainer}>
      <div className={styles.profileHeader}>
        <h1>User Profile</h1>
        <p>Manage your account information and preferences</p>
      </div>

      <div className={styles.profileContent}>
        {/* Profile Info Card */}
        <div className={styles.profileCard}>
          <div className={styles.profileCardHeader}>
            <div className={styles.avatarSection}>
              <div className={styles.avatar}>
                <UserIcon />
              </div>
              <div className={styles.userInfo}>
                <h2>{getUserName()}</h2>
                <p>{getUserEmail()}</p>
              </div>
            </div>
            <button 
              className={styles.editButton}
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? <CancelIcon /> : <EditIcon />}
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          <div className={styles.profileFields}>
            <div className={styles.fieldRow}>
              <div className={styles.fieldGroup}>
                <label>First Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder="Enter your first name"
                  />
                ) : (
                  <p>{profileData.firstName || 'Not provided'}</p>
                )}
              </div>
              <div className={styles.fieldGroup}>
                <label>Last Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder="Enter your last name"
                  />
                ) : (
                  <p>{profileData.lastName || 'Not provided'}</p>
                )}
              </div>
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.fieldGroup}>
                <label>Phone Number</label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="Enter your phone number"
                  />
                ) : (
                  <p>{profileData.phone || 'Not provided'}</p>
                )}
              </div>
              <div className={styles.fieldGroup}>
                <label>Organization</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileData.organization}
                    onChange={(e) => handleInputChange('organization', e.target.value)}
                    placeholder="Enter your organization"
                  />
                ) : (
                  <p>{profileData.organization || 'Not provided'}</p>
                )}
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label>Location</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Enter your location"
                />
              ) : (
                <p>{profileData.location || 'Not provided'}</p>
              )}
            </div>

            <div className={styles.fieldGroup}>
              <label>Bio</label>
              {isEditing ? (
                <textarea
                  value={profileData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Tell us about yourself"
                  rows="3"
                />
              ) : (
                <p>{profileData.bio || 'No bio provided'}</p>
              )}
            </div>

            <div className={styles.fieldGroup}>
              <label>Timezone</label>
              {isEditing ? (
                <select
                  value={profileData.timezone}
                  onChange={(e) => handleInputChange('timezone', e.target.value)}
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="Europe/London">GMT</option>
                  <option value="Europe/Paris">Central European Time</option>
                  <option value="Asia/Tokyo">Japan Time</option>
                  <option value="Asia/Kolkata">India Time</option>
                </select>
              ) : (
                <p>{profileData.timezone}</p>
              )}
            </div>

            {isEditing && (
              <div className={styles.saveActions}>
                <button 
                  className={styles.saveButton}
                  onClick={handleSaveProfile}
                >
                  <SaveIcon />
                  Save Changes
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Account Statistics */}
        <div className={styles.statsCard}>
          <h3>Account Statistics</h3>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <VideoIcon />
              <div>
                <span className={styles.statNumber}>{stats.totalVideos}</span>
                <span className={styles.statLabel}>Videos Processed</span>
              </div>
            </div>
            <div className={styles.statItem}>
              <CalendarIcon />
              <div>
                <span className={styles.statNumber}>{stats.totalProcessingTime}</span>
                <span className={styles.statLabel}>Total Processing Time</span>
              </div>
            </div>
            <div className={styles.statItem}>
              <CalendarIcon />
              <div>
                <span className={styles.statNumber}>{stats.accountCreated || 'N/A'}</span>
                <span className={styles.statLabel}>Member Since</span>
              </div>
            </div>
            <div className={styles.statItem}>
              <CalendarIcon />
              <div>
                <span className={styles.statNumber}>{stats.lastLogin || 'N/A'}</span>
                <span className={styles.statLabel}>Last Login</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
