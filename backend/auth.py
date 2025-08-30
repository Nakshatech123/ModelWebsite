# from fastapi import APIRouter, HTTPException, status, Depends
# from pydantic import BaseModel, EmailStr, constr
# from passlib.hash import bcrypt
# import sqlite3
# from auth_utils import create_access_token, get_current_user

# router = APIRouter()

# # --- Configuration ---
# SHARED_SECRET = "Nakshatech"
# DB_PATH = "users.db"

# # --- Pydantic Models ---
# class RegisterUser(BaseModel):
#     email: EmailStr
#     password: constr(min_length=6)
#     secret: str  # required for registration only

# class LoginUser(BaseModel):
#     email: EmailStr
#     password: constr(min_length=6)

# # --- Database Setup ---
# def create_user_table():
#     """Ensures the users table exists in the database."""
#     with sqlite3.connect(DB_PATH) as conn:
#         conn.execute(
#             """CREATE TABLE IF NOT EXISTS users (
#                 email TEXT PRIMARY KEY, 
#                 password TEXT,
#                 profile_data TEXT DEFAULT '{}',
#                 settings_data TEXT DEFAULT '{}',
#                 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
#             )"""
#         )
        
#         # Add missing columns if table already existed
#         for column_def in [
#             "profile_data TEXT DEFAULT '{}'",
#             "settings_data TEXT DEFAULT '{}'",
#             "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
#         ]:
#             try:
#                 conn.execute(f"ALTER TABLE users ADD COLUMN {column_def}")
#             except sqlite3.OperationalError:
#                 pass  # Already exists

# create_user_table()

# # --- API Routes ---

# @router.post("/register")
# def register(user: RegisterUser):
#     """Handles new user registration."""
#     if user.secret != SHARED_SECRET:
#         raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid shared key.")
    
#     hashed_pw = bcrypt.hash(user.password)
#     try:
#         with sqlite3.connect(DB_PATH) as conn:
#             conn.execute(
#                 "INSERT INTO users (email, password) VALUES (?, ?)", 
#                 (user.email, hashed_pw)
#             )
#     except sqlite3.IntegrityError:
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST, 
#             detail="User with this email already exists."
#         )
    
#     return {"status": "success", "message": "Registered successfully."}

# @router.post("/login")
# def login(user: LoginUser):
#     """Handles user login and returns an access token."""
#     with sqlite3.connect(DB_PATH) as conn:
#         cur = conn.cursor()
#         cur.execute("SELECT password FROM users WHERE email = ?", (user.email,))
#         record = cur.fetchone()

#         if not record or not bcrypt.verify(user.password, record[0]):
#             raise HTTPException(
#                 status_code=status.HTTP_401_UNAUTHORIZED, 
#                 detail="Invalid email or password."
#             )

#     access_token = create_access_token(data={"sub": user.email})

#     return {
#         "status": "success",
#         "message": "Login successful.",
#         "access_token": access_token,
#         "token_type": "bearer",
#         # "email": user.email
#     }
# @router.get("/me")
# def read_users_me(current_user: str = Depends(get_current_user)):
#     """A protected route to validate a token and get the current user's email."""
#     return {"email": current_user}


# auth.py
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr, constr
from passlib.hash import bcrypt
from database import q_one, exec_sql
from auth_utils import create_access_token, get_current_user

router = APIRouter()

# --- Schemas that match your form ---
class RegisterUser(BaseModel):
    email: EmailStr
    password: constr(min_length=6)

class LoginUser(BaseModel):
    email: EmailStr
    password: constr(min_length=6)

# --- Routes ---
@router.post("/register")
def register(user: RegisterUser):
    # already exists?
    if q_one("SELECT 1 AS x FROM users WHERE email=:e", e=user.email):
        raise HTTPException(status_code=400, detail="User with this email already exists.")

    hashed = bcrypt.hash(user.password)

    exec_sql("""
        INSERT INTO users (email, password, profile_data, settings_data, created_at)
        VALUES (:e, :p, '{}'::jsonb, '{}'::jsonb, now())
    """, e=user.email, p=hashed)

    return {"status": "success", "message": "Registered successfully."}

@router.post("/login")
def login(user: LoginUser):
    row = q_one("SELECT password FROM users WHERE email=:e", e=user.email)
    if not row or not bcrypt.verify(user.password, row["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    token = create_access_token({"sub": user.email})
    return {
        "status": "success",
        "message": "Login successful.",
        "access_token": token,
        "token_type": "bearer",
        "email": user.email,
    }

@router.get("/me")
def me(current_user: str = Depends(get_current_user)):
    return {"email": current_user}
