'use client';

import Link from 'next/link';
import styles from './about.module.css';

// --- SVG Icon Components for the new page ---

// Feature Icons
const AdvancedProcessingIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-2.25-1.313M21 7.5v2.25m0-2.25l-2.25 1.313M3 7.5l2.25-1.313M3 7.5v2.25m0-2.25l2.25 1.313M9 12l2.25-1.313M9 12v2.25m0-2.25l2.25 1.313m0-2.25l2.25-1.313m0 2.25l2.25 1.313M12 21l2.25-1.313m0-2.25l-2.25 1.313m-2.25-1.313l-2.25-1.313" />
  </svg>
);
const MappingIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.5-10.5h-7a2.25 2.25 0 00-2.25 2.25v10.5a2.25 2.25 0 002.25 2.25h7.5a2.25 2.25 0 002.25-2.25v-10.5a2.25 2.25 0 00-2.25-2.25z" />
  </svg>
);
const LightningIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
  </svg>
);
const SecureIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286zm0 13.036h.008v.008h-.008v-.008z" />
    </svg>
);
const GlobeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A11.953 11.953 0 0112 16.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0021 12c0-.778.099-1.533.284-2.253" />
    </svg>
);
const AnalyticsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-3.75-.158m3.75.158L18 14.25M3.375 21h18a2.25 2.25 0 002.25-2.25V3.375A2.25 2.25 0 0021.375 1.125h-18a2.25 2.25 0 00-2.25 2.25v15.375A2.25 2.25 0 003.375 21z" />
    </svg>
);

// Workflow Icons
const StepUploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l-3.75 3.75M12 9.75l3.75 3.75M17.25 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
    </svg>
);
const StepProcessIcon = () => <LightningIcon />;
const StepVisualizeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
);


export default function AboutPage() {
  return (
    <div className={styles.container}>

      {/* Hero Section */}
      <header className={styles.hero}>
        <div className={styles.heroPreTitle}>✧ Next-Gen Video Geolocation</div>
        <h1 className={styles.heroTitle}>GeoVideo Platform</h1>
        <p className={styles.heroSubtitle}>
          Transform your videos into interactive geographical experiences. Upload any video
          with location data and watch it come to life on synchronized maps with real-time
          positioning.
        </p>
        <div className={styles.buttonContainer}>
          <Link href="/dashboard/upload" className={styles.primaryButton}>Start Processing Videos</Link>
          <Link href="/dashboard" className={styles.secondaryButton}>View Dashboard</Link>
        </div>
      </header>

      {/* Features Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Powerful Features for Video Geolocation</h2>
        <p className={styles.sectionSubtitle}>
          Everything you need to analyze and locate data from your video content
        </p>
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.iconWrapper}><AdvancedProcessingIcon /></div>
            <h3>Advanced Video Processing</h3>
            <p>Upload videos in multiple formats and let our AI-powered system extract location data from embedded subtitles and metadata.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.iconWrapper}><MappingIcon /></div>
            <h3>Real-time Geolocation Mapping</h3>
            <p>Watch your videos synchronized with interactive maps showing exact locations, with markers that move in real-time as the video plays.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.iconWrapper}><LightningIcon /></div>
            <h3>Lightning Fast Processing</h3>
            <p>Our optimized processing pipeline handles video files quickly while maintaining high quality and accuracy in location extraction.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.iconWrapper}><SecureIcon /></div>
            <h3>Secure & Private</h3>
            <p>Your videos and location data are processed securely with enterprise-grade encryption and privacy protection.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.iconWrapper}><GlobeIcon /></div>
            <h3>Global Coverage</h3>
            <p>Support for worldwide locations with detailed mapping data and satellite imagery from multiple providers.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.iconWrapper}><AnalyticsIcon /></div>
            <h3>Visual Analytics</h3>
            <p>Get insights into your video locations with beautiful visualizations and comprehensive analytics dashboards.</p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>How It Works</h2>
        <p className={styles.sectionSubtitle}>Simple, powerful, and intuitive workflow</p>
        <div className={styles.workflowSteps}>
          <div className={styles.step}>
            <div className={styles.stepIconWrapper}><span className={styles.stepNumber}>1</span><StepUploadIcon /></div>
            <h3>1. Upload</h3>
            <p>Upload your video files containing location data.</p>
          </div>
          <div className={styles.step}>
            <div className={styles.stepIconWrapper}><span className={styles.stepNumber}>2</span><StepProcessIcon /></div>
            <h3>2. Process</h3>
            <p>Our AI algorithms extract and process location data.</p>
          </div>
          <div className={styles.step}>
            <div className={styles.stepIconWrapper}><span className={styles.stepNumber}>3</span><StepVisualizeIcon /></div>
            <h3>3. Visualize</h3>
            <p>Watch your videos with synchronized real-time location tracking.</p>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className={styles.cta}>
        <h2 className={styles.ctaTitle}>Ready to Transform Your Videos?</h2>
        <p className={styles.ctaSubtitle}>
          Join thousands of users who are already using GeoVideo to create amazing
          interactive experiences from their video content.
        </p>
        <Link href="/dashboard/upload" className={styles.ctaButton}>Get Started Now</Link>
      </section>

    </div>
  );
}