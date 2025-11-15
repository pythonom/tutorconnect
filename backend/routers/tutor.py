from fastapi import APIRouter, HTTPException
from ..db import get_db_connection
from ..schemas import TutorCreate, TutorResponse

router = APIRouter(prefix="/tutors", tags=["Tutors"])

@router.post("/", response_model=TutorResponse)
async def create_tutor(tutor: TutorCreate):
    conn = await get_db_connection()
    query = """
    INSERT INTO tutors (name, bio, languages, available_time_slots)
    VALUES ($1, $2, $3, $4)
    RETURNING id, name, bio, languages, available_time_slots;
    """
    row = await conn.fetchrow(query, tutor.name, tutor.bio, tutor.languages, tutor.available_time_slots)
    await conn.close()
    return dict(row)

@router.get("/", response_model=list[TutorResponse])
async def get_tutors():
    conn = await get_db_connection()
    rows = await conn.fetch("SELECT * FROM tutors ORDER BY id DESC;")
    await conn.close()
    return [dict(r) for r in rows]
