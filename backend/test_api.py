import requests
import json

# Test the stats endpoint directly
try:
    # You'll need to replace this with a real auth token
    # For now, let's test without auth to see if the endpoint exists
    response = requests.get('http://localhost:8000/video/stats')
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
    print("Server might not be running")
