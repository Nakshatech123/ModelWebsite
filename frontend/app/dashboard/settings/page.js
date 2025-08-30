'use client';

import { useState, useContext } from 'react';
import { AuthContext } from '../../AuthProvider';
import styles from './settings.module.css';

// SVG Icons
const SecurityIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>;
const NotificationIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>;
const VideoIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>;
const DatabaseIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>;
const SaveIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>;
const TrashIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;

export default function SettingsPage() {
  const { user } = useContext(AuthContext);
  const [activeSection, setActiveSection] = useState('security');
  const [settings, setSettings] = useState({
    // Security Settings
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false,
    
    // Notification Settings
    emailNotifications: true,
    processingComplete: true,
    weeklyReports: false,
    systemUpdates: true,
    
    // Video Processing Settings
    defaultQuality: 'high',
    autoProcess: true,
    saveOriginal: true,
    compressionLevel: 'medium',
    outputFormat: 'mp4',
    
    // Data & Privacy
    dataRetention: '90days',
    shareAnalytics: false,
    exportData: false
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('http://localhost:8000/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${document.cookie.replace(/(?:(?:^|.*;\s*)auth_token\s*\=\s*([^;]*).*$)|^.*$/, "$1")}`
        },
        body: JSON.stringify(settings)
      });
      
      if (response.ok) {
        setSaveMessage('Settings saved successfully!');
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        setSaveMessage('Error saving settings. Please try again.');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveMessage('Error saving settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const changePassword = async () => {
    if (settings.newPassword !== settings.confirmPassword) {
      setSaveMessage('New passwords do not match.');
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${document.cookie.replace(/(?:(?:^|.*;\s*)auth_token\s*\=\s*([^;]*).*$)|^.*$/, "$1")}`
        },
        body: JSON.stringify({
          currentPassword: settings.currentPassword,
          newPassword: settings.newPassword
        })
      });
      
      if (response.ok) {
        setSaveMessage('Password changed successfully!');
        setSettings(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      } else {
        setSaveMessage('Error changing password. Please check your current password.');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setSaveMessage('Error changing password. Please try again.');
    }
  };

  const clearAllData = async () => {
    if (window.confirm('Are you sure you want to delete all your video data? This action cannot be undone.')) {
      try {
        const response = await fetch('http://localhost:8000/api/clear-user-data', {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${document.cookie.replace(/(?:(?:^|.*;\s*)auth_token\s*\=\s*([^;]*).*$)|^.*$/, "$1")}`
          }
        });
        
        if (response.ok) {
          setSaveMessage('All data cleared successfully!');
        } else {
          setSaveMessage('Error clearing data. Please try again.');
        }
      } catch (error) {
        console.error('Error clearing data:', error);
        setSaveMessage('Error clearing data. Please try again.');
      }
    }
  };

  const sections = [
    { id: 'security', label: 'Security', icon: <SecurityIcon /> },
    { id: 'notifications', label: 'Notifications', icon: <NotificationIcon /> },
    { id: 'video', label: 'Video Processing', icon: <VideoIcon /> },
    { id: 'data', label: 'Data & Privacy', icon: <DatabaseIcon /> }
  ];

  return (
    <div className={styles.settingsContainer}>
      <div className={styles.settingsHeader}>
        <h1>Settings</h1>
        <p>Manage your account preferences and application settings</p>
      </div>

      <div className={styles.settingsContent}>
        {/* Settings Navigation */}
        <div className={styles.settingsNav}>
          {sections.map(section => (
            <button
              key={section.id}
              className={`${styles.navButton} ${activeSection === section.id ? styles.active : ''}`}
              onClick={() => setActiveSection(section.id)}
            >
              {section.icon}
              {section.label}
            </button>
          ))}
        </div>

        {/* Settings Panels */}
        <div className={styles.settingsPanel}>
          {/* Security Section */}
          {activeSection === 'security' && (
            <div className={styles.section}>
              <h2>Security Settings</h2>
              
              <div className={styles.settingGroup}>
                <h3>Change Password</h3>
                <div className={styles.passwordFields}>
                  <div className={styles.fieldGroup}>
                    <label>Current Password</label>
                    <input
                      type="password"
                      value={settings.currentPassword}
                      onChange={(e) => handleSettingChange('currentPassword', e.target.value)}
                      placeholder="Enter current password"
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label>New Password</label>
                    <input
                      type="password"
                      value={settings.newPassword}
                      onChange={(e) => handleSettingChange('newPassword', e.target.value)}
                      placeholder="Enter new password"
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label>Confirm New Password</label>
                    <input
                      type="password"
                      value={settings.confirmPassword}
                      onChange={(e) => handleSettingChange('confirmPassword', e.target.value)}
                      placeholder="Confirm new password"
                    />
                  </div>
                  <button className={styles.primaryButton} onClick={changePassword}>
                    Change Password
                  </button>
                </div>
              </div>

              <div className={styles.settingGroup}>
                <h3>Two-Factor Authentication</h3>
                <div className={styles.toggleSetting}>
                  <div>
                    <p>Enable two-factor authentication for enhanced security</p>
                    <small>Receive verification codes via email when signing in</small>
                  </div>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={settings.twoFactorEnabled}
                      onChange={(e) => handleSettingChange('twoFactorEnabled', e.target.checked)}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Section */}
          {activeSection === 'notifications' && (
            <div className={styles.section}>
              <h2>Notification Preferences</h2>
              
              <div className={styles.settingGroup}>
                <div className={styles.toggleSetting}>
                  <div>
                    <p>Email Notifications</p>
                    <small>Receive notifications via email</small>
                  </div>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={settings.emailNotifications}
                      onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>

                <div className={styles.toggleSetting}>
                  <div>
                    <p>Processing Complete</p>
                    <small>Get notified when video processing is finished</small>
                  </div>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={settings.processingComplete}
                      onChange={(e) => handleSettingChange('processingComplete', e.target.checked)}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>

                <div className={styles.toggleSetting}>
                  <div>
                    <p>Weekly Reports</p>
                    <small>Receive weekly summary of your video processing activity</small>
                  </div>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={settings.weeklyReports}
                      onChange={(e) => handleSettingChange('weeklyReports', e.target.checked)}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>

                <div className={styles.toggleSetting}>
                  <div>
                    <p>System Updates</p>
                    <small>Get notified about system updates and new features</small>
                  </div>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={settings.systemUpdates}
                      onChange={(e) => handleSettingChange('systemUpdates', e.target.checked)}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Video Processing Section */}
          {activeSection === 'video' && (
            <div className={styles.section}>
              <h2>Video Processing Settings</h2>
              
              <div className={styles.settingGroup}>
                <div className={styles.fieldGroup}>
                  <label>Default Quality</label>
                  <select
                    value={settings.defaultQuality}
                    onChange={(e) => handleSettingChange('defaultQuality', e.target.value)}
                  >
                    <option value="low">Low (480p)</option>
                    <option value="medium">Medium (720p)</option>
                    <option value="high">High (1080p)</option>
                    <option value="ultra">Ultra (4K)</option>
                  </select>
                </div>

                <div className={styles.fieldGroup}>
                  <label>Output Format</label>
                  <select
                    value={settings.outputFormat}
                    onChange={(e) => handleSettingChange('outputFormat', e.target.value)}
                  >
                    <option value="mp4">MP4</option>
                    <option value="avi">AVI</option>
                    <option value="mov">MOV</option>
                    <option value="mkv">MKV</option>
                  </select>
                </div>

                <div className={styles.fieldGroup}>
                  <label>Compression Level</label>
                  <select
                    value={settings.compressionLevel}
                    onChange={(e) => handleSettingChange('compressionLevel', e.target.value)}
                  >
                    <option value="low">Low (Best Quality)</option>
                    <option value="medium">Medium (Balanced)</option>
                    <option value="high">High (Smaller Size)</option>
                  </select>
                </div>

                <div className={styles.toggleSetting}>
                  <div>
                    <p>Auto-Process Videos</p>
                    <small>Automatically start processing uploaded videos</small>
                  </div>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={settings.autoProcess}
                      onChange={(e) => handleSettingChange('autoProcess', e.target.checked)}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>

                <div className={styles.toggleSetting}>
                  <div>
                    <p>Save Original Files</p>
                    <small>Keep original uploaded files after processing</small>
                  </div>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={settings.saveOriginal}
                      onChange={(e) => handleSettingChange('saveOriginal', e.target.checked)}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Data & Privacy Section */}
          {activeSection === 'data' && (
            <div className={styles.section}>
              <h2>Data & Privacy</h2>
              
              <div className={styles.settingGroup}>
                <div className={styles.fieldGroup}>
                  <label>Data Retention Period</label>
                  <select
                    value={settings.dataRetention}
                    onChange={(e) => handleSettingChange('dataRetention', e.target.value)}
                  >
                    <option value="30days">30 Days</option>
                    <option value="90days">90 Days</option>
                    <option value="1year">1 Year</option>
                    <option value="forever">Keep Forever</option>
                  </select>
                  <small>How long to keep your processed videos and data</small>
                </div>

                <div className={styles.toggleSetting}>
                  <div>
                    <p>Share Anonymous Analytics</p>
                    <small>Help improve our service by sharing anonymous usage data</small>
                  </div>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={settings.shareAnalytics}
                      onChange={(e) => handleSettingChange('shareAnalytics', e.target.checked)}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>

                <div className={styles.dangerZone}>
                  <h3>Danger Zone</h3>
                  <div className={styles.dangerAction}>
                    <div>
                      <p>Clear All Data</p>
                      <small>Permanently delete all your videos and processing data</small>
                    </div>
                    <button className={styles.dangerButton} onClick={clearAllData}>
                      <TrashIcon />
                      Clear All Data
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className={styles.saveSection}>
            {saveMessage && (
              <div className={`${styles.message} ${saveMessage.includes('Error') ? styles.error : styles.success}`}>
                {saveMessage}
              </div>
            )}
            <button 
              className={styles.saveButton}
              onClick={saveSettings}
              disabled={isSaving}
            >
              <SaveIcon />
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
