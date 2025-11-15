from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, EmailStr
from ..db import get_db_connection
from .hashing import hash_password, verify_password
from .jwt_handler import create_access_token
import httpx, os
from dotenv import load_dotenv
from .dependencies import verify_token

load_dotenv()

router = APIRouter(prefix="/api/auth", tags=["Auth"])

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")

# ----- Models -----
class RegisterModel(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str  # "tutor" or "learner"

class LoginModel(BaseModel):
    email: EmailStr
    password: str


# ----- Register -----
@router.post("/register")
async def register_user(data: RegisterModel):
    conn = await get_db_connection()

    # 1️⃣ Check if email already exists
    existing = await conn.fetchrow("SELECT * FROM users WHERE email = $1", data.email)
    if existing:
        await conn.close()
        raise HTTPException(status_code=400, detail="Email already registered")

    # 2️⃣ Hash password & insert user
    hashed_pw = hash_password(data.password)
    try:
        user = await conn.fetchrow(
            """
            INSERT INTO users (name, email, password, role)
            VALUES ($1, $2, $3, $4)
            RETURNING id, name, email, role
            """,
            data.name,
            data.email,
            hashed_pw,
            data.role,
        )
    except Exception as e:
        await conn.close()
        raise HTTPException(status_code=500, detail=f"Error creating user: {e}")

    if not user:
        await conn.close()
        raise HTTPException(status_code=500, detail="User creation failed — no record returned.")

    # 3️⃣ If tutor, auto-create a tutors table record
    if user["role"] == "tutor":
        try:
            await conn.execute(
                """
                INSERT INTO tutors (id, name, bio, skills, languages, available_time_slots)
                VALUES ($1, $2, '', ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[])
                """,
                user["id"],
                user["name"],
            )
        except Exception as e:
            # If tutor insert fails, delete the user to keep DB consistent
            await conn.execute("DELETE FROM users WHERE id = $1", user["id"])
            await conn.close()
            raise HTTPException(status_code=500, detail=f"Failed to create tutor profile: {e}")
    print("REGISTER PAYLOAD RECEIVED:", data.dict())


    await conn.close()
    return {"message": "User registered successfully"}



# ----- Login -----
@router.post("/login")
async def login_user(data: LoginModel):
    conn = await get_db_connection()
    user = await conn.fetchrow("SELECT * FROM users WHERE email=$1", data.email)
    await conn.close()
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"user_id": user["id"], "email": user["email"], "role": user["role"]})
    return {"access_token": token, "user": {"id": user["id"], "email": user["email"], "name": user["name"], "role": user["role"]}}


# ----- Google OAuth -----
@router.get("/google/login")
async def google_login():
    google_auth_url = (
        "https://accounts.google.com/o/oauth2/v2/auth"
        "?response_type=code"
        f"&client_id={GOOGLE_CLIENT_ID}"
        f"&redirect_uri={GOOGLE_REDIRECT_URI}"
        "&scope=openid%20email%20profile"
    )
    return {"auth_url": google_auth_url}

@router.get("/google/callback")
async def google_callback(request: Request):
    code = request.query_params.get("code")
    if not code:
        raise HTTPException(status_code=400, detail="Missing code")

    async with httpx.AsyncClient() as client:
        token_res = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uri": GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            },
        )
        token_json = token_res.json()
        access_token = token_json.get("access_token")

        user_info_res = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        user_info = user_info_res.json()

    conn = await get_db_connection()
    user = await conn.fetchrow("SELECT * FROM users WHERE email=$1", user_info["email"])
    if not user:
        user = await conn.fetchrow(
            "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *",
            user_info["name"], user_info["email"], ""
        )
    await conn.close()

    token = create_access_token({"user_id": user["id"], "email": user["email"]})
    return {"access_token": token, "user": {"id": user["id"], "email": user["email"], "name": user["name"]}}

@router.get("/protected")
async def protected_route(payload: dict = Depends(verify_token)):
    return {"message": f"Hello, {payload['email']}! You are authorized"}