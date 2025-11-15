from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from ..db import get_db_connection
from ..auth.dependencies import verify_token

router = APIRouter(prefix="/api/reviews", tags=["Reviews"])

class ReviewModel(BaseModel):
    session_id: int
    tutor_id: int
    rating: int
    comment: str | None = None

@router.post("/")
async def add_review(data: ReviewModel, payload: dict = Depends(verify_token)):
    if payload["role"] != "learner":
        raise HTTPException(status_code=403, detail="Only learners can leave reviews")

    learner_id = payload["user_id"]
    conn = await get_db_connection()

    # Check if already reviewed
    existing = await conn.fetchrow(
        "SELECT id FROM reviews WHERE session_id=$1 AND learner_id=$2",
        data.session_id, learner_id
    )
    if existing:
        await conn.close()
        raise HTTPException(status_code=400, detail="You have already reviewed this session")

    await conn.execute(
        """
        INSERT INTO reviews (session_id, tutor_id, learner_id, rating, comment)
        VALUES ($1, $2, $3, $4, $5)
        """,
        data.session_id, data.tutor_id, learner_id, data.rating, data.comment
    )
    await conn.close()
    return {"message": "Review submitted successfully"}

@router.get("/tutor/{tutor_id}")
async def get_tutor_reviews(tutor_id: int):
    conn = await get_db_connection()
    reviews = await conn.fetch("""
        SELECT r.*, u.name AS learner_name
        FROM reviews r
        JOIN users u ON r.learner_id = u.id
        WHERE r.tutor_id = $1
        ORDER BY r.created_at DESC
    """, tutor_id)
    await conn.close()
    return [dict(row) for row in reviews]
