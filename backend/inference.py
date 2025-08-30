


import os
import re
from metrics_inference import run_yolo9_metrics

# Set environment variables to ensure CPU compatibility for torchvision operations
os.environ['FORCE_TORCHVISION_CPU'] = '1'
os.environ['CUDA_LAUNCH_BLOCKING'] = '1'

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, BackgroundTasks, Form
from fastapi.responses import FileResponse
from auth_utils import get_current_user 
import threading
import uuid
import shutil
import sqlite3
import cv2
import numpy as np
from ultralytics import YOLO
import pysrt
import subprocess
from typing import Optional
import pandas as pd
from shapely.geometry import Polygon, Point
from shapely.ops import nearest_points, unary_union
from metrics_inference import run_yolo9_metrics

import json
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image as RLImage
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
try:
    import torch
    # Force CPU operations for torchvision NMS to avoid CUDA compatibility issues
    if hasattr(torch, 'ops') and hasattr(torch.ops, 'torchvision'):
        # Override torchvision operations to use CPU backend
        torch.backends.cudnn.enabled = False
    print(f"PyTorch version: {torch.__version__ if torch else 'Not available'}")
except ImportError:
    torch = None  # Graceful fallback if torch is not available
    print("PyTorch not available - using CPU-only mode")
import matplotlib.pyplot as plt
import io
import base64
import requests
import time
import asyncio

import mimetypes
# ...existing imports...

def is_video(filename):
    mime, _ = mimetypes.guess_type(filename)
    return mime and mime.startswith('video/')

def is_image(filename):
    mime, _ = mimetypes.guess_type(filename)
    return mime and mime.startswith('image/')
router = APIRouter()

async def get_location_name(lat, lon):
    """Get location name from coordinates using reverse geocoding."""
    try:
        url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}&zoom=18&addressdetails=1"
        headers = {'User-Agent': 'GeoVideo-LocationApp/1.0'}
        
        # Add a small delay to respect rate limits
        time.sleep(0.1)
        
        response = requests.get(url, headers=headers, timeout=5)
        if response.status_code == 200:
            data = response.json()
            return data.get('display_name', f"{lat:.4f}, {lon:.4f}")
        else:
            return f"{lat:.4f}, {lon:.4f}"
    except Exception as e:
        print(f"Error getting location name: {e}")
        return f"{lat:.4f}, {lon:.4f}"

# --- Configuration ---
UPLOAD_DIR = "static/uploads"
PROCESSED_DIR = "static/processed"
REPORTS_DIR = "static/reports"
DB_PATH = "users.db"

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(PROCESSED_DIR, exist_ok=True)
os.makedirs(REPORTS_DIR, exist_ok=True)

# Force model to use CPU to avoid CUDA compatibility issues
model = YOLO("models/best.pt")
model.to('cpu')  # Explicitly set to CPU mode

MASK_CLASSES = {
    3: (0, 0, 255), 4: (0, 255, 0), 8: (255, 0, 0),
}

# Configuration for Yolo9.pt model metrics
YOLO9_CLASSES = {
    'Building': (139, 0, 0),
    'bridge': (0, 165, 255), 
    'Natural-drinage': (255, 255, 255),
    'Manmade-drinage': (255, 204, 229),
    'vegitation inside the river': (144, 238, 255),
    'silts': (229, 150, 255),
    'obstacles': (1, 236, 204),
    'cultverts': (255, 51, 153),
    'potholes': (68, 242, 0),
    'Garbage': (255, 180, 0),
    'rocks': (0, 255, 255),
    'river': (255, 0, 0)
}

# Default GSD (Ground Sample Distance) - meters per pixel
DEFAULT_GSD = 0.05  # 5cm per pixel (can be made configurable)
DRONE_SPEED_M_S = 2  # Default drone speed in m/s
BUFFER_DISTANCE_M = 30  # Buffer distance around river in meters

def sanitize_filename(filename: str) -> str:
    """Sanitizes a filename to be URL-safe."""
    filename = re.sub(r'[\\/*?:"<>|]', "", filename)
    filename = re.sub(r'\s+', '_', filename)
    return filename

def mask_to_polygon(mask):
    """Convert mask to Shapely polygon."""
    try:
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not contours:
            return None
        largest = max(contours, key=cv2.contourArea)
        if largest.shape[0] < 3:
            return None
        return Polygon(largest.squeeze())
    except:
        return None

def calculate_metrics_for_yolo9(result, frame, frame_idx, fps, gsd=DEFAULT_GSD):
    """Calculate detailed metrics for Yolo9.pt model."""
    metrics = {
        'frame': frame_idx,
        'time_s': round(frame_idx / fps, 3),
        'distance_from_start_m': round((frame_idx / fps) * DRONE_SPEED_M_S, 2),
        'detections': []
    }
    
    if result.masks is None or result.boxes is None:
        return metrics, frame
    
    # Get detection data
    if hasattr(result.boxes, 'id') and result.boxes.id is not None:
        ids = result.boxes.id.cpu().numpy().astype(int)
    else:
        ids = list(range(len(result.boxes.cls)))
    
    cls_ids = result.boxes.cls.cpu().numpy().astype(int)
    boxes = result.boxes.xyxy.cpu().numpy()
    masks = result.masks.data.cpu().numpy()
    confidences = result.boxes.conf.cpu().numpy()
    
    H, W = frame.shape[:2]
    
    # Create overlays for visualization
    overlay = frame.copy()
    mask_overlay = np.zeros_like(frame)
    
    # Find river polygons first for distance calculations
    river_polygons = []
    for i, cls_id in enumerate(cls_ids):
        cls_name = result.names.get(cls_id, f"class_{cls_id}")
        if cls_name == 'river':
            mask = masks[i].astype(np.uint8)
            full_mask = cv2.resize(mask, (W, H), interpolation=cv2.INTER_NEAREST)
            poly = mask_to_polygon(full_mask)
            if poly:
                river_polygons.append(poly)
    
    # Create buffer zone around rivers
    buffer_zone = None
    if river_polygons:
        buffer_dist_px = BUFFER_DISTANCE_M / gsd
        buffer_zone = unary_union([r.buffer(buffer_dist_px) for r in river_polygons])
        
        # Draw buffer zone
        if hasattr(buffer_zone, 'geoms'):
            polys = buffer_zone.geoms
        else:
            polys = [buffer_zone]
            
        for poly in polys:
            if hasattr(poly, 'exterior'):
                coords = np.array(poly.exterior.coords).round().astype(np.int32)
                cv2.polylines(overlay, [coords], isClosed=True, color=(0, 255, 255), thickness=2)
    
    # Process each detection
    for i, obj_id in enumerate(ids):
        cls_name = result.names.get(cls_ids[i], f"class_{cls_ids[i]}")
        x1, y1, x2, y2 = boxes[i].astype(int)
        w, h = x2 - x1, y2 - y1
        confidence = confidences[i]

        # Calculate mask area
        mask = masks[i].astype(np.uint8)
        full_mask = cv2.resize(mask, (W, H), interpolation=cv2.INTER_NEAREST)
        mask_area_px = np.count_nonzero(full_mask)
        area_m2 = round(mask_area_px * (gsd ** 2), 2)

        # Calculate center point and polygon
        obj_center = Point((x1 + x2) // 2, (y1 + y2) // 2)
        obj_poly = mask_to_polygon(full_mask)

        # Check if object is in buffer zone
        inside_buffer = True
        if buffer_zone:
            inside_buffer = (
                (obj_poly and buffer_zone.intersects(obj_poly)) or
                (not obj_poly and buffer_zone.contains(obj_center))
            )

        # Calculate distance from riverbank
        dist_from_riverbank_m = None
        if river_polygons and cls_name not in ['river', 'vegitation inside the river']:
            if obj_poly:
                min_poly = min(river_polygons, key=lambda r: obj_poly.distance(r))
                p1, p2 = nearest_points(obj_poly, min_poly)
            else:
                min_poly = min(river_polygons, key=lambda r: r.distance(obj_center))
                p1, p2 = nearest_points(obj_center, min_poly)

            dist_px = p1.distance(p2)
            dist_from_riverbank_m = round(dist_px * gsd, 2)

            # Draw distance line if close enough
            if dist_from_riverbank_m < 30:
                cv2.line(overlay, (int(p1.x), int(p1.y)), (int(p2.x), int(p2.y)), (0, 255, 255), 2)
                mid = ((int(p1.x + p2.x) // 2), (int(p1.y + p2.y) // 2))
                cv2.putText(overlay, f"{dist_from_riverbank_m}m", mid, cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 2)

        # Calculate specific metrics based on class
        bridge_length_m = None
        if cls_name == 'bridge':
            bridge_length_m = round(max(w, h) * gsd, 2)

        # Store detection data
        detection = {
            'id': obj_id,
            'class': cls_name,
            'confidence': round(confidence, 3),
            'bbox': [x1, y1, x2, y2],
            'area_m2': area_m2,
            'bridge_length_m': bridge_length_m,
            'dist_from_riverbank_m': dist_from_riverbank_m,
            'inside_buffer': inside_buffer
        }
        metrics['detections'].append(detection)

        color = YOLO9_CLASSES.get(cls_name, (255, 255, 255))


        # Draw filled mask for river, Natural-drinage, Manmade-drinage only
        if cls_name in ['river', 'Natural-drinage', 'Manmade-drinage']:
            contours, _ = cv2.findContours(full_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            cv2.drawContours(mask_overlay, contours, -1, color, thickness=cv2.FILLED)

            # Draw metric text (area for drainages, length for bridge if ever masked)
            metric_text = ""
            if cls_name == 'bridge' and bridge_length_m:
                metric_text = f"{bridge_length_m}m"
            elif area_m2 > 0 and cls_name in ['Natural-drinage', 'Manmade-drinage']:
                metric_text = f"{area_m2}m²"

            if metric_text:
                # Place text at the centroid of the mask
                M = cv2.moments(full_mask)
                if M["m00"] != 0:
                    cX = int(M["m10"] / M["m00"])
                    cY = int(M["m01"] / M["m00"])
                else:
                    cX, cY = x1 + (x2 - x1) // 2, y1 + (y2 - y1) // 2
                (metric_w, metric_h), _ = cv2.getTextSize(metric_text, cv2.FONT_HERSHEY_SIMPLEX, 1.0, 3)
                cv2.rectangle(overlay,
                              (cX - metric_w//2 - 5, cY - metric_h//2 - 5),
                              (cX + metric_w//2 + 5, cY + metric_h//2 + 5),
                              (0, 0, 0), -1)
                cv2.rectangle(overlay,
                              (cX - metric_w//2 - 5, cY - metric_h//2 - 5),
                              (cX + metric_w//2 + 5, cY + metric_h//2 + 5),
                              color, 2)
                cv2.putText(overlay, metric_text,
                            (cX - metric_w//2, cY + metric_h//2),
                            cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 255, 255), 3)
            # Do NOT draw bounding box for these classes
            continue

        # For all other classes, draw bounding box only
        cv2.rectangle(overlay, (x1, y1), (x2, y2), color, 2)

        # Calculate center point for metric display
        center_x = (x1 + x2) // 2
        center_y = (y1 + y2) // 2

        # Display metrics inside bounding box
        metric_text = ""
        if bridge_length_m:
            metric_text = f"{bridge_length_m}m"
        elif area_m2 > 0 and cls_name in ['silts', 'vegitation inside the river']:
            metric_text = f"{area_m2}m²"
        elif dist_from_riverbank_m and cls_name == 'Building':
            metric_text = f"d:{dist_from_riverbank_m}m"
        elif cls_name == 'potholes' and area_m2 > 0:
            metric_text = f"{area_m2}m²"

        # Draw metric text in center of bounding box with background
        if metric_text:
            (metric_w, metric_h), _ = cv2.getTextSize(metric_text, cv2.FONT_HERSHEY_SIMPLEX, 1.0, 3)
            # Create background rectangle for better visibility
            cv2.rectangle(overlay, 
                         (center_x - metric_w//2 - 5, center_y - metric_h//2 - 5), 
                         (center_x + metric_w//2 + 5, center_y + metric_h//2 + 5), 
                         (0, 0, 0), -1)
            cv2.rectangle(overlay, 
                         (center_x - metric_w//2 - 5, center_y - metric_h//2 - 5), 
                         (center_x + metric_w//2 + 5, center_y + metric_h//2 + 5), 
                         color, 2)
            # Draw the metric text in white
            cv2.putText(overlay, metric_text, 
                       (center_x - metric_w//2, center_y + metric_h//2), 
                       cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 255, 255), 3)

        # Create label for top of bounding box (simplified)
        label_parts = [f"ID:{obj_id}", cls_name, f"{confidence:.2f}"]
        label = " | ".join(label_parts)

        # Draw label with background
        (text_w, text_h), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)
        cv2.rectangle(overlay, (x1, y1-text_h-10), (x1+text_w, y1), color, -1)
        cv2.putText(overlay, label, (x1, y1-5), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 2)
    
    # Combine overlays
    final_frame = cv2.addWeighted(mask_overlay, 0.4, overlay, 1.0, 0)
    
    # Add frame info and summary
    summary_counts = {}
    for det in metrics['detections']:
        cls = det['class']
        summary_counts[cls] = summary_counts.get(cls, 0) + 1
    
    # Draw frame info
    frame_info = f"Frame: {frame_idx} | Time: {metrics['time_s']}s | Distance: {metrics['distance_from_start_m']}m"
    cv2.rectangle(final_frame, (0, 0), (W, 30), (0, 0, 0), -1)
    cv2.putText(final_frame, frame_info, (10, 20), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
    
    # Draw summary counts
    if summary_counts:
        summary_text = " | ".join([f"{k}: {v}" for k, v in summary_counts.items()])
        cv2.rectangle(final_frame, (0, H-60), (W, H), (0, 0, 128), -1)
        cv2.putText(final_frame, summary_text, (10, H-35), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
    
    return metrics, final_frame

def calculate_metrics_for_yolo9_fast(result, frame, frame_idx, fps, scale_factor=1.0):
    """Calculate metrics and annotate frame for YOLO9 model."""
    H, W = frame.shape[:2]

    metrics = {
        'frame': frame_idx,
        'time_s': round(frame_idx / fps, 3),
        'distance_from_start_m': round((frame_idx / fps) * DRONE_SPEED_M_S, 2),
        'detections': []
    }

    if result.masks is None or result.boxes is None:
        return metrics, frame

    # Get detections
    cls_ids = result.boxes.cls.cpu().numpy().astype(int)
    ids = (
        result.boxes.id.cpu().numpy().astype(int)
        if hasattr(result.boxes, "id") and result.boxes.id is not None
        else list(range(len(cls_ids)))
    )
    boxes = result.boxes.xyxy.cpu().numpy()
    masks = result.masks.data.cpu().numpy()
    confidences = result.boxes.conf.cpu().numpy()

    overlay = frame.copy()
    mask_overlay = np.zeros_like(frame)

    # Detect rivers first
    river_polygons = []
    for i, cls_id in enumerate(cls_ids):
        cls_name = result.names.get(cls_id, f"class_{cls_id}")
        if cls_name == "river":
            mask = masks[i].astype(np.uint8)
            full_mask = cv2.resize(mask, (W, H), interpolation=cv2.INTER_NEAREST)
            poly = mask_to_polygon(full_mask)
            if poly:
                river_polygons.append(poly)

    buffer_zone = None
    if river_polygons:
        buffer_dist_px = BUFFER_DISTANCE_M / DEFAULT_GSD
        buffer_zone = unary_union([r.buffer(buffer_dist_px) for r in river_polygons])
        polys = buffer_zone.geoms if hasattr(buffer_zone, "geoms") else [buffer_zone]
        for poly in polys:
            if hasattr(poly, "exterior"):
                coords = np.array(poly.exterior.coords).round().astype(np.int32)
                cv2.polylines(overlay, [coords], isClosed=True, color=(0, 255, 255), thickness=2)

    # Process detections
    for i, obj_id in enumerate(ids):
        cls_name = result.names.get(cls_ids[i], f"class_{cls_ids[i]}")
        x1, y1, x2, y2 = (boxes[i] / scale_factor).astype(int)
        w, h = x2 - x1, y2 - y1
        conf = confidences[i]

        mask = masks[i].astype(np.uint8)
        full_mask = cv2.resize(mask, (W, H), interpolation=cv2.INTER_NEAREST)
        mask_area_px = np.count_nonzero(full_mask)
        area_m2 = round(mask_area_px * (DEFAULT_GSD ** 2), 2)

        obj_center = Point((x1 + x2) // 2, (y1 + y2) // 2)
        obj_poly = mask_to_polygon(full_mask)

        inside_buffer = True
        if buffer_zone:
            inside_buffer = (
                (obj_poly and buffer_zone.intersects(obj_poly))
                or (not obj_poly and buffer_zone.contains(obj_center))
            )

        dist_from_riverbank_m = None
        if river_polygons and cls_name not in ["river", "vegitation inside the river"]:
            if obj_poly:
                min_poly = min(river_polygons, key=lambda r: obj_poly.distance(r))
                p1, p2 = nearest_points(obj_poly, min_poly)
            else:
                min_poly = min(river_polygons, key=lambda r: r.distance(obj_center))
                p1, p2 = nearest_points(obj_center, min_poly)
            dist_px = p1.distance(p2)
            dist_from_riverbank_m = round(dist_px * DEFAULT_GSD, 2)
            if dist_from_riverbank_m < 30:
                cv2.line(overlay, (int(p1.x), int(p1.y)), (int(p2.x), int(p2.y)), (0, 255, 255), 2)

        bridge_length_m = None
        if cls_name == "bridge":
            bridge_length_m = round(max(w, h) * DEFAULT_GSD, 2)

        # Save detection metrics
        detection = {
            "id": int(obj_id),
            "class": cls_name,
            "confidence": round(float(conf), 3),
            "bbox": [int(x1), int(y1), int(x2), int(y2)],
            "area_m2": area_m2,
            "bridge_length_m": bridge_length_m,
            "dist_from_riverbank_m": dist_from_riverbank_m,
            "inside_buffer": inside_buffer,
        }
        metrics["detections"].append(detection)

        # Draw
        color = YOLO9_CLASSES.get(cls_name, (255, 255, 255))
        cv2.rectangle(overlay, (x1, y1), (x2, y2), color, 2)

        metric_text = ""
        if bridge_length_m:
            metric_text = f"{bridge_length_m}m"
        elif area_m2 > 0 and cls_name in ["Natural-drinage", "Manmade-drinage", "silts"]:
            metric_text = f"{area_m2}m²"
        elif dist_from_riverbank_m and cls_name == "Building":
            metric_text = f"d:{dist_from_riverbank_m}m"

        if metric_text:
            cv2.putText(overlay, metric_text, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

    final_frame = cv2.addWeighted(mask_overlay, 0.4, overlay, 1.0, 0)

    # Add frame info at top
    frame_info = f"Frame {frame_idx} | Time {metrics['time_s']}s | Dist {metrics['distance_from_start_m']}m"
    cv2.rectangle(final_frame, (0, 0), (W, 30), (0, 0, 0), -1)
    cv2.putText(final_frame, frame_info, (10, 20), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

    return metrics, final_frame


def process_result_frame_fast(result, frame, scale_factor=1.0):
    """Fast optimized frame processing for non-Yolo9 models."""
    if result.boxes is None:
        return frame
    
    overlay = frame.copy()
    boxes = result.boxes.xyxy.cpu().numpy()
    cls_ids = result.boxes.cls.cpu().numpy().astype(int)
    confidences = result.boxes.conf.cpu().numpy()
    
    # Fast processing
    for i, (x1, y1, x2, y2) in enumerate(boxes):
        # Scale back to original size
        x1, y1, x2, y2 = (np.array([x1, y1, x2, y2]) / scale_factor).astype(int)
        
        cls_name = result.names.get(cls_ids[i], f"class_{cls_ids[i]}")
        confidence = confidences[i]
        
        # Simple visualization
        color = (0, 255, 0)  # Green for all detections
        cv2.rectangle(overlay, (x1, y1), (x2, y2), color, 2)
        
        # Simple label
        label = f"{cls_name} {confidence:.1f}"
        cv2.putText(overlay, label, (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
    
    return overlay

# Original functions remain for compatibility

def process_result_frame(result, img):
    """Helper function to draw masks and bounding boxes on a single frame."""
    if result.masks is not None:
        for mask, cls in zip(result.masks.data.cpu().numpy(), result.boxes.cls.cpu().numpy().astype(int)):
            if cls in MASK_CLASSES:
                color = MASK_CLASSES[cls]
                binary = (mask * 255).astype("uint8")
                binary_resized = cv2.resize(binary, (img.shape[1], img.shape[0]))
                colored_mask = np.zeros_like(img, dtype=np.uint8)
                for j in range(3):
                    colored_mask[..., j] = binary_resized * (color[j] / 255.0)
                img = cv2.addWeighted(img, 1.0, colored_mask, 0.4, 0)

    if result.boxes is not None:
        for box, cls_id in zip(result.boxes.data, result.boxes.cls):
            if int(cls_id) not in MASK_CLASSES:
                xyxy = box[:4].cpu().numpy().astype(int)
                conf = box[4].cpu().item()
                label = f"{model.names[int(cls_id)]} {conf:.2f}"
                hue = int(180 * int(cls_id) / len(model.names))
                color = tuple(int(c) for c in cv2.cvtColor(
                    np.uint8([[[hue, 255, 255]]]), cv2.COLOR_HSV2BGR)[0][0])
                cv2.rectangle(img, (xyxy[0], xyxy[1]), (xyxy[2], xyxy[3]), color, 2)
                cv2.putText(img, label, (xyxy[0], xyxy[1] - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
    return img

def generate_metrics_report(all_metrics, timeline_data, filename, format='csv'):
    """Generate CSV or PDF report from metrics data."""
    try:
        # Group detections by frame
        frame_groups = {}
        summary_totals = {
            'Building': {},
            'bridge': 0,
            'Natural-drinage': {'count': 0},
            'Manmade-drinage': {'count': 0},
            'potholes': {}
        }
        
        building_counter = 0
        pothole_counter = 0
        seen_ids = set()
        
        # First pass: group by frame and collect all detections
        for frame_metrics in all_metrics:
            frame_idx = frame_metrics['frame']
            time_s = frame_metrics['time_s']
            distance_from_start_m = frame_metrics['distance_from_start_m']
            
            # Get location data for this timestamp
            location = None
            if timeline_data:
                for loc in timeline_data:
                    if loc['start'] <= time_s <= loc['end']:
                        location = {'lat': loc['lat'], 'lon': loc['lon']}
                        break
            
            if frame_idx not in frame_groups:
                frame_groups[frame_idx] = {
                    'frame': frame_idx,
                    'time_s': time_s,
                    'distance_from_start_m': distance_from_start_m,
                    'location': location,
                    'classes': [],
                    'detections': []
                }
            
            for detection in frame_metrics['detections']:
                obj_id = detection['id']
                cls_name = detection['class']
                
                # Update counters for new objects
                if obj_id not in seen_ids:
                    seen_ids.add(obj_id)
                    if cls_name == 'bridge':
                        summary_totals['bridge'] += 1
                    elif cls_name == 'Building':
                        building_counter += 1
                        summary_totals['Building'][obj_id] = building_counter
                    elif cls_name in ['Natural-drinage', 'Manmade-drinage']:
                        summary_totals[cls_name]['count'] += 1
                    elif cls_name == 'potholes':
                        pothole_counter += 1
                        summary_totals['potholes'][obj_id] = pothole_counter
                
                # Add class to frame group if not already present
                if cls_name not in frame_groups[frame_idx]['classes']:
                    frame_groups[frame_idx]['classes'].append(cls_name)
                
                # Store detection details for potential use
                frame_groups[frame_idx]['detections'].append(detection)
        
        # Create rows with grouped classes per frame
        rows = []
        for frame_idx in sorted(frame_groups.keys()):
            frame_data = frame_groups[frame_idx]
            
            # Join all classes found in this frame
            classes_found = ', '.join(frame_data['classes'])
            
            # Calculate aggregate metrics for the frame
            total_area = sum(det['area_m2'] for det in frame_data['detections'])
            avg_confidence = sum(det['confidence'] for det in frame_data['detections']) / len(frame_data['detections']) if frame_data['detections'] else 0
            
            # Get bridge length if bridge is present
            bridge_length = None
            for det in frame_data['detections']:
                if det['class'] == 'bridge' and det['bridge_length_m']:
                    bridge_length = det['bridge_length_m']
                    break
            
            # Get distance from riverbank if available
            dist_from_riverbank = None
            for det in frame_data['detections']:
                if det['dist_from_riverbank_m']:
                    dist_from_riverbank = det['dist_from_riverbank_m']
                    break
            
            row = {
                'frame': frame_data['frame'],
                'classes_found': classes_found,
                'time_s': frame_data['time_s'],
                'total_area_m2': total_area,
                'bridge_length_m': bridge_length,
                'dist_from_riverbank_m': dist_from_riverbank,
                'dist_from_starting_m': frame_data['distance_from_start_m'],
                'avg_confidence': avg_confidence,
                'object_count': len(frame_data['detections']),
                'latitude': frame_data['location']['lat'] if frame_data['location'] else None,
                'longitude': frame_data['location']['lon'] if frame_data['location'] else None,
                'location_name': None  # Will be filled later
            }
            rows.append(row)
        
        base_filename = os.path.splitext(filename)[0]
        
        if format == 'csv':
            # Add location names to rows with coordinates
            print("Resolving location names for CSV report...")
            unique_locations = {}
            
            # Get unique lat/lon pairs to minimize API calls
            for row in rows:
                if row['latitude'] and row['longitude']:
                    coord_key = f"{row['latitude']:.4f},{row['longitude']:.4f}"
                    if coord_key not in unique_locations:
                        unique_locations[coord_key] = None
            
            # Resolve location names for unique coordinates
            import asyncio
            
            async def resolve_locations():
                for coord_key in unique_locations:
                    lat, lon = coord_key.split(',')
                    location_name = await get_location_name(float(lat), float(lon))
                    unique_locations[coord_key] = location_name
            
            # Run the async function
            try:
                asyncio.run(resolve_locations())
            except Exception as e:
                print(f"Error resolving locations: {e}")
            
            # Apply location names to rows
            for row in rows:
                if row['latitude'] and row['longitude']:
                    coord_key = f"{row['latitude']:.4f},{row['longitude']:.4f}"
                    row['location_name'] = unique_locations.get(coord_key, f"{row['latitude']:.4f}, {row['longitude']:.4f}")
            
            report_path = os.path.join(REPORTS_DIR, f"{base_filename}_metrics.csv")
            df = pd.DataFrame(rows)
            df.to_csv(report_path, index=False)
            return report_path
        
        elif format == 'pdf':
            report_path = os.path.join(REPORTS_DIR, f"{base_filename}_metrics.pdf")
            generate_pdf_report(rows, summary_totals, timeline_data, report_path, filename)
            return report_path
        
    except Exception as e:
        print(f"Error generating report: {e}")
        return None

def generate_pdf_report(rows, summary_totals, timeline_data, report_path, original_filename):
    """Generate PDF report with metrics and location data."""
    try:
        doc = SimpleDocTemplate(report_path, pagesize=A4)
        styles = getSampleStyleSheet()
        story = []
        
        # Title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=16,
            spaceAfter=30,
            alignment=1  # Center
        )
        story.append(Paragraph(f"Video Analysis Report: {original_filename}", title_style))
        story.append(Spacer(1, 20))
        
        # Summary Statistics
        story.append(Paragraph("Summary Statistics", styles['Heading2']))
        summary_data = [
            ['Metric', 'Count'],
            ['Total Buildings', len(summary_totals['Building'])],
            ['Total Bridges', summary_totals['bridge']],
            ['Natural Drainage', summary_totals['Natural-drinage']['count']],
            ['Manmade Drainage', summary_totals['Manmade-drinage']['count']],
            ['Total Potholes', len(summary_totals['potholes'])],
            ['Total Detections', len(rows)]
        ]
        
        summary_table = Table(summary_data)
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 14),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(summary_table)
        story.append(Spacer(1, 20))
        
        # Location Summary
        if timeline_data:
            story.append(Paragraph("Location Data Summary", styles['Heading2']))
            location_data = [['Start Time (s)', 'End Time (s)', 'Latitude', 'Longitude']]
            for loc in timeline_data[:10]:  # Show first 10 locations
                location_data.append([
                    f"{loc['start']:.1f}",
                    f"{loc['end']:.1f}",
                    f"{loc['lat']:.6f}",
                    f"{loc['lon']:.6f}"
                ])
            
            location_table = Table(location_data)
            location_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            story.append(location_table)
            story.append(Spacer(1, 20))
        
        # Detailed Metrics (first 50 rows)
        story.append(Paragraph("Detailed Metrics (Sample)", styles['Heading2']))
        if rows:
            # Select key columns for the detailed table
            detail_data = [['ID', 'Class', 'Frame', 'Time(s)', 'Area(m²)', 'Bridge Length(m)', 'Distance from River(m)']]
            for row in rows[:50]:  # Show first 50 detections
                detail_data.append([
                    str(row['id']),
                    row['class'],
                    str(row['frame']),
                    f"{row['time_s']:.1f}",
                    f"{row['mask_area_m2']:.2f}" if row['mask_area_m2'] else '-',
                    f"{row['bridge_length_m']:.2f}" if row['bridge_length_m'] else '-',
                    f"{row['dist_from_riverbank_m']:.2f}" if row['dist_from_riverbank_m'] else '-'
                ])
            
            detail_table = Table(detail_data)
            detail_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('FONTSIZE', (0, 1), (-1, -1), 8)
            ]))
            story.append(detail_table)
        
        doc.build(story)
        return True
    except Exception as e:
        print(f"Error generating PDF: {e}")
        return False


# --- Job Status Store ---

job_status = {}
job_cancel_flags = {}
job_cancel_lock = threading.Lock()

def process_video_job(job_id, filename, upload_path, processed_path, current_user,
                      timeline_data=None, model_file=None):
    """Background task to process uploaded video with YOLO models.
       Always generates an MP4 + CSV + PDF metrics report."""

    # --- Load model ---
    try:
        if model_file:
            model_path = os.path.join("models", model_file)
            current_model = YOLO(model_path) if os.path.exists(model_path) else YOLO("models/best.pt")
        else:
            current_model = YOLO("models/best.pt")

        device = "cpu"
        if torch and torch.cuda.is_available():
            try:
                _ = torch.tensor([1.0]).cuda() + 1
                device = "cuda"
                print("✅ CUDA available, using GPU")
            except Exception as e:
                print(f"⚠️ CUDA test failed, fallback to CPU: {e}")
                device = "cpu"

        current_model.to(device)
        if device == "cuda":
            try:
                current_model.model.half()  # mixed precision for speed
                print("⚡ Half precision enabled for GPU inference")
            except Exception:
                pass
    except Exception as e:
        print(f"⚠️ Error loading model: {e}, falling back to default")
        current_model = YOLO("models/best.pt")
        device = "cpu"
        current_model.to(device)


    # --- Prepare output paths and temp file ---

    import time as time_module, gc
    import uuid as uuid_mod
    base_name = os.path.splitext(filename)[0]
    final_filename = f"{base_name}.mp4"
    final_path = os.path.join("static/processed", final_filename)
    timestamp = str(int(time_module.time() * 1000))
    temp_processed_path = os.path.join("static/processed", f"{base_name}_temp_{timestamp}.avi")
    share_id = str(uuid_mod.uuid4())

    cap = cv2.VideoCapture(upload_path)
    if not cap.isOpened():
        job_status[job_id] = {"status": "error", "detail": "Unable to open uploaded video."}
        return

    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    job_status[job_id] = {
        "status": "processing",
        "frames_processed": 0,
        "total_frames": total_frames,
        "progress_percent": 0,
        "csv_progress_percent": 0
    }


    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    out = cv2.VideoWriter(temp_processed_path, fourcc, fps, (width, height))
    frame_idx = 0
    rows = []
    frames_written = 0


    while True:
        ret, frame = cap.read()
        if not ret:
            print(f"[DEBUG] Frame read failed at frame_idx={frame_idx}")
            break


        try:
            result = current_model.predict(frame, conf=0.1, iou=0.45,
                                           verbose=False, device=device, imgsz=640)[0]

            # Draw masks and bboxes for all models
            if model_file and 'yolo9' in model_file.lower():
                frame_metrics, processed_frame = calculate_metrics_for_yolo9(result, frame, frame_idx, fps)
                # Only add to report if there is at least one detection
                if frame_metrics['detections']:
                    for det in frame_metrics['detections']:
                        det_row = {
                            "id": det['id'],
                            "class": det['class'],
                            "frame": frame_metrics['frame'],
                            "time_s": frame_metrics['time_s'],
                            "distance_from_start_m": frame_metrics['distance_from_start_m'],
                            "area_m2": det.get('area_m2'),
                            "bridge_length_m": det.get('bridge_length_m'),
                            "dist_from_riverbank_m": det.get('dist_from_riverbank_m'),
                            "inside_buffer": det.get('inside_buffer'),
                            "confidence": det.get('confidence')
                        }
                        rows.append(det_row)

                else:
                    print(f"[REPORT] Frame {frame_idx} has NO detections for report.")
                out.write(processed_frame)
            else:
                processed_frame = process_result_frame(result, frame)
                out.write(processed_frame)

            # Debug print for detected classes per frame
            if result.boxes is not None:
                detected_classes = [result.names.get(int(cls_id), str(cls_id)) for cls_id in result.boxes.cls.cpu().numpy()]
                print(f"Frame {frame_idx}: Detected classes: {detected_classes}")

            frames_written += 1
            print(f"[DEBUG] Frame {frame_idx} written. Total frames_written={frames_written}")
        except Exception as frame_error:
            print(f"⚠️ Error processing frame {frame_idx}: {frame_error}")

        # Always update progress
        if frame_idx % 3 == 0 or frame_idx == total_frames - 1:
            job_status[job_id].update({
                "frames_processed": frame_idx + 1,
                "progress_percent": min(int((frame_idx + 1) / total_frames * 100), 100)
            })

        frame_idx += 1
        if frame_idx % 100 == 0:
            gc.collect()

    cap.release()
    out.release()

    # Log for debugging
    print(f"[DEBUG] frames_written: {frames_written}, temp_exists: {os.path.exists(temp_processed_path)}, temp_path: {temp_processed_path}")
    if frames_written == 0 or not os.path.exists(temp_processed_path):
        print(f"❌ No frames written or temp file missing: {temp_processed_path}")
        job_status[job_id]["error"] = f"No frames written or temp file missing: {temp_processed_path} (frames_written={frames_written})"
        return

    # Convert AVI → MP4
    try:
        subprocess.run(
            ["ffmpeg", "-i", temp_processed_path, "-c:v", "libx264", "-y", final_path],
            check=True
        )
    except subprocess.CalledProcessError as ffmpeg_error:
        print(f"❌ ffmpeg failed: {ffmpeg_error}")
        job_status[job_id]["error"] = f"ffmpeg failed: {ffmpeg_error}"
        return
    if os.path.exists(temp_processed_path):
        os.remove(temp_processed_path)

    # Save DB record (video is ready)
    with sqlite3.connect(DB_PATH) as conn:
        cur = conn.cursor()
        cur.execute("PRAGMA table_info(videos)")
        columns = [c[1] for c in cur.fetchall()]
        if "share_id" not in columns:
            cur.execute("ALTER TABLE videos ADD COLUMN share_id TEXT")
        cur.execute(
            "INSERT INTO videos (email, filename, timeline_data, upload_date, model_used, has_metrics, share_id) "
            "VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?)",
            (current_user, final_filename, json.dumps(timeline_data) if timeline_data else None, model_file, True, share_id)
        )
        conn.commit()

    # Immediately update job_status so frontend can show video and map
    job_status[job_id] = {
        "status": "done",
        "processed_video_url": f"/video/processed/{final_filename}",
        "share_url": f"/video/share/{share_id}",
        "share_id": share_id,
        "timeline": timeline_data,
        "model_used": model_file,
        "has_metrics": False,  # report not ready yet
        "progress_percent": 100,
        "csv_progress_percent": 0,
        "report_status": "processing"
    }

    # Generate report in background (simulate steps)
    import threading
    def generate_report_bg():
        try:
            job_status[job_id]["report_status"] = "processing"
            job_status[job_id]["report_steps_completed"] = 0
            job_status[job_id]["report_total_steps"] = 2
            job_status[job_id]["report_progress_percent"] = 0

            # Step 1: CSV
            output_csv = os.path.join(REPORTS_DIR, f"{base_name}_metrics.csv")
            pd.DataFrame(rows).to_csv(output_csv, index=False)
            job_status[job_id]["report_steps_completed"] = 1
            job_status[job_id]["report_progress_percent"] = 50

            # Step 2: PDF (fix for missing distance_from_start_m)

            def safe_generate_metrics_report(rows, timeline_data, filename, fmt):
                # Patch: if 'distance_from_start_m' missing, use 'dist_from_starting_m' or set to 0
                for r in rows:
                    if 'distance_from_start_m' not in r:
                        if 'dist_from_starting_m' in r:
                            r['distance_from_start_m'] = r['dist_from_starting_m']
                        else:
                            r['distance_from_start_m'] = 0
                return generate_metrics_report(rows, timeline_data, filename, fmt)

            output_pdf = safe_generate_metrics_report(rows, timeline_data, final_filename, "pdf")
            job_status[job_id]["report_steps_completed"] = 2
            job_status[job_id]["report_progress_percent"] = 100
            job_status[job_id]["report_status"] = "done"

            reports = {"csv": f"/video/reports/{os.path.basename(output_csv)}"}
            if output_pdf:
                reports["pdf"] = f"/video/reports/{os.path.basename(output_pdf)}"
            job_status[job_id]["reports"] = reports
            job_status[job_id]["has_metrics"] = True
        except Exception as e:
            job_status[job_id]["report_status"] = "error"
            job_status[job_id]["report_error"] = str(e)

    threading.Thread(target=generate_report_bg, daemon=True).start()

    cap.release()
    out.release()

    # Convert AVI → MP4
    subprocess.run(
        ["ffmpeg", "-i", temp_processed_path, "-c:v", "libx264", "-y", final_path],
        check=True
    )
    if os.path.exists(temp_processed_path):
        os.remove(temp_processed_path)

    # Reports
    output_csv = os.path.join(REPORTS_DIR, f"{base_name}_metrics.csv")
    pd.DataFrame(rows).to_csv(output_csv, index=False)

    output_pdf = generate_metrics_report(rows, timeline_data, final_filename, "pdf")

    reports = {"csv": f"/video/reports/{os.path.basename(output_csv)}"}
    if output_pdf:
        reports["pdf"] = f"/video/reports/{os.path.basename(output_pdf)}"

    # Save DB record
    with sqlite3.connect(DB_PATH) as conn:
        cur = conn.cursor()
        cur.execute("PRAGMA table_info(videos)")
        columns = [c[1] for c in cur.fetchall()]
        if "share_id" not in columns:
            cur.execute("ALTER TABLE videos ADD COLUMN share_id TEXT")
        cur.execute(
            "INSERT INTO videos (email, filename, timeline_data, upload_date, model_used, has_metrics, share_id) "
            "VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?)",
            (current_user, final_filename, json.dumps(timeline_data) if timeline_data else None, model_file, True, share_id)
        )
        conn.commit()







# Endpoint to cancel a running job
@router.post("/cancel/{job_id}")
def cancel_video_job(job_id: str):
    with job_cancel_lock:
        job_cancel_flags[job_id] = True
        job_status[job_id] = {"status": "cancelled"}
    return {"status": "cancelled"}

def parse_srt(srt_content: bytes):
    try:
        subs = pysrt.from_string(srt_content.decode('utf-8'))
        timeline = []
        for sub in subs:
            # Accept both [longitude: ...] and [longtitude: ...]
            m = re.search(r"\[latitude\s*:\s*([\-\d\.]+)\].*?\[(longtitude|longitude)\s*:\s*([\-\d\.]+)\]", sub.text, re.IGNORECASE)
            if not m:
                continue
            lat = float(m.group(1))
            lon = float(m.group(3))
            timeline.append({
                "start": sub.start.ordinal / 1000.0,
                "end":   sub.end.ordinal   / 1000.0,
                "lat": lat,
                "lon": lon
            })
        if not timeline:
            print("[WARNING] No GPS data found in SRT. Check SRT format.")
        return timeline
    except Exception as e:
        print(f"[ERROR] SRT parsing failed: {e}")
        return [] # Return empty list on parsing error


@router.post("/upload/")
async def upload_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    srt: Optional[UploadFile] = None,
    current_user: str = Depends(get_current_user),
    model_file: Optional[str] = None
):
    filename = sanitize_filename(file.filename)
    upload_path = os.path.join(UPLOAD_DIR, filename)
    processed_path = os.path.join(PROCESSED_DIR, filename)
    job_id = str(uuid.uuid4())

    # ✅ Always initialize timeline
    timeline = None

    # If SRT file provided → parse timeline data
    if srt is not None:
        srt_content = await srt.read()
        timeline = parse_srt(srt_content)

    # --- VIDEO HANDLING ---
    if is_video(file.filename):
        with open(upload_path, "wb") as f:
            f.write(await file.read())

        # ✅ Pass timeline instead of None
        background_tasks.add_task(
            process_video_job, job_id, filename, upload_path, processed_path, current_user, timeline, model_file
        )
        return {"status": "processing", "job_id": job_id}

    # --- IMAGE HANDLING ---
    elif is_image(file.filename):
        with open(processed_path, "wb") as f:
            f.write(await file.read())

        # If timeline available from SRT, attach to image
        location = None
        if timeline and len(timeline) > 0:
            location = {"lat": timeline[0]["lat"], "lon": timeline[0]["lon"]}

        # Run YOLO detection on image
        try:
            results = model(processed_path)
            objects = []
            for r in results:
                for box in r.boxes:
                    objects.append({
                        "label": r.names[int(box.cls)],
                        "confidence": float(box.conf),
                        "box": [float(x) for x in box.xyxy[0].tolist()]
                    })
        except Exception:
            objects = []

        return {
            "status": "image processed",
            "url": f"/video/processed/{filename}",
            "objects": objects,
            "location": location
        }

    else:
        raise HTTPException(status_code=400, detail="Unsupported file type")


@router.get("/status/{job_id}")
def get_job_status(job_id: str):
    status = job_status.get(job_id)
    if not status:
        return {"status": "not_found"}

    # ✅ Ensure reports field is included if available
    if status.get("status") == "done":
        if "reports" not in status:
            base_filename = os.path.splitext(status["processed_video_url"].split("/")[-1])[0]
            reports = {}
            csv_path = os.path.join(REPORTS_DIR, f"{base_filename}_metrics.csv")
            pdf_path = os.path.join(REPORTS_DIR, f"{base_filename}_metrics.pdf")
            if os.path.exists(csv_path):
                reports["csv"] = f"/video/reports/{os.path.basename(csv_path)}"
            if os.path.exists(pdf_path):
                reports["pdf"] = f"/video/reports/{os.path.basename(pdf_path)}"
            if reports:
                status["reports"] = reports

    return status


@router.get("/processed/{filename}")
def get_processed_video(filename: str):
    path = os.path.join(PROCESSED_DIR, filename)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Processed video not found.")

    ext = os.path.splitext(filename)[1].lower()
    if ext == ".mp4":
        media_type = "video/mp4"
    elif ext == ".mov":
        media_type = "video/quicktime"
    elif ext == ".avi":
        media_type = "video/x-msvideo"
    else:
        media_type = "application/octet-stream"

    return FileResponse(path, media_type=media_type, filename=filename)


@router.get("/reports/{filename}")
def get_report_file(filename: str):
    """Serve report files (CSV/PDF)."""
    path = os.path.join(REPORTS_DIR, filename)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Report file not found.")
    
    if filename.endswith('.csv'):
        return FileResponse(path, media_type="text/csv", filename=filename)
    elif filename.endswith('.pdf'):
        return FileResponse(path, media_type="application/pdf", filename=filename)
    else:
        return FileResponse(path, filename=filename)

@router.get("/history")
def get_user_videos(current_user: str = Depends(get_current_user)):
    """Fetch all processed videos for the logged-in user, including reports."""
    API_BASE = os.getenv("API_BASE_URL", "http://localhost:8000")

    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        cursor.execute("CREATE TABLE IF NOT EXISTS videos (email TEXT, filename TEXT)")
        cursor.execute("PRAGMA table_info(videos)")
        columns = [c[1] for c in cursor.fetchall()]

        # Add missing columns dynamically
        if "timeline_data" not in columns:
            cursor.execute("ALTER TABLE videos ADD COLUMN timeline_data TEXT")
        if "upload_date" not in columns:
            cursor.execute("ALTER TABLE videos ADD COLUMN upload_date TIMESTAMP")
        if "model_used" not in columns:
            cursor.execute("ALTER TABLE videos ADD COLUMN model_used TEXT")
        if "has_metrics" not in columns:
            cursor.execute("ALTER TABLE videos ADD COLUMN has_metrics BOOLEAN")
        if "share_id" not in columns:
            cursor.execute("ALTER TABLE videos ADD COLUMN share_id TEXT")

        try:
            cursor.execute(
                """
                SELECT filename, timeline_data, upload_date, model_used, has_metrics, share_id
                FROM videos WHERE email = ? 
                ORDER BY upload_date DESC
                """,
                (current_user,)
            )
            rows = cursor.fetchall()
        except sqlite3.OperationalError:
            # fallback for older dbs without all fields
            cursor.execute("SELECT filename FROM videos WHERE email = ?", (current_user,))
            old_rows = cursor.fetchall()
            rows = [(row[0], None, None, None, False, None) for row in old_rows]

    videos = []
    for row in rows:
        filename = row[0]
        timeline_json = row[1] if len(row) > 1 else None
        upload_date = row[2] if len(row) > 2 else None
        model_used = row[3] if len(row) > 3 else None
        has_metrics = row[4] if len(row) > 4 else False

        # Parse timeline data if available
        timeline_data = None
        if timeline_json:
            try:
                timeline_data = json.loads(timeline_json)
            except json.JSONDecodeError:
                timeline_data = None

        # Find the actual processed file with UUID prefix if it exists
        processed_file = None
        processed_dir = os.path.join(PROCESSED_DIR)
        for f in os.listdir(processed_dir):
            # Match files that end with the original filename (case-insensitive)
            if f.lower().endswith(filename.lower()):
                processed_file = f
                break
        processed_url = f"/video/processed/{processed_file}" if processed_file else f"/video/processed/{filename}"

        video_info = {
            "filename": filename,
            "processed_url": processed_url,
            "timeline": timeline_data,
            "upload_date": upload_date,
            "model_used": model_used,
            "has_metrics": has_metrics
        }

        # Check for report files if has_metrics is True
        if has_metrics:
            base_filename = os.path.splitext(filename)[0]
            csv_path = os.path.join(REPORTS_DIR, f"{base_filename}_metrics.csv")
            pdf_path = os.path.join(REPORTS_DIR, f"{base_filename}_metrics.pdf")

            reports = {}
            if os.path.exists(csv_path):
                reports['csv'] = f"/video/reports/{base_filename}_metrics.csv"
            if os.path.exists(pdf_path):
                reports['pdf'] = f"/video/reports/{base_filename}_metrics.pdf"

            if reports:
                video_info['reports'] = reports

        videos.append(video_info)

    return {"videos": videos}

@router.delete("/history/clear")
def clear_user_history(current_user: str = Depends(get_current_user)):
    try:
        with sqlite3.connect(DB_PATH) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT filename FROM videos WHERE email = ?", (current_user,))
            filenames_to_delete = [row[0] for row in cursor.fetchall()]
            cursor.execute("DELETE FROM videos WHERE email = ?", (current_user,))
            conn.commit()

        for filename in filenames_to_delete:
            # Delete video files
            upload_file = os.path.join(UPLOAD_DIR, filename)
            processed_file = os.path.join(PROCESSED_DIR, filename)
            
            if os.path.exists(upload_file):
                os.remove(upload_file)
            if os.path.exists(processed_file):
                os.remove(processed_file)
            
            # Delete report files
            base_filename = os.path.splitext(filename)[0]
            csv_file = os.path.join(REPORTS_DIR, f"{base_filename}_metrics.csv")
            pdf_file = os.path.join(REPORTS_DIR, f"{base_filename}_metrics.pdf")
            
            if os.path.exists(csv_file):
                os.remove(csv_file)
            if os.path.exists(pdf_file):
                os.remove(pdf_file)
                
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {e}")

@router.get("/models")
def get_available_models():
    """Get list of available models and their capabilities."""
    models_dir = "models"
    available_models = []
    
    if os.path.exists(models_dir):
        for file in os.listdir(models_dir):
            if file.endswith('.pt'):
                model_info = {
                    "filename": file,
                    "name": os.path.splitext(file)[0],
                    "supports_metrics": 'yolo9' in file.lower(),
                    "description": "Advanced metrics model" if 'yolo9' in file.lower() else "Standard detection model"
                }
                available_models.append(model_info)
    
    return {"models": available_models}

@router.get("/stats")
def get_dashboard_stats(current_user: str = Depends(get_current_user)):
    """Get dashboard statistics for the current user"""
    try:
        # Get processed videos count
        with sqlite3.connect(DB_PATH) as conn:
            cursor = conn.cursor()
            cursor.execute("CREATE TABLE IF NOT EXISTS videos (email TEXT, filename TEXT)")
            cursor.execute("SELECT COUNT(*) FROM videos WHERE email = ?", (current_user,))
            total_videos = cursor.fetchone()[0]

        # Count currently processing videos (jobs in progress)
        processing_count = sum(1 for status in job_status.values() 
                             if status.get("status") == "processing")

        # Calculate total duration of processed videos
        total_duration_seconds = 0
        try:
            with sqlite3.connect(DB_PATH) as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT filename FROM videos WHERE email = ?", (current_user,))
                filenames = [row[0] for row in cursor.fetchall()]
                
            for filename in filenames:
                video_path = os.path.join(PROCESSED_DIR, filename)
                if os.path.exists(video_path):
                    try:
                        cap = cv2.VideoCapture(video_path)
                        fps = cap.get(cv2.CAP_PROP_FPS)
                        frame_count = cap.get(cv2.CAP_PROP_FRAME_COUNT)
                        if fps > 0:
                            duration = frame_count / fps
                            total_duration_seconds += duration
                        cap.release()
                    except:
                        continue
        except Exception as e:
            print(f"Error calculating duration: {e}")

        # Format duration
        if total_duration_seconds < 60:
            duration_str = f"{int(total_duration_seconds)}s"
        elif total_duration_seconds < 3600:
            minutes = int(total_duration_seconds // 60)
            seconds = int(total_duration_seconds % 60)
            duration_str = f"{minutes}m {seconds}s" if seconds > 0 else f"{minutes}m"
        else:
            hours = int(total_duration_seconds // 3600)
            minutes = int((total_duration_seconds % 3600) // 60)
            duration_str = f"{hours}h {minutes}m" if minutes > 0 else f"{hours}h"

        return {
            "total_videos": total_videos,
            "processing": processing_count,
            "total_duration": duration_str
        }
    except Exception as e:
        return {
            "total_videos": 0,
            "processing": 0,
            "total_duration": "0s"
        }
    


    





