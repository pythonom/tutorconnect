from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from ..db import get_db_connection
from ..auth.dependencies import verify_token
from datetime import datetime

router = APIRouter(prefix="/api/sessions", tags=["Sessions"])

# ----- Models -----
class SessionCreate(BaseModel):
    tutor_id: int
    subject: str
    scheduled_at: str
    duration_minutes: int
    session_type: str  # e.g. "online" or "offline"
    notes: str | None = None

# ----- Learner Books a Session -----
@router.post("/book")
async def book_session(data: SessionCreate, payload: dict = Depends(verify_token)):
    user_id = payload["user_id"]
    role = payload["role"]

    if role != "learner":
        raise HTTPException(status_code=403, detail="Only learners can book sessions")

    conn = None
    try:
        conn = await get_db_connection()

        # Convert scheduled time safely
        try:
            scheduled_dt = datetime.fromisoformat(data.scheduled_at)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid datetime format for 'scheduled_at'")

        day_of_week = scheduled_dt.strftime("%A").lower()

        print(f"\n📅 [DEBUG] Booking attempt: Tutor ID={data.tutor_id}, Day={day_of_week}")
        print(f"🕒 [DEBUG] Scheduled for: {scheduled_dt}")

        # Fetch tutor availability (non-blocking)
        availability = await conn.fetch(
            "SELECT day_of_week FROM availability WHERE tutor_id = $1",
            data.tutor_id
        )

        print(f"🗓️ [DEBUG] Tutor availability records: {availability}")

        # ----- Handle optional availability -----

# Convert availability rows into valid day list
        valid_availability = []
        
        for a in availability:
            day = a["day_of_week"]
            if day and isinstance(day, str) and day.strip() != "":
                valid_availability.append(day.lower())
        
        # If tutor has valid days → restrict
        if len(valid_availability) > 0:
            print(f"Tutor valid available days: {valid_availability}")
        
            if day_of_week not in valid_availability:
                await conn.close()
                raise HTTPException(
                    status_code=400,
                    detail=f"Tutor is not available on {day_of_week.capitalize()}"
                )
        
        # If no valid availability → tutor is available all week
        else:
            print("No valid availability — tutor available all week")



        # ✅ Insert new session
        await conn.execute(
            """
            INSERT INTO sessions (
                tutor_id, learner_id, subject, scheduled_at,
                duration_minutes, session_type, notes, status
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
            """,
            data.tutor_id, user_id, data.subject, scheduled_dt,
            data.duration_minutes, data.session_type, data.notes,
        )

        print("✅ [DEBUG] Session booking inserted successfully!\n")
        return {"message": "Session booked successfully"}

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

    finally:
        await conn.close()


    
# ----- Get Learner's Sessions -----
@router.get("/me")
async def get_my_sessions(payload: dict = Depends(verify_token)):
    user_id = payload["user_id"]
    role = payload["role"]

    conn = await get_db_connection()

    if role == "learner":
        rows = await conn.fetch(
            """
            SELECT s.*, u.name AS tutor_name, u.email AS tutor_email
            FROM sessions s
            JOIN users u ON s.tutor_id = u.id
            WHERE s.learner_id = $1
            ORDER BY s.scheduled_at DESC
            """,
            user_id,
        )
    elif role == "tutor":
        rows = await conn.fetch(
            """
            SELECT s.*, u.name AS learner_name, u.email AS learner_email
            FROM sessions s
            JOIN users u ON s.learner_id = u.id
            WHERE s.tutor_id = $1
            ORDER BY s.scheduled_at DESC
            """,
            user_id,
        )
    else:
        await conn.close()
        raise HTTPException(status_code=403, detail="Invalid role")

    await conn.close()
    return [dict(row) for row in rows]


@router.put("/{session_id}")
async def update_session_status(session_id: int, status: str, payload: dict = Depends(verify_token)):
    user_id = payload["user_id"]

    conn = await get_db_connection()
    session = await conn.fetchrow("SELECT * FROM sessions WHERE id=$1", session_id)
    if not session:
        await conn.close()
        raise HTTPException(status_code=404, detail="Session not found")

    # Tutors can confirm/complete, learners can cancel
    if user_id not in [session["tutor_id"], session["learner_id"]]:
        await conn.close()
        raise HTTPException(status_code=403, detail="Not authorized for this session")
    
    await conn.execute(
        "UPDATE sessions SET status=$1, updated_at=NOW() WHERE id=$2",
        status, session_id
    )
    await conn.close()
    return {"message": "Session status updated"}

@router.get("/tutor")
async def get_tutor_sessions(payload: dict = Depends(verify_token)):
    if payload["role"] != "tutor":
        raise HTTPException(status_code=403, detail="Access denied")

    tutor_id = payload["user_id"]
    conn = await get_db_connection()
    sessions = await conn.fetch("""
        SELECT s.*, 
               u.name AS learner_name
        FROM sessions s
        JOIN users u ON s.learner_id = u.id
        WHERE s.tutor_id = $1
        ORDER BY s.created_at DESC
    """, tutor_id)
    await conn.close()
    return [dict(row) for row in sessions]

