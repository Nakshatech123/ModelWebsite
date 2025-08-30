# Model Integration Guide

## Your Current Setup
The system is now configured with 3 model categories:

### 1. River & Environmental Detection Model
**File**: `backend/models/river_env_model.pt`
**Purpose**: Detects rivers, garbage in water, vegetation, bridges
**Classes**: River, Garbage, Vegetation, Bridge, Water, Trees, Pollution

### 2. Highway & Road Analysis Model  
**File**: `backend/models/highway_road_model.pt`
**Purpose**: Detects roads, cracks, highway infrastructure
**Classes**: Road, Crack, Pothole, Highway, Pavement, Lane Marking, Traffic Sign

### 3. General Object Detection Model
**File**: `backend/models/best.pt` (your existing model)
**Purpose**: General purpose object detection
**Classes**: Person, Vehicle, Building, Tree, Water, Road, Bridge

## How to Replace with Your Actual Models

### Step 1: Replace Model Files
1. Copy your trained river/environmental model and rename it to `river_env_model.pt`
2. Copy your trained highway/road model and rename it to `highway_road_model.pt`
3. Place both files in the `backend/models/` directory
4. Keep your existing `best.pt` as the general model

### Step 2: Update Detection Classes (Optional)
If your models detect different classes, update the database:

```python
# Run this in backend directory to update model info
import sqlite3

with sqlite3.connect("videos.db") as conn:
    cursor = conn.cursor()
    
    # Update river model classes
    cursor.execute("""
        UPDATE models 
        SET detection_classes = 'YourActualClasses,SeparatedByCommas' 
        WHERE model_file = 'river_env_model.pt'
    """)
    
    # Update highway model classes  
    cursor.execute("""
        UPDATE models 
        SET detection_classes = 'YourActualClasses,SeparatedByCommas'
        WHERE model_file = 'highway_road_model.pt' 
    """)
    
    conn.commit()
```

### Step 3: Test the Integration
1. Go to http://localhost:3000/dashboard/upload
2. You'll see a model selection dropdown with your 3 models
3. Choose the appropriate model based on your video content:
   - **River & Environmental**: For videos with rivers, water bodies, environmental monitoring
   - **Highway & Road Analysis**: For videos with roads, highways, infrastructure inspection
   - **General Object Detection**: For general purpose detection

### Step 4: Upload and Process
1. Select your video file
2. Choose the appropriate model
3. Optionally upload SRT file for GPS coordinates
4. Click "Upload and Process"
5. The system will use your selected model for detection

## Model File Requirements
- Must be valid YOLOv8 `.pt` files
- Trained using ultralytics YOLO framework
- Compatible with CPU inference (the system forces CPU mode)
- Recommended to test locally before uploading

## Current System Features
✅ Model selection interface in upload form
✅ Dynamic model loading based on selection
✅ Database storage of model metadata
✅ Model management page at /dashboard/models
✅ Fallback to default model if selected model fails
✅ Progress tracking during processing
✅ Error handling and user feedback

## Usage Flow
1. User selects video type (river monitoring, road inspection, general)
2. System suggests appropriate model
3. User confirms model selection
4. Video processed with selected model
5. Results displayed with model-specific detections

Your models are now fully integrated into the web application!
