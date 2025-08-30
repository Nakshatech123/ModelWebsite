# Video Demo Page Usage Guide

The Video Demo page (`/dashboard/video`) allows users to experience AI-powered video analysis in a demonstration environment without uploading files.

## Features

### 1. Video Selection
- **Sample Videos**: Choose from pre-configured demo videos
- **Custom Video URL**: Provide your own video URL for analysis
- **Supported Formats**: MP4, WebM, OGV (MP4 recommended)

### 2. Model Selection
- Select from available AI models
- View model capabilities and descriptions
- See which models support advanced metrics

### 3. Demo Options
- **GPS Tracking Demo**: Enable sample location data visualization
- **Real-time Map**: Shows synchronized GPS tracking with video playback

### 4. Analysis Simulation
- **Loading Screen**: Realistic processing simulation with progress bar
- **Model Integration**: Shows selected model in action
- **Results Display**: Professional video player with analysis overlay

## How to Use

1. **Choose Video Source**:
   - Click on a sample video card, OR
   - Enter a custom video URL and click "Load Video"

2. **Select AI Model**:
   - Browse available models
   - View model descriptions and capabilities
   - Models with "Advanced Metrics" support additional features

3. **Configure Options**:
   - Enable GPS tracking demo for location visualization
   - The map will show synchronized location data during playback

4. **View Results**:
   - Watch the loading simulation
   - Use the video player controls
   - If GPS is enabled, see live location tracking on the map

5. **Start New Analysis**:
   - Click "New Analysis" to return to selection screen

## Technical Details

### Video Requirements
- **URL Format**: Direct links to video files
- **CORS**: Ensure videos are accessible (some sites block embedding)
- **Size**: Reasonable file sizes for better performance

### Sample Videos
Current sample videos use publicly available test videos:
- River Monitoring Sample
- Highway Infrastructure 
- Urban Analysis

### GPS Simulation
The demo uses sample GPS coordinates:
- New York City area coordinates
- 5-second intervals
- Synchronized with video timeline

## Adding Your Own Videos

### For Sample Videos:
1. Place video files in `/frontend/public/sample-videos/`
2. Update the `SAMPLE_VIDEOS` array in the page component
3. Restart the development server

### For Custom URLs:
- Use direct video file URLs
- Ensure the hosting service allows embedding
- Test with different video formats if needed

## Integration with Real Analysis

This demo page showcases the capabilities that are available in the full upload and processing system. Users can:
- Experience the interface before uploading files
- Understand model capabilities
- See GPS tracking features
- Evaluate the system's functionality

The actual processing happens on the Upload page (`/dashboard/upload`) with real AI model inference and metrics generation.
