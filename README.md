# Genesis AI Showroom Voice Chatbot

A fully functional luxury automotive AI voice chatbot demo for Genesis Motors (UAE/Dubai showrooms). Built for BANAO Technologies to pitch to Genesis/Innocean.

## Features

- **Voice-first AI concierge** — Speak naturally, get intelligent responses
- **RAG-powered knowledge base** — All 9 Genesis vehicles + brand FAQ embedded in ChromaDB
- **Premium luxury UI** — Genesis brand colors, animations, tablet-optimized
- **Arabic + English** — Full bilingual support with language toggle
- **Customer profiling** — Real-time intent scoring and lead categorization
- **Lead capture** — Inline form that feels natural in conversation
- **9 Genesis vehicles** — Full specs, pricing, comparisons

## Quick Start

### 1. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
pip install -r requirements.txt
python scripts/seed_vectordb.py    # Load Genesis data into ChromaDB
uvicorn main:app --reload --port 8000
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev    # Opens at http://localhost:5173
```

### 3. Open

Visit [http://localhost:5173](http://localhost:5173) on a tablet or desktop in landscape mode.

## Environment Variables

**Backend (`backend/.env`):**
```
OPENAI_API_KEY=sk-...
TTS_PROVIDER=openai           # or "elevenlabs"
ELEVENLABS_API_KEY=           # optional
ELEVENLABS_VOICE_ID=          # optional
CHROMA_PERSIST_DIR=./chroma_db
```

## Architecture

```
Browser (React/Vite)
    │
    ├─ Voice Input (MediaRecorder API)
    │       ↓
    │   POST /api/transcribe  (Whisper STT)
    │       ↓
    │   POST /api/chat        (GPT-4o + ChromaDB RAG)
    │       ↓
    │   POST /api/tts         (OpenAI TTS or ElevenLabs)
    │       ↓
    └─ Audio Playback + UI Update
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/transcribe` | Audio → text (Whisper) |
| POST | `/api/chat` | Text → AI response + profile |
| POST | `/api/tts` | Text → speech audio stream |
| POST | `/api/lead` | Save customer lead |
| GET | `/api/vehicles` | All Genesis vehicles |
| GET | `/api/vehicles/{id}` | Single vehicle specs |
| GET | `/api/leads` | All leads (admin) |

## Demo Scenarios

The AI handles all 7 client-specified scenarios:
1. Casual browser → warm, non-pushy engagement
2. V8 question → educated brand-positive response
3. Family buyer → GV80 3-row recommendation
4. Performance seeker → G70/GV60 Performance
5. Competitor comparison → respectful Genesis advantages
6. High-intent → test drive nudge
7. Arabic speaker → full Arabic response

## Tech Stack

**Backend:** FastAPI, OpenAI GPT-4o, Whisper, ChromaDB, LangChain, SQLite  
**Frontend:** React + Vite, TailwindCSS, Framer Motion, Axios  
**Voice:** Browser MediaRecorder API → Whisper STT → GPT-4o → OpenAI TTS (HD)

---

*Built by BANAO Technologies for Genesis/Innocean*
