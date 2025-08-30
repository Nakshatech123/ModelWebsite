from ultralytics import YOLO
import cv2

model = YOLO("models/best.pt")
model.to('cpu')  # Force CPU mode to avoid CUDA issues
img = cv2.imread("C:/Users/NTIN10/Pictures/Screenshots/image.jpg")  # replace with a test image

results = model.predict(img, device='cpu')
results[0].show()  # shows image with boxes




