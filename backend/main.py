from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .db import init_db
from .auth import routes as auth_routes
from .routes import sessions
from .reviews import routes as review_routes
from .tutors import routes as tutor_routes

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://ddtutorconnect.netlify.app/",
]

app = FastAPI(title="Aarambhthon Backend")

app.include_router(auth_routes.router)
app.include_router(sessions.router)
app.include_router(review_routes.router)
app.include_router(tutor_routes.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Change to your frontend URL in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    await init_db()


@app.get("/")
async def root():
    return {"message": "Backend running successfully!"}
