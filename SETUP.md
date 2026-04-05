# VizardFree – Complete Setup Guide 🇮🇳🔥

> Open-source Vizard.ai clone optimized for Hindi, Hinglish & Indian creators.
> No watermark. No premium gate. 100% self-hosted.

---

## Table of Contents

1. [Requirements](#requirements)
2. [Quick Start (Docker – Recommended)](#quick-start)
3. [Manual Dev Setup](#manual-dev-setup)
4. [Model Downloads](#model-downloads)
5. [FFmpeg Setup](#ffmpeg-setup)
6. [Hindi Font Setup](#hindi-font-setup)
7. [Configuration Reference](#configuration)
8. [Keyboard Shortcuts](#keyboard-shortcuts)
9. [Folder Structure](#folder-structure)
10. [Troubleshooting](#troubleshooting)

---

## Requirements

| Dependency | Minimum | Recommended |
|-----------|---------|-------------|
| RAM | 8 GB | 16 GB |
| GPU | None (CPU mode) | NVIDIA 6GB VRAM |
| Disk | 10 GB | 30 GB |
| OS | Linux / macOS / Windows WSL2 | Ubuntu 22.04 |
| Docker | 24.0+ | latest |
| Docker Compose | 2.20+ | latest |
| Node.js (dev only) | 20 LTS | 20 LTS |
| Python (dev only) | 3.12 | 3.12 |

---

## Quick Start

### Step 1 – Clone the repo

```bash
git clone https://github.com/yourname/vizardfree.git
cd vizardfree
```

### Step 2 – Start all services

```bash
docker compose up -d --build
```

This will:
- Build the FastAPI backend (with FFmpeg, MediaPipe, faster-whisper)
- Build the Next.js frontend
- Start Redis queue
- Start the RQ worker (handles all processing)
- Start Nginx reverse proxy

### Step 3 – Open in browser

```
http://localhost:80
```

Or directly:
- Frontend: http://localhost:3000
- API:      http://localhost:8000/docs

### Step 4 – First run (Whisper model download)

The first time you process a video, faster-whisper will automatically
download the `large-v3` model (~3 GB). This happens inside the container.

To pre-download manually:

```bash
docker compose exec worker python -c "
from faster_whisper import WhisperModel
m = WhisperModel('large-v3', device='cpu', compute_type='int8', download_root='/data/models')
print('Model ready!')
"
```

---

## Manual Dev Setup

### Backend

```bash
cd backend

# Create virtualenv
python3.12 -m venv .venv
source .venv/bin/activate    # Linux/macOS
# .venv\Scripts\activate     # Windows

# Install deps
pip install -r requirements.txt

# Set environment
cp .env.example .env
# Edit .env: set UPLOAD_DIR, OUTPUT_DIR etc.

# Start Redis (separate terminal)
redis-server

# Run DB migrations
python -c "import asyncio; from database import init_db; asyncio.run(init_db())"

# Start API server
uvicorn main:app --reload --port 8000

# Start worker (separate terminal)
rq worker --url redis://localhost:6379/0 default high low
```

### Frontend

```bash
cd frontend

npm install

# Point to local API
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

npm run dev
```

---

## Model Downloads

### Whisper (Transcription)

VizardFree uses `faster-whisper` with the `large-v3` model for best Hindi accuracy.

Model is auto-downloaded to the `MODELS_DIR` (/data/models in Docker).

**For GPU (CUDA):**
```bash
# In .env or docker-compose.yml:
WHISPER_DEVICE=cuda
WHISPER_COMPUTE_TYPE=float16
```

**For CPU (default):**
```bash
WHISPER_DEVICE=cpu
WHISPER_COMPUTE_TYPE=int8
```

**Available model sizes (trade-off: accuracy vs speed):**

| Model | RAM | Hindi Quality | Speed |
|-------|-----|---------------|-------|
| tiny | 1 GB | Low | Very fast |
| base | 1 GB | Medium | Fast |
| small | 2 GB | Good | Moderate |
| medium | 5 GB | Very Good | Slow |
| large-v3 | 10 GB | **Best** | Slowest |

Change model in `docker-compose.yml`:
```yaml
WHISPER_MODEL=medium  # Change this
```

---

## FFmpeg Setup

FFmpeg is already installed inside the Docker containers.

For manual setup:

**Ubuntu/Debian:**
```bash
sudo apt update && sudo apt install -y ffmpeg
```

**macOS:**
```bash
brew install ffmpeg
```

**Windows:**
Download from https://ffmpeg.org/download.html and add to PATH.

**Verify:**
```bash
ffmpeg -version
ffprobe -version
```

### FFmpeg GPU Acceleration (Optional)

For faster exports with NVIDIA GPU:
```bash
# In docker-compose backend:
# Add --gpus all to docker run args (see docker-compose override)
```

---

## Hindi Font Setup

Hindi (Devanagari) subtitle support requires `Noto Sans Devanagari` fonts.

### Inside Docker (auto-installed)
The Dockerfile installs `fonts-noto` automatically via apt.

### Manual installation on Ubuntu:
```bash
sudo apt install -y fonts-noto fonts-noto-cjk fonts-noto-extra
fc-cache -fv  # Refresh font cache
```

### macOS:
```bash
brew install --cask font-noto-sans-devanagari
```

### Verify fonts are available:
```bash
fc-list | grep -i devanagari
# Should show:
# /usr/share/fonts/truetype/noto/NotoSansDevanagari-Regular.ttf: Noto Sans Devanagari:style=Regular
```

### Font used in subtitles:
When selecting "Hindi Cinema" or using Hindi subtitles, the app uses:
- `Noto Sans Devanagari` for Hindi/Devanagari text
- `Montserrat` / `Inter` for Roman/English text
- Hinglish (mixed) uses `Noto Sans Devanagari` as fallback

### Adding custom fonts:
1. Copy `.ttf`/`.otf` files to `/data/fonts/` (Docker volume) or `backend/fonts/`
2. Add font mapping to `backend/services/subtitle_renderer.py`:
```python
FONT_FILE_MAP["YourFont"] = "/data/fonts/YourFont-Regular.ttf"
```

---

## Configuration

### Environment Variables (Backend)

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `sqlite:////data/vizardfree.db` | Database URL |
| `REDIS_URL` | `redis://redis:6379/0` | Redis connection |
| `UPLOAD_DIR` | `/data/uploads` | Upload directory |
| `OUTPUT_DIR` | `/data/outputs` | Export output dir |
| `MODELS_DIR` | `/data/models` | Whisper model cache |
| `WHISPER_MODEL` | `large-v3` | Whisper model size |
| `WHISPER_DEVICE` | `auto` | `auto`/`cuda`/`cpu` |
| `WHISPER_COMPUTE_TYPE` | `int8` | `int8`/`float16`/`float32` |
| `MAX_UPLOAD_SIZE` | `2147483648` | Max upload in bytes (2GB) |
| `CORS_ORIGINS` | `http://localhost:3000` | Allowed CORS origins |

### Using PostgreSQL (instead of SQLite)

```env
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/vizardfree
```

Install driver:
```bash
pip install asyncpg
```

Add to docker-compose.yml:
```yaml
postgres:
  image: postgres:16-alpine
  environment:
    POSTGRES_DB: vizardfree
    POSTGRES_USER: vizard
    POSTGRES_PASSWORD: secret
  volumes:
    - postgres_data:/var/lib/postgresql/data
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Space` | Play / Pause video |
| `←` / `→` | Seek ±5 seconds |
| `Del` | Delete selected transcript word |
| `Ctrl+Z` | Restore deleted word |
| `Double-click word` | Edit word text inline |

---

## Folder Structure

```
vizardfree/
├── docker-compose.yml           # Full stack orchestration
├── SETUP.md                     # This file
│
├── backend/
│   ├── Dockerfile
│   ├── Dockerfile.worker
│   ├── requirements.txt
│   ├── main.py                  # FastAPI app
│   ├── config.py                # Settings
│   ├── database.py              # SQLAlchemy setup
│   ├── models/
│   │   ├── video.py             # Video ORM
│   │   └── clip.py              # Clip ORM
│   ├── routers/
│   │   ├── videos.py            # /api/videos routes
│   │   └── clips.py             # /api/clips routes
│   ├── services/
│   │   ├── transcription_service.py  # faster-whisper
│   │   ├── video_processing.py       # FFmpeg ops
│   │   ├── smart_framing.py          # MediaPipe face detection
│   │   ├── clip_engine.py            # AI viral clip detection
│   │   └── subtitle_renderer.py      # ASS subtitle burn-in
│   └── workers/
│       ├── tasks.py             # RQ background jobs
│       ├── youtube_task.py      # YouTube download job
│       └── queue.py             # RQ queue helper
│
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── next.config.mjs
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── app/
│   │   ├── layout.tsx           # Root layout
│   │   ├── page.tsx             # Dashboard (/)
│   │   ├── globals.css          # Dark theme CSS
│   │   ├── editor/[id]/page.tsx # Video editor
│   │   ├── clips/page.tsx       # Clip library
│   │   ├── brand/page.tsx       # Brand kit
│   │   ├── videos/page.tsx      # Videos list
│   │   └── settings/page.tsx    # Settings
│   ├── components/
│   │   ├── Providers.tsx        # React Query + Zustand
│   │   ├── layout/
│   │   │   └── Sidebar.tsx      # Navigation sidebar
│   │   ├── dashboard/
│   │   │   ├── VideoCard.tsx
│   │   │   ├── VideoCardSkeleton.tsx
│   │   │   └── UploadModal.tsx
│   │   └── editor/
│   │       ├── VideoPlayer.tsx       # Video + subtitle preview
│   │       ├── EditorTabs.tsx        # Tab switcher
│   │       ├── TranscriptPanel.tsx   # Descript-style editing
│   │       ├── SubtitleStudio.tsx    # Full subtitle styling
│   │       ├── ClipsPanel.tsx        # Clip management
│   │       ├── AspectRatioSelector.tsx
│   │       └── ExportPanel.tsx
│   └── lib/
│       ├── api.ts               # Axios API client
│       ├── store.ts             # Zustand global state
│       ├── types.ts             # TypeScript types
│       ├── i18n.ts              # Hindi/English translations
│       └── utils.ts             # cn() helper
│
└── nginx/
    └── nginx.conf               # Reverse proxy
```

---

## Troubleshooting

### "Model loading slow on first run"
Normal! The Whisper large-v3 model is ~3GB and downloads on first use.
Pre-download with the command in Step 4.

### "No face detected in smart framing"
- MediaPipe works best with clear, well-lit talking-head videos
- Falls back to center-crop automatically
- Use "Manual Crop" in aspect ratio settings for full control

### "Hindi subtitles showing as boxes / tofu"
Noto fonts not installed:
```bash
docker compose exec backend apt-get install -y fonts-noto fonts-noto-extra
docker compose exec backend fc-cache -fv
```

### "Video upload fails / 413 error"
Increase Nginx max body:
```nginx
client_max_body_size 2048M;
```
(Already set in provided nginx.conf)

### "Transcription wrong for Hinglish"
- Select `Hinglish` in the language dropdown before uploading
- Or update language after upload in the editor header
- For best results with Hinglish, the `large-v3` model is strongly recommended

### "RQ worker not picking up jobs"
```bash
docker compose restart worker
docker compose logs worker
```

### GPU not being used
```bash
# Check GPU is visible:
docker compose exec worker nvidia-smi

# Add to docker-compose.yml under worker service:
deploy:
  resources:
    reservations:
      devices:
        - driver: nvidia
          count: 1
          capabilities: [gpu]
```

---

## Contributing

PRs welcome! Key areas for contribution:
- Speaker diarization (pyannote.audio integration)
- Better Hinglish NLP (LLM-generated titles)
- Mobile app (React Native)
- Cloud storage (S3/GCS) adapter
- More subtitle animation effects

---

## License

MIT License – Free to use, modify, distribute.
No attribution required, but appreciated! 🙏

---

*Made with ❤️ for Indian creators. VizardFree – Apna video, apna style.*
