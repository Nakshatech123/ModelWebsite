'use client';

import React, { forwardRef } from 'react';
import styles from './upload.module.css';

const VideoPlayer = forwardRef(({ src, status, className }, ref) => {
  return (
    <div className={styles.videoContainer}>
      {status === 'processing' && (
        <div className={styles.processingOverlay}>
          <span>Processing...</span>
        </div>
      )}
      <video
        ref={ref}
        src={src}
        controls
        muted
        className={className}
        style={{ width: '100%', height: '100%', borderRadius: '8px', background: '#000' }}
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
});

VideoPlayer.displayName = 'VideoPlayer';
export default VideoPlayer;