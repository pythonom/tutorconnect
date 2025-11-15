from fastapi import APIRouter, Depends, HTTPException
from ..db import get_db_connection
from pydantic import BaseModel
from ..auth.dependencies import verify_token
from datetime import datetime

router = APIRouter(prefix="/api/tutors", tags=["Tutors"])

class TutorUpdate(BaseModel):
    bio: str | None = None
    skills: list[str] | None = None

class Availability(BaseModel):
    day_of_week: str
    start_time: str
    end_time: str

@router.put("/profile")
async def update_profile(data: TutorUpdate, payload: dict = Depends(verify_token)):
    user_id = payload["user_id"]
    role = payload["role"]

    if role != "tutor":
        raise HTTPException(status_code=403, detail="Only tutors can edit their profile") 
    
    conn = await get_db_connection()
    await conn.execute(
        """
        UPDATE tutors
        SET bio=$1, skills=$2
        WHERE id=$3
        """,
        data.bio,
        data.skills,
        user_id,
    )

    await conn.close()
    return {"message": "profile updated successfully"}

@router.post("/availability")
async def add_availability(
    data: Availability,
    payload: dict = Depends(verify_token)
):
    if payload["role"] != "tutor":
        raise HTTPException(status_code=403, detail="Only tutors can add availability")

    tutor_id = payload["user_id"]
    conn = await get_db_connection()
    try:
        start = datetime.strptime(data.start_time, "%H:%M").time()
        end = datetime.strptime(data.end_time, "%H:%M").time()
        await conn.execute(
            """
            INSERT INTO availability (tutor_id, day_of_week, start_time, end_time)
            VALUES ($1, $2, $3, $4)
            """,
            tutor_id, data.day_of_week, start, end
        )
    except Exception as e:
        await conn.close()
        raise HTTPException(status_code=500, detail=str(e))

    await conn.close()
    return {"message": "Availability added"}

# ----- Get All Tutors -----
@router.get("/")
async def get_all_tutors():
    conn = await get_db_connection()
    rows = await conn.fetch("""
        SELECT 
            t.id,
            t.name,
            t.bio,
            t.skills,
            t.languages,
            t.available_time_slots
        FROM tutors t
        ORDER BY t.id ASC
    """)
    await conn.close()
    return [dict(r) for r in rows]


@router.get("/{tutor_id}/availability")
async def get_tutor_availability(tutor_id: int):
    conn = await get_db_connection()
    rows = await conn.fetch(
        """
        SELECT * FROM availability
        WHERE tutor_id = $1
        ORDER BY day_of_week, start_time
        """,
        tutor_id
    )
    await conn.close()
    return [dict(r) for r in rows]

@router.get("/{tutor_id}")
async def get_tutor_profile(tutor_id: int):
    conn = await get_db_connection()
    row = await conn.fetchrow(
        """
        SELECT id, name, bio, skills, languages, available_time_slots
        FROM tutors
        WHERE id = $1
        """,
        tutor_id
    )
    await conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Tutor profile not found")

    return dict(row)
