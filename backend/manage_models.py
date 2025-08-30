import sqlite3
import os

def update_model_info():
    """Update model information in database"""
    
    # Connect to database
    with sqlite3.connect("videos.db") as conn:
        cursor = conn.cursor()
        
        print("Current models in database:")
        cursor.execute("SELECT id, name, category, detection_classes, model_file FROM models")
        models = cursor.fetchall()
        
        for model in models:
            print(f"ID: {model[0]}")
            print(f"Name: {model[1]}")
            print(f"Category: {model[2]}")
            print(f"Classes: {model[3]}")
            print(f"File: {model[4]}")
            print(f"File exists: {os.path.exists(f'models/{model[4]}')}")
            print("-" * 50)
        
        # Option to update detection classes
        print("\nTo update detection classes for your models:")
        print("1. River & Environmental Detection (ID 1)")
        print("2. Highway & Road Analysis (ID 2)")
        print("3. General Object Detection (ID 3)")
        
        model_id = input("\nEnter model ID to update (or 'q' to quit): ")
        
        if model_id.lower() == 'q':
            return
            
        if model_id in ['1', '2', '3']:
            new_classes = input("Enter new detection classes (comma-separated): ")
            
            cursor.execute("""
                UPDATE models 
                SET detection_classes = ? 
                WHERE id = ?
            """, (new_classes, int(model_id)))
            
            conn.commit()
            print(f"Updated model {model_id} with new classes: {new_classes}")
        else:
            print("Invalid model ID")

def check_model_files():
    """Check if model files exist"""
    model_files = [
        "models/best.pt",
        "models/river_env_model.pt", 
        "models/highway_road_model.pt"
    ]
    
    print("Checking model files:")
    for file_path in model_files:
        exists = os.path.exists(file_path)
        size = os.path.getsize(file_path) if exists else 0
        print(f"{file_path}: {'✓' if exists else '✗'} ({size} bytes)")

if __name__ == "__main__":
    print("=== Model Management Tool ===")
    print("1. Check model files")
    print("2. Update model information") 
    
    choice = input("Choose option (1 or 2): ")
    
    if choice == "1":
        check_model_files()
    elif choice == "2":
        update_model_info()
    else:
        print("Invalid choice")





