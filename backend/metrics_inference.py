# metrics_inference.py
import cv2
import numpy as np
import pandas as pd
from shapely.geometry import Polygon, Point
from shapely.ops import nearest_points, unary_union
from ultralytics import YOLO
import torch


# Color map for YOLO9 classes
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

def mask_to_polygon(mask):
    """Convert binary mask to Shapely Polygon"""
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return None
    largest = max(contours, key=cv2.contourArea)
    if largest.shape[0] < 3:
        return None
    return Polygon(largest.squeeze())

def save_csv_with_progress(df, output_csv, job_id=None, job_status_dict=None, chunks=20):
    """Write CSV in chunks with progress updates"""
    total_rows = len(df)
    if total_rows == 0:
        df.to_csv(output_csv, index=False)
        if job_id and job_status_dict is not None:
            job_status_dict[job_id].update({"csv_progress_percent": 100})
        return output_csv

    chunk_size = max(1, total_rows // chunks)
    with open(output_csv, "w") as f:
        for i, start in enumerate(range(0, total_rows, chunk_size)):
            chunk = df.iloc[start:start+chunk_size]
            header = (i == 0)
            chunk.to_csv(f, mode="a", index=False, header=header)

            if job_id and job_status_dict is not None:
                percent = min(int((start + len(chunk)) / total_rows * 100), 100)
                job_status_dict[job_id].update({"csv_progress_percent": percent})

    return output_csv

# --- Main metrics pipeline ---
def run_yolo9_metrics(video_path, output_video, output_csv,
                      model_path="models/yolo9.pt",
                      conf_thresh=0.4, iou_thresh=0.5,
                      gsd=0.05, drone_speed=2, buffer_dist_m=30,
                      job_id=None, job_status_dict=None):

    print(f"[DEBUG] run_yolo9_metrics called: video_path={video_path}, output_video={output_video}, model_path={model_path}")
    device = "cuda" if torch.cuda.is_available() else "cpu"
    try:
        model = YOLO(model_path).to(device)
        print(f"[DEBUG] YOLO model loaded: {model_path}")
    except Exception as e:
        print(f"[DEBUG] Failed to load YOLO model: {e}")
        raise

    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS) or 25
    W = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    H = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    cap.release()

    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    writer = cv2.VideoWriter(output_video, fourcc, fps, (W, H))

    rows, seen_ids = [], set()
    frame_idx = 0

    # ✅ maintain counts for summary bar
    summary_counts = {cls: 0 for cls in YOLO9_CLASSES.keys()}

    try:
        streamed = model.track(
            source=video_path, conf=conf_thresh, iou=iou_thresh,
            tracker="bytetrack.yaml", stream=True, device=device, verbose=False
        )
        print(f"[DEBUG] YOLO tracking started")
    except Exception as e:
        print(f"[DEBUG] Failed to start YOLO tracking: {e}")
        raise

    first_frame = True
    for res in streamed:
        if first_frame:
            print(f"[DEBUG] First frame received from YOLO tracking")
            first_frame = False
        overlay = res.orig_img.copy()

        if res.masks is None or res.boxes is None:
            frame_idx += 1
            continue

        cls_ids = res.boxes.cls.cpu().numpy().astype(int)
        ids = (res.boxes.id.cpu().numpy().astype(int)
               if res.boxes.id is not None else list(range(len(cls_ids))))
        boxes = res.boxes.xyxy.cpu().numpy()
        masks = res.masks.data.cpu().numpy()

        # --- Draw detections ---
        print(f"[DEBUG] Frame {frame_idx}: {len(ids)} detections")
        for i, obj_id in enumerate(ids):
            cls_name = model.names[cls_ids[i]]
            x1, y1, x2, y2 = boxes[i].astype(int)

            # RIVER → mask overlay
            if cls_name == "river":
                sm = masks[i].astype(np.uint8)
                full = cv2.resize(sm, (W, H), interpolation=cv2.INTER_NEAREST)
                color = YOLO9_CLASSES.get("river", (255, 0, 0))
                overlay[full > 0] = (0.6 * overlay[full > 0] + 0.4 * np.array(color)).astype(np.uint8)
            else:
                # other classes → bounding box
                color = YOLO9_CLASSES.get(cls_name, (255, 255, 255))
                cv2.rectangle(overlay, (x1, y1), (x2, y2), color, 2)
                cv2.putText(overlay, f"{cls_name}", (x1, y1 - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)

            # --- update unique object count
            if obj_id not in seen_ids:
                seen_ids.add(obj_id)
                summary_counts[cls_name] += 1

            row = {
                "id": obj_id,
                "class": cls_name,
                "frame": frame_idx,
                "time_s": round(frame_idx / fps, 3),
                "x1": x1,
                "y1": y1,
                "x2": x2,
                "y2": y2,
                "summary_counts": dict(summary_counts)  # snapshot
            }
            print(f"[METRIC] Detection: class={cls_name}, frame={frame_idx}, time={round(frame_idx / fps, 3)}s, bbox=({x1},{y1},{x2},{y2}), id={obj_id}")
            rows.append(row)

        # --- Top summary bar ---
        summary_text = " | ".join([f"{cls}: {summary_counts[cls]}" for cls in summary_counts])
        cv2.rectangle(overlay, (0, 0), (W, 40), (0, 0, 128), -1)
        cv2.putText(overlay, summary_text, (20, 28),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

        writer.write(overlay)

        # progress
        if job_id and job_status_dict:
            job_status_dict[job_id].update({
                "frames_processed": frame_idx + 1,
                "total_frames": total_frames,
                "progress_percent": min(int((frame_idx + 1) / total_frames * 100), 100)
            })

        frame_idx += 1

    writer.release()

    # --- save CSV ---

    print(f"[DEBUG] Total rows collected for report: {len(rows)}")
    if not rows:
        print("[WARNING] No metrics were collected from the processed video. The CSV will be empty.")
    else:
        print(f"[DEBUG] Example row: {rows[0]}")
    df = pd.DataFrame(rows)
    print(f"[DEBUG] DataFrame columns: {df.columns.tolist()}")
    df.to_csv(output_csv, index=False)
    print(f"[DEBUG] CSV saved to: {output_csv}")

    if job_id and job_status_dict:
        job_status_dict[job_id].update({"csv_progress_percent": 100})

    return output_video, output_csv





