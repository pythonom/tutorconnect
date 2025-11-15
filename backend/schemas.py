from pydantic import BaseModel
from typing import List, Optional

class TutorCreate(BaseModel):
    name: str
    bio: Optional[str] = None
    languages: List[str]
    available_time_slots: List[str]

class TutorResponse(TutorCreate):
    id: int
