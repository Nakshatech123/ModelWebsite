
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()
url = os.getenv("DATABASE_URL")
print("Using:", url.split("@")[-1])
e = create_engine(url)
with e.connect() as c:
    print(c.execute(text("select version()")).scalar())
print("✅ SQLAlchemy + psycopg v3 OK")



