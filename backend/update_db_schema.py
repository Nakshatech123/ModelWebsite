# import sqlite3

# def update_models_table():
#     """Add project_type column to existing models table"""
#     with sqlite3.connect("videos.db") as conn:
#         cursor = conn.cursor()
        
#         # Check if project_type column exists
#         cursor.execute("PRAGMA table_info(models)")
#         columns = [column[1] for column in cursor.fetchall()]
        
#         if 'project_type' not in columns:
#             # Add project_type column
#             cursor.execute("ALTER TABLE models ADD COLUMN project_type TEXT")
#             print("Added project_type column to models table")
#         else:
#             print("project_type column already exists")
        
#         # Clear existing data to start fresh
#         cursor.execute("DELETE FROM models WHERE created_by = 'system'")
#         print("Cleared existing system models")
        
#         conn.commit()

# if __name__ == "__main__":
#     update_models_table()




# update_db_schema.py
from database import q_all, exec_sql, q_one

def ensure_column():
    # check existence via information_schema
    col = q_one("""
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema='public' AND table_name='models' AND column_name='project_type'
    """)
    if not col:
        exec_sql("ALTER TABLE models ADD COLUMN project_type text")
        print("Added project_type column to models table")
    else:
        print("project_type column already exists")

def clear_system_models():
    exec_sql("DELETE FROM models WHERE created_by = 'system'")
    print("Cleared existing system models")

if __name__ == "__main__":
    ensure_column()
    clear_system_models()





