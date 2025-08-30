from fastapi import FastAPI, HTTPException, Depends, status, File, UploadFile
from fastapi.staticfiles import StaticFiles # Import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import sqlite3
from fastapi.exceptions import RequestValidationError

from fastapi.responses import JSONResponse

import json
import os
from datetime import datetime

# Assuming your routers are in these files
from auth import router as auth_router
from inference import router as inference_router
from auth_utils import get_current_user

from dotenv import load_dotenv
load_dotenv()


app = FastAPI()

async def validation_handler(request, exc):
    msgs = [f"{e['loc'][-1]}: {e['msg']}" for e in exc.errors()]
    return JSONResponse(status_code=422, content={"detail": "; ".join(msgs)})

# 1. Set up CORS middleware to allow requests from your frontend
origins = [
    "http://localhost:3000",  # The origin for your Next.js app
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Or ["*"] for testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Mount the static directory to serve video files
# This makes the 'static' folder accessible to the browser at the path '/static'
app.mount("/static", StaticFiles(directory="static"), name="static")

# 3. Include your API routers
app.include_router(auth_router, prefix="/auth")
app.include_router(inference_router, prefix="/video")

# Pydantic models for new endpoints
class ProfileData(BaseModel):
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    phone: Optional[str] = None
    organization: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    timezone: Optional[str] = "UTC"

class SettingsData(BaseModel):
    # Security Settings
    twoFactorEnabled: Optional[bool] = False
    
    # Notification Settings
    emailNotifications: Optional[bool] = True
    processingComplete: Optional[bool] = True
    weeklyReports: Optional[bool] = False
    systemUpdates: Optional[bool] = True
    
    # Video Processing Settings
    defaultQuality: Optional[str] = "high"
    autoProcess: Optional[bool] = True
    saveOriginal: Optional[bool] = True
    compressionLevel: Optional[str] = "medium"
    outputFormat: Optional[str] = "mp4"
    
    # Data & Privacy
    dataRetention: Optional[str] = "90days"
    shareAnalytics: Optional[bool] = False

class PasswordChange(BaseModel):
    currentPassword: str
    newPassword: str

class ModelData(BaseModel):
    name: str
    description: str
    category: str
    detectionClasses: str = ""

# Database setup for user profiles and settings
def create_profile_tables():
    """Create tables for user profiles and settings if they don't exist"""
    with sqlite3.connect("users.db") as conn:
        # Add profile columns to users table if they don't exist
        try:
            conn.execute("""
                ALTER TABLE users ADD COLUMN profile_data TEXT DEFAULT '{}'
            """)
        except sqlite3.OperationalError:
            pass  # Column already exists
        
        try:
            conn.execute("""
                ALTER TABLE users ADD COLUMN settings_data TEXT DEFAULT '{}'
            """)
        except sqlite3.OperationalError:
            pass  # Column already exists
        
        try:
            conn.execute("""
                ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            """)
        except sqlite3.OperationalError:
            pass  # Column already exists
        
        # Create videos table if it doesn't exist
        try:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS videos (
                    email TEXT, 
                    filename TEXT,
                    timeline_data TEXT,
                    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
        except sqlite3.OperationalError:
            pass  # Table already exists
        
        # Create models table if it doesn't exist
        try:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS models (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    description TEXT,
                    category TEXT,
                    project_type TEXT,
                    detection_classes TEXT,
                    model_file TEXT,
                    created_by TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
        except sqlite3.OperationalError:
            pass  # Table already exists

def seed_default_model():
    """Add default model if no models exist"""
    with sqlite3.connect("videos.db") as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM models")
        count = cursor.fetchone()[0]
        
        if count == 0:
            cursor.execute("""
                INSERT INTO models (name, description, category, detection_classes, model_file, created_by)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                "Default Object Detection",
                "Pre-trained YOLOv8 model for detecting rivers, bridges, and other objects",
                "General Detection",
                "River, Bridge, Road, Building, Water, Vegetation",
                "best.pt",
                "system"
            ))
            conn.commit()

create_profile_tables()
seed_default_model()

# 4. Define a root endpoint for health checks
@app.get("/")
def root():
    return {"message": "Backend is running correctly"}

# User Statistics API
@app.get("/api/user-stats")
def get_user_stats(current_user: str = Depends(get_current_user)):
    """Get user statistics for the profile page"""
    try:
        print(f"Getting stats for user: {current_user}")  # Debug log
        
        # Get video count from users database (videos table)
        video_count = 0
        total_processing_time = "0h 0m"
        try:
            with sqlite3.connect("users.db") as conn:
                cursor = conn.execute(
                    "SELECT COUNT(*) FROM videos WHERE email = ?", 
                    (current_user,)
                )
                video_count = cursor.fetchone()[0]
                print(f"Video count found: {video_count}")  # Debug log
        except sqlite3.Error as e:
            print(f"Database error: {e}")  # Debug log
            pass  # videos table might not exist yet
        
        # Get account creation date
        with sqlite3.connect("users.db") as conn:
            cursor = conn.execute(
                "SELECT created_at FROM users WHERE email = ?", 
                (current_user,)
            )
            result = cursor.fetchone()
            created_at = result[0] if result and result[0] else "N/A"
        
        stats = {
            "totalVideos": video_count,
            "totalProcessingTime": total_processing_time,
            "accountCreated": created_at,
            "lastLogin": "Today"
        }
        print(f"Returning stats: {stats}")  # Debug log
        return stats
    except Exception as e:
        print(f"Error in get_user_stats: {e}")  # Debug log
        raise HTTPException(status_code=500, detail="Error fetching user statistics")

# Profile Management APIs
@app.get("/api/profile")
def get_profile(current_user: str = Depends(get_current_user)):
    """Get user profile data"""
    try:
        with sqlite3.connect("users.db") as conn:
            cursor = conn.execute(
                "SELECT profile_data FROM users WHERE email = ?", 
                (current_user,)
            )
            result = cursor.fetchone()
            
            if result and result[0]:
                return json.loads(result[0])
            else:
                return {}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error fetching profile data")

@app.put("/api/profile")
def update_profile(profile_data: ProfileData, current_user: str = Depends(get_current_user)):
    """Update user profile data"""
    try:
        with sqlite3.connect("users.db") as conn:
            conn.execute(
                "UPDATE users SET profile_data = ? WHERE email = ?",
                (json.dumps(profile_data.dict()), current_user)
            )
            conn.commit()
        
        return {"status": "success", "message": "Profile updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error updating profile")

# Settings Management APIs
@app.get("/api/settings")
def get_settings(current_user: str = Depends(get_current_user)):
    """Get user settings"""
    try:
        with sqlite3.connect("users.db") as conn:
            cursor = conn.execute(
                "SELECT settings_data FROM users WHERE email = ?", 
                (current_user,)
            )
            result = cursor.fetchone()
            
            if result and result[0]:
                return json.loads(result[0])
            else:
                # Return default settings
                return SettingsData().dict()
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error fetching settings")

@app.put("/api/settings")
def update_settings(settings_data: SettingsData, current_user: str = Depends(get_current_user)):
    """Update user settings"""
    try:
        with sqlite3.connect("users.db") as conn:
            conn.execute(
                "UPDATE users SET settings_data = ? WHERE email = ?",
                (json.dumps(settings_data.dict()), current_user)
            )
            conn.commit()
        
        return {"status": "success", "message": "Settings updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error updating settings")

# Password Change API
@app.post("/api/change-password")
def change_password(password_data: PasswordChange, current_user: str = Depends(get_current_user)):
    """Change user password"""
    try:
        from passlib.hash import bcrypt
        
        with sqlite3.connect("users.db") as conn:
            # Verify current password
            cursor = conn.execute(
                "SELECT password FROM users WHERE email = ?", 
                (current_user,)
            )
            result = cursor.fetchone()
            
            if not result or not bcrypt.verify(password_data.currentPassword, result[0]):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST, 
                    detail="Current password is incorrect"
                )
            
            # Update password
            new_hashed_password = bcrypt.hash(password_data.newPassword)
            conn.execute(
                "UPDATE users SET password = ? WHERE email = ?",
                (new_hashed_password, current_user)
            )
            conn.commit()
        
        return {"status": "success", "message": "Password changed successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error changing password")

# Clear User Data API
@app.delete("/api/clear-user-data")
def clear_user_data(current_user: str = Depends(get_current_user)):
    """Clear all user's video data"""
    try:
        # Clear from videos table in users database
        try:
            with sqlite3.connect("users.db") as conn:
                conn.execute("DELETE FROM videos WHERE email = ?", (current_user,))
                conn.commit()
        except sqlite3.Error:
            pass  # videos table might not exist
        
        # Clear uploaded files would require filesystem operations
        # This is a simplified version
        
        return {"status": "success", "message": "All user data cleared successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error clearing user data")

# Model Management APIs
@app.get("/api/models")
def get_models(current_user: str = Depends(get_current_user)):
    """Get all available models"""
    try:
        with sqlite3.connect("videos.db") as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute("""
                SELECT id, name, description, category, project_type, detection_classes, model_file, created_at 
                FROM models 
                ORDER BY created_at DESC
            """)
            models = [dict(row) for row in cursor.fetchall()]
            return models
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error fetching models")

@app.get("/api/available-models")
def get_available_models(current_user: str = Depends(get_current_user)):
    """Get all available model files from the models directory"""
    try:
        models_dir = "models"
        if not os.path.exists(models_dir):
            return []
        
        # Get all .pt files from the models directory
        model_files = []
        for file in os.listdir(models_dir):
            if file.endswith('.pt'):
                model_files.append(file)
        
        return sorted(model_files)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error fetching available model files")

@app.post("/api/models")
def add_model(model_data: ModelData, current_user: str = Depends(get_current_user)):
    """Add a new model"""
    try:
        with sqlite3.connect("videos.db") as conn:
            cursor = conn.execute("""
                INSERT INTO models (name, description, category, detection_classes, created_by)
                VALUES (?, ?, ?, ?, ?)
            """, (
                model_data.name,
                model_data.description,
                model_data.category,
                model_data.detectionClasses,
                current_user
            ))
            model_id = cursor.lastrowid
            conn.commit()
            
        return {"status": "success", "message": "Model added successfully", "id": model_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error adding model")

@app.delete("/api/models/{model_id}")
def delete_model(model_id: int, current_user: str = Depends(get_current_user)):
    """Delete a model"""
    try:
        with sqlite3.connect("videos.db") as conn:
            # Check if model exists
            cursor = conn.execute("SELECT model_file FROM models WHERE id = ?", (model_id,))
            result = cursor.fetchone()
            
            if not result:
                raise HTTPException(status_code=404, detail="Model not found")
            
            # Delete model file if it exists
            if result[0]:
                import os
                model_file_path = f"models/{result[0]}"
                if os.path.exists(model_file_path):
                    os.remove(model_file_path)
            
            # Delete from database
            conn.execute("DELETE FROM models WHERE id = ?", (model_id,))
            conn.commit()
            
        return {"status": "success", "message": "Model deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error deleting model")

@app.post("/api/models/{model_id}/upload")
def upload_model_file(model_id: int, model_file: UploadFile = File(...), current_user: str = Depends(get_current_user)):
    """Upload a model file (.pt)"""
    try:
        if not model_file.filename.endswith('.pt'):
            raise HTTPException(status_code=400, detail="Only .pt files are allowed")
        
        # Check if model exists
        with sqlite3.connect("videos.db") as conn:
            cursor = conn.execute("SELECT id FROM models WHERE id = ?", (model_id,))
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="Model not found")
        
        # Save the file
        import os
        import shutil
        os.makedirs("models", exist_ok=True)
        
        file_path = f"models/model_{model_id}_{model_file.filename}"
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(model_file.file, buffer)
        
        # Update database
        with sqlite3.connect("videos.db") as conn:
            conn.execute(
                "UPDATE models SET model_file = ? WHERE id = ?",
                (f"model_{model_id}_{model_file.filename}", model_id)
            )
            conn.commit()
        
        return {"status": "success", "message": "Model file uploaded successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error uploading model file")





