# import sqlite3

# # Check users.db
# conn = sqlite3.connect('users.db')
# cursor = conn.cursor()

# print("=== Database Tables ===")
# cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
# tables = cursor.fetchall()
# print("Tables:", tables)

# print("\n=== Videos Table ===")
# try:
#     cursor.execute("SELECT COUNT(*) FROM videos")
#     count = cursor.fetchone()[0]
#     print(f"Total videos in DB: {count}")
    
#     cursor.execute("SELECT * FROM videos LIMIT 5")
#     videos = cursor.fetchall()
#     print("Sample videos:", videos)
# except Exception as e:
#     print(f"Error accessing videos table: {e}")

# print("\n=== Users Table ===")
# try:
#     cursor.execute("SELECT COUNT(*) FROM users")
#     user_count = cursor.fetchone()[0]
#     print(f"Total users in DB: {user_count}")
# except Exception as e:
#     print(f"Error accessing users table: {e}")

# conn.close()


from database import q_all, q_one

def run():
    print("=== Database Tables (public schema) ===")
    tables = q_all("""
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name
    """)
    print("Tables:", [t["table_name"] for t in tables])

    print("\n=== Videos Table ===")
    try:
        c = q_one("SELECT COUNT(*) AS c FROM videos")
        print(f"Total videos in DB: {c['c']}")
        sample = q_all("""
            SELECT id, email, filename, upload_date, has_metrics
            FROM videos
            ORDER BY upload_date DESC
            LIMIT 5
        """)
        print("Sample videos:", sample)
    except Exception as e:
        print(f"Error accessing videos table: {e}")

    print("\n=== Users Table ===")
    try:
        c = q_one("SELECT COUNT(*) AS c FROM users")
        print(f"Total users in DB: {c['c']}")
    except Exception as e:
        print(f"Error accessing users table: {e}")

if __name__ == "__main__":
    run()
