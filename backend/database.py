# # backend/database.py
# import os
# import psycopg2
# from dotenv import load_dotenv

# load_dotenv()

# DATABASE_URL = os.getenv("DATABASE_URL")

# def get_connection():
#     return psycopg2.connect(DATABASE_URL)


# backend/database.py


# backend/database.py
# database.py (unchanged if you used my earlier version)
# database.py


import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
load_dotenv()
engine = create_engine(os.environ["DATABASE_URL"], pool_pre_ping=True)

def q_one(sql, **p):
    with engine.connect() as c:
        r = c.execute(text(sql), p).mappings().first()
        return dict(r) if r else None

def q_all(sql, **p):
    with engine.connect() as c:
        r = c.execute(text(sql), p).mappings().all()
        return [dict(x) for x in r]

def exec_sql(sql, **p):
    with engine.begin() as c:
        c.execute(text(sql), p)
