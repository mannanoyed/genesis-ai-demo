import os
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

# Load environment variables (.env only exists locally; Railway uses env vars directly)
load_dotenv(Path(__file__).parent / ".env")

from database.db import init_db
from services.rag_service import seed_vector_db
from routers import chat, transcribe, tts, leads, vehicles

# Path to the built React frontend (../frontend/dist)
FRONTEND_DIST = Path(__file__).parent.parent / "frontend" / "dist"


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    print("Starting Genesis AI Backend...")

    # Initialize SQLite database
    init_db()

    # Seed vector database if needed
    try:
        seed_vector_db()
    except Exception as e:
        print(f"Warning: Could not seed vector DB: {e}")
        print("Run 'python scripts/seed_vectordb.py' manually to seed the database.")

    print("Genesis AI Backend ready!")
    yield
    print("Shutting down Genesis AI Backend...")


app = FastAPI(
    title="Genesis AI Showroom API",
    description="Backend API for the Genesis AI Voice Chatbot Showroom Demo",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow all origins in production (Railway assigns dynamic URLs)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(chat.router, prefix="/api", tags=["Chat"])
app.include_router(transcribe.router, prefix="/api", tags=["STT"])
app.include_router(tts.router, prefix="/api", tags=["TTS"])
app.include_router(leads.router, prefix="/api", tags=["Leads"])
app.include_router(vehicles.router, prefix="/api", tags=["Vehicles"])


@app.get("/health")
async def health():
    return {"status": "healthy"}


# Serve React frontend static assets (JS, CSS, images)
if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="assets")

    # Catch-all: serve index.html for any non-API route (React Router)
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str, request: Request):
        index = FRONTEND_DIST / "index.html"
        if index.exists():
            return FileResponse(str(index))
        return {"error": "Frontend not built. Run: cd frontend && npm run build"}
else:
    @app.get("/")
    async def root():
        return {
            "message": "Genesis AI API is running. Frontend not built yet.",
            "docs": "/docs",
            "hint": "Run: cd frontend && npm run build",
        }
