# import sqlite3
# import os

# def seed_models():
#     """Add project-based models to the database"""
#     project_models = [
#         {
#             "name": "National Highway Analysis",
#             "description": "Road condition analysis, crack detection, highway infrastructure monitoring",
#             "category": "Infrastructure", 
#             "project_type": "national_highway",
#             "detection_classes": "Road, Crack, Pothole, Lane Marking, Traffic Sign, Pavement Damage",
#             "model_file": "national_highway_best.pt",
#             "created_by": "system"
#         },
#         {
#             "name": "River & Water Body Monitoring",
#             "description": "River detection, water quality assessment, garbage detection in water bodies",
#             "category": "Environmental",
#             "project_type": "river_monitoring", 
#             "detection_classes": "River, Water, Garbage, Pollution, Vegetation, Bridge, Dam",
#             "model_file": "river_monitoring_best.pt",
#             "created_by": "system"
#         },
#         {
#             "name": "Urban Infrastructure Analysis", 
#             "description": "Building inspection, urban planning, infrastructure assessment",
#             "category": "Urban",
#             "project_type": "urban_infrastructure",
#             "detection_classes": "Building, Road, Vehicle, Person, Infrastructure, Damage",
#             "model_file": "urban_infrastructure_best.pt", 
#             "created_by": "system"
#         },
#         {
#             "name": "Forest & Environmental Survey",
#             "description": "Forest monitoring, tree counting, environmental impact assessment", 
#             "category": "Environmental",
#             "project_type": "forest_survey",
#             "detection_classes": "Tree, Forest, Deforestation, Wildlife, Water Body, Vegetation",
#             "model_file": "forest_survey_best.pt",
#             "created_by": "system"
#         },
#         {
#             "name": "Construction Site Monitoring",
#             "description": "Construction progress tracking, safety monitoring, equipment detection",
#             "category": "Construction", 
#             "project_type": "construction_site",
#             "detection_classes": "Equipment, Worker, Vehicle, Building, Safety Gear, Materials",
#             "model_file": "construction_site_best.pt",
#             "created_by": "system"
#         }
#     ]
    
#     # Create models directory if it doesn't exist
#     os.makedirs("models", exist_ok=True)
    
#     with sqlite3.connect("videos.db") as conn:
#         cursor = conn.cursor()
        
#         # Create models table if it doesn't exist
#         cursor.execute("""
#             CREATE TABLE IF NOT EXISTS models (
#                 id INTEGER PRIMARY KEY AUTOINCREMENT,
#                 name TEXT NOT NULL,
#                 description TEXT,
#                 category TEXT,
#                 detection_classes TEXT,
#                 model_file TEXT,
#                 created_by TEXT,
#                 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
#             )
#         """)
        
#         # Clear existing system models
#         cursor.execute("DELETE FROM models WHERE created_by = 'system'")
        
#         # Add new models
#         for model in project_models:
#             cursor.execute("""
#                 INSERT INTO models (name, description, category, project_type, detection_classes, model_file, created_by)
#                 VALUES (?, ?, ?, ?, ?, ?, ?)
#             """, (
#                 model["name"],
#                 model["description"], 
#                 model["category"],
#                 model["project_type"],
#                 model["detection_classes"],
#                 model["model_file"],
#                 model["created_by"]
#             ))
        
#         conn.commit()
#         print(f"Successfully added {len(project_models)} project models to the database!")
        
#         # Display added models
#         cursor.execute("SELECT id, name, model_file FROM models WHERE created_by = 'system'")
#         models = cursor.fetchall()
#         print("\nAdded models:")
#         for model_id, name, model_file in models:
#             print(f"- ID: {model_id}, Name: {name}, File: {model_file}")

# if __name__ == "__main__":
#     seed_models()




# seed_models.py
import os
from database import exec_sql, q_all

PROJECT_MODELS = [
    {
        "name": "National Highway Analysis",
        "description": "Road condition analysis, crack detection, highway infrastructure monitoring",
        "category": "Infrastructure",
        "project_type": "national_highway",
        "detection_classes": "Road, Crack, Pothole, Lane Marking, Traffic Sign, Pavement Damage",
        "model_file": "national_highway_best.pt",
        "created_by": "system",
    },
    {
        "name": "River & Water Body Monitoring",
        "description": "River detection, water quality assessment, garbage detection in water bodies",
        "category": "Environmental",
        "project_type": "river_monitoring",
        "detection_classes": "River, Water, Garbage, Pollution, Vegetation, Bridge, Dam",
        "model_file": "river_monitoring_best.pt",
        "created_by": "system",
    },
    {
        "name": "Urban Infrastructure Analysis",
        "description": "Building inspection, urban planning, infrastructure assessment",
        "category": "Urban",
        "project_type": "urban_infrastructure",
        "detection_classes": "Building, Road, Vehicle, Person, Infrastructure, Damage",
        "model_file": "urban_infrastructure_best.pt",
        "created_by": "system",
    },
    {
        "name": "Forest & Environmental Survey",
        "description": "Forest monitoring, tree counting, environmental impact assessment",
        "category": "Environmental",
        "project_type": "forest_survey",
        "detection_classes": "Tree, Forest, Deforestation, Wildlife, Water Body, Vegetation",
        "model_file": "forest_survey_best.pt",
        "created_by": "system",
    },
    {
        "name": "Construction Site Monitoring",
        "description": "Construction progress tracking, safety monitoring, equipment detection",
        "category": "Construction",
        "project_type": "construction_site",
        "detection_classes": "Equipment, Worker, Vehicle, Building, Safety Gear, Materials",
        "model_file": "construction_site_best.pt",
        "created_by": "system",
    },
]

def run():
    os.makedirs("models", exist_ok=True)

    # make sure project_type exists
    exec_sql("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema='public' AND table_name='models' AND column_name='project_type'
            ) THEN
                EXECUTE 'ALTER TABLE models ADD COLUMN project_type text';
            END IF;
        END $$;
    """)

    # clear system models and insert fresh
    exec_sql("DELETE FROM models WHERE created_by = 'system'")

    for m in PROJECT_MODELS:
        exec_sql("""
            INSERT INTO models
                (name, description, category, project_type, detection_classes, model_file, created_by)
            VALUES
                (:name, :description, :category, :project_type, :detection_classes, :model_file, :created_by)
        """, **m)

    print(f"Successfully added {len(PROJECT_MODELS)} project models to the database!")

    models = q_all("SELECT id, name, model_file FROM models WHERE created_by = 'system' ORDER BY id")
    print("\nAdded models:")
    for r in models:
        print(f"- ID: {r['id']}, Name: {r['name']}, File: {r['model_file']}")

if __name__ == "__main__":
    run()
