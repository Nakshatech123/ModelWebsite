// // //app/components/Navbar.js
// // import { usePathname, useRouter } from 'next/navigation';
// // import Link from 'next/link';
// // import { useContext } from 'react';
// // import { AuthContext } from '../AuthProvider';

// // export default function Navbar() {
// //   const { token, logout } = useContext(AuthContext);
// //   const path = usePathname();
// //   if (!path.startsWith('/dashboard')) return null;
// //   const router = useRouter();
// //   return (
// //     <nav className="navbar">
// //       <div>
// //         <Link href="/dashboard">Home</Link>
// //         <Link href="/dashboard/about">Aboutsdfghj</Link>
// //       </div>
// //       <div>
// //         <Link href="/dashboard/upload">Upload</Link>
// //         <button onClick={() => { logout(); router.replace('/login'); }}>
// //           Logout
// //         </button>
//       </div>
// //     </nav>
// //   );
// // }





'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './Navbar.module.css'; // We'll create this CSS file

// You can reuse an icon or create a simple one
const UploadIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 12 12 7 7 12" />
    <line x1="12" y1="7" x2="12" y2="21" />
  </svg>
);

export default function Navbar() {
  const [showUploadOptions, setShowUploadOptions] = useState(false);

  return (
    <nav className={styles.navbar}>
      <div className={styles.navLeft}>
        <Link href="/" className={styles.logo}>GeoVideo</Link>
        <Link href="/dashboard" className={styles.navLink}>Dashboard</Link>
        <Link href="/about" className={styles.navLink}>About</Link>
        <Link href="/models" className={styles.navLink}>Models</Link>
        <Link href="/history" className={styles.navLink}>History</Link>
      </div>

      <div className={styles.navRight}>
        {/* This is the new upload button with dropdown */}
        <div className={styles.uploadContainer}>
          <button 
            className={styles.navLink} 
            onClick={() => setShowUploadOptions(!showUploadOptions)}
            onBlur={() => setTimeout(() => setShowUploadOptions(false), 150)} // Hide on blur
          >
            <UploadIcon />
            <span>Upload</span>
          </button>

          {showUploadOptions && (
            <div className={styles.uploadDropdown}>
              <Link 
                href="/upload?type=video" 
                className={styles.dropdownLink}
                onClick={() => setShowUploadOptions(false)}
              >
                Upload Video
              </Link>
              <Link 
                href="/upload?type=image" 
                className={styles.dropdownLink}
                onClick={() => setShowUploadOptions(false)}
              >
                Upload Image
              </Link>
            </div>
          )}
        </div>
        <div className={styles.userProfile}>
          Joey
        </div>
      </div>
    </nav>
  );
}