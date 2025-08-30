import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()
engine = create_engine(os.environ["DATABASE_URL"], pool_pre_ping=True)

DDL = [
    # --- USERS ---
    """
    CREATE TABLE IF NOT EXISTS users (
        id           BIGSERIAL PRIMARY KEY,
        email        TEXT UNIQUE NOT NULL,
        password     TEXT,
        profile_data JSONB DEFAULT '{}'::jsonb,
        settings_data JSONB DEFAULT '{}'::jsonb,
        created_at   TIMESTAMPTZ DEFAULT now()
    );
    """,

    # --- VIDEOS ---
    """
    CREATE TABLE IF NOT EXISTS videos (
        id              BIGSERIAL PRIMARY KEY,
        email           TEXT,
        filename        TEXT NOT NULL,
        timeline_data   JSONB,
        upload_date     TIMESTAMPTZ DEFAULT now(),
        model_used      TEXT,
        has_metrics     BOOLEAN DEFAULT FALSE,
        share_id        TEXT
    );
    """,

    # add columns defensively in case table exists but columns don’t:
    "ALTER TABLE videos ADD COLUMN IF NOT EXISTS id BIGSERIAL;",
    "ALTER TABLE videos ADD COLUMN IF NOT EXISTS timeline_data JSONB;",
    "ALTER TABLE videos ADD COLUMN IF NOT EXISTS upload_date TIMESTAMPTZ DEFAULT now();",
    "ALTER TABLE videos ADD COLUMN IF NOT EXISTS model_used TEXT;",
    "ALTER TABLE videos ADD COLUMN IF NOT EXISTS has_metrics BOOLEAN DEFAULT FALSE;",
    "ALTER TABLE videos ADD COLUMN IF NOT EXISTS share_id TEXT;",

    # --- MODELS ---
    """
    CREATE TABLE IF NOT EXISTS models (
        id                BIGSERIAL PRIMARY KEY,
        name              TEXT NOT NULL,
        description       TEXT,
        category          TEXT,
        project_type      TEXT,
        detection_classes TEXT,
        model_file        TEXT,
        created_by        TEXT,
        created_at        TIMESTAMPTZ DEFAULT now()
    );
    """,
]

def main():
    with engine.begin() as conn:
        for stmt in DDL:
            conn.execute(text(stmt))
    print("✅ Migration complete.")

if __name__ == "__main__":
    main()
