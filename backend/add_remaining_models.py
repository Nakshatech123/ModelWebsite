import sqlite3

def add_additional_models():
    """Add the additional models visible in the file system"""
    
    additional_models = [
        {
            "name": "best",
            "description": "Original general object detection model",
            "category": "General",
            "project_type": "general_detection",
            "detection_classes": "Person, Vehicle, Building, Tree, Water, Road, Bridge",
            "model_file": "best.pt",
            "created_by": "system"
        },
        {
            "name": "best1",
            "description": "Alternative general detection model",
            "category": "General", 
            "project_type": "alternative_general",
            "detection_classes": "Person, Vehicle, Object, Structure",
            "model_file": "best1.pt",
            "created_by": "system"
        },
        {
            "name": "highway_road_model",
            "description": "Highway and road infrastructure analysis",
            "category": "Infrastructure",
            "project_type": "highway_road",
            "detection_classes": "Road, Highway, Infrastructure, Vehicle",
            "model_file": "highway_road_model.pt", 
            "created_by": "system"
        },
        {
            "name": "river_env_model",
            "description": "River and environmental monitoring", 
            "category": "Environmental",
            "project_type": "river_environment",
            "detection_classes": "River, Water, Environment, Vegetation",
            "model_file": "river_env_model.pt",
            "created_by": "system"
        }
    ]
    
    with sqlite3.connect("videos.db") as conn:
        cursor = conn.cursor()
        
        print("Adding additional models...")
        
        for model in additional_models:
            # Check if model already exists
            cursor.execute("SELECT id FROM models WHERE model_file = ?", (model["model_file"],))
            existing = cursor.fetchone()
            
            if not existing:
                cursor.execute("""
                    INSERT INTO models (name, description, category, project_type, detection_classes, model_file, created_by)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    model["name"],
                    model["description"],
                    model["category"], 
                    model["project_type"],
                    model["detection_classes"],
                    model["model_file"],
                    model["created_by"]
                ))
                print(f"Added: {model['name']} ({model['model_file']})")
            else:
                print(f"Already exists: {model['name']} ({model['model_file']})")
        
        conn.commit()
        
        print("\nAll models in database:")
        cursor.execute("SELECT id, name, model_file FROM models ORDER BY id")
        all_models = cursor.fetchall()
        for model in all_models:
            print(f"ID: {model[0]}, Name: {model[1]}, File: {model[2]}")

if __name__ == "__main__":
    add_additional_models()
