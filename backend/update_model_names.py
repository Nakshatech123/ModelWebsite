# import sqlite3

# def update_model_names():
#     """Update model names to match the exact file names"""
    
#     # Define the exact model names as they appear in the file system
#     updated_models = [
#         {
#             "id": 5,  # National Highway Analysis
#             "name": "national_highway_best",
#             "model_file": "national_highway_best.pt"
#         },
#         {
#             "id": 6,  # River & Water Body Monitoring  
#             "name": "river_monitoring_best",
#             "model_file": "river_monitoring_best.pt"
#         },
#         {
#             "id": 7,  # Urban Infrastructure Analysis
#             "name": "urban_infrastructure_best", 
#             "model_file": "urban_infrastructure_best.pt"
#         },
#         {
#             "id": 8,  # Forest & Environmental Survey
#             "name": "forest_survey_best",
#             "model_file": "forest_survey_best.pt"
#         },
#         {
#             "id": 9,  # Construction Site Monitoring
#             "name": "construction_site_best",
#             "model_file": "construction_site_best.pt"
#         }
#     ]
    
#     with sqlite3.connect("videos.db") as conn:
#         cursor = conn.cursor()
        
#         print("Current models in database:")
#         cursor.execute("SELECT id, name, model_file FROM models WHERE created_by = 'system'")
#         current_models = cursor.fetchall()
#         for model in current_models:
#             print(f"ID: {model[0]}, Name: {model[1]}, File: {model[2]}")
        
#         print("\nUpdating model names to match file names...")
        
#         # Update each model name
#         for model in updated_models:
#             cursor.execute("""
#                 UPDATE models 
#                 SET name = ?
#                 WHERE id = ?
#             """, (model["name"], model["id"]))
            
#             print(f"Updated model ID {model['id']} to name: {model['name']}")
        
#         conn.commit()
#         print("\nUpdated models in database:")
#         cursor.execute("SELECT id, name, model_file FROM models WHERE created_by = 'system'")
#         updated = cursor.fetchall()
#         for model in updated:
#             print(f"ID: {model[0]}, Name: {model[1]}, File: {model[2]}")

# if __name__ == "__main__":
#     update_model_names()




# update_model_names.py
# fix_models_by_project_type.py
from database import exec_sql, q_all

UPDATES = [
    ("national_highway",     "national_highway_best",     "national_highway_best.pt"),
    ("river_monitoring",     "river_monitoring_best",     "river_monitoring_best.pt"),
    ("urban_infrastructure", "urban_infrastructure_best", "urban_infrastructure_best.pt"),
    ("forest_survey",        "forest_survey_best",        "forest_survey_best.pt"),
    ("construction_site",    "construction_site_best",    "construction_site_best.pt"),
]

def run():
    for pt, slug, fname in UPDATES:
        exec_sql("""
            UPDATE models
               SET name = :slug,
                   model_file = :fname
             WHERE project_type = :pt
        """, pt=pt, slug=slug, fname=fname)

    rows = q_all("SELECT id, project_type, name, model_file FROM models ORDER BY id")
    print("\nModels after fix:")
    for r in rows:
        print(f"ID={r['id']}, pt={r['project_type']}, name={r['name']}, file={r['model_file']}")

if __name__ == "__main__":
    run()



