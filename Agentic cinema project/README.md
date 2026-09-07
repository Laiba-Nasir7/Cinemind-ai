# 🎬 CineMind AI: Autonomous Pre-Production & Script Intelligence Engine

> **Agentic Cinema: The Blockbuster Hackathon — 1st Place Submission**  
> *Transforming raw film screenplays into production-ready studio bibles, financial budget forecasts, shot-by-shot visual storyboards, and executive greenlight pitch packages using Google Gemini Multi-Agent Orchestration.*

---

## 🌟 Executive Summary

In traditional filmmaking, pre-production planning—script breakdown, scene tagging, resource budgeting, stunt safety compliance, shot listing, and pitch deck generation—takes weeks of labor across multiple departments (Line Producers, Assistant Directors, Concept Artists, and Studio Executives).

**CineMind AI** is a production-grade, full-stack AI Agent application built in **Python (Flask)** that automates the entire pre-production bible workflow in seconds. Powered by **Google Gemini 2.5** structured JSON outputs, CineMind orchestrates a swarm of four specialized AI sub-agents to analyze film screenplays, calculate line-item production budgets, assess risk factors, generate Midjourney/Imagen camera prompts, and deliver a greenlight pitch deck.

---

## 🚀 High-Impact Standout Features

### 1. 🤖 7-Agent Autonomous Swarm Pipeline
CineMind deploys an autonomous swarm of seven specialized sub-agents coordinating in a sequential and debate-driven pipeline:
- 📄 **Script Breakdown Agent**: Decomposes screenplay sluglines (`INT.`/`EXT.`), extracts main character rosters, tracks dialogue line counts, identifies prop dependencies, and calculates shooting durations.
- 💰 **Budget & Resource Forecasting Agent**: Itemizes production costs across 6 categories (Cast, Location Permits, Stunts/VFX, Gear, Props, Post-Production), estimates set crew headcount, and generates a risk matrix.
- 🎨 **Visual Storyboard & Camera Director Agent**: Translates narrative action into shot-by-shot camera mechanics (Wide, Medium Push-in, Extreme Close-Up), camera movement specs, lighting swatches, and Midjourney v6 / Imagen 3 prompts.
- 🎭 **AI Casting Director & Star Attachment Agent**: Scouts premier real-world Hollywood & international talent, calculates Character-Actor Match Scores (0-100%), forecasts SAG talent quote fees, analyzes comp reference roles, and suggests prestige indie alternatives.
- 🧬 **Script DNA & Narrative Arc Agent**: Formulates emotional tension trajectories (0-10), narrative pacing velocity (BPM), dialogue-to-action density balance, emotional chromatics, and three-act dramatic turning points.
- ⚔️ **Studio Greenlight War Room Debate Agent**: Simulates an autonomous high-stakes debate between a Visionary Director (demanding artistic scale, practical stunts) and a Studio CFO Line Producer (demanding tax credits, budget discipline), ending in a verified Greenlight Consensus.
- 🎬 **Executive Pitch Deck Agent**: Synthesizes narrative, visual, and financial intelligence into a commercial logline, synopsis, box office comps, target audience demographic, and greenlight executive pitch.

### 2. ⚡ Google Gemini Multimodal & Structured Output
- Leverages Gemini's `response_mime_type="application/json"` with strict **Pydantic** data schemas (`ScriptBreakdownResult`, `ResourceForecastResult`, `VisualStoryboardResult`, `CastingResult`, `ScriptDNAResult`, `StudioDebateResult`, `ExecutivePitchResult`, `GrafanaTelemetryMetrics`).
- Handles uploaded screenplays in `.txt`, `.pdf` (PyPDF), and `.docx` (python-docx) formats or raw text inputs.
- Built-in **Keyless Demo Mode** allowing judges to test the full multi-agent pipeline immediately without bringing their own API key!

### 3. 🌐 Dual Partner Track Eligibility
- ☁️ **Replit Track**: Fully configured for 1-click cloud deployment with `.replit`, `replit.nix`, `wsgi.py`, `main.py`, and `gunicorn` production server settings.
- 📊 **Grafana Observability Track**: Integrated studio telemetry observability (`/api/telemetry/grafana`), exporting real-time Prometheus-compatible metrics on agent swarm latency, token velocity, budget variance, and SAG safety compliance.

### 4. 🎨 Interactive Director's Visual Studio
- **Director's Lens & Aspect Ratio Switcher**: Live switching between 2.39:1 Anamorphic Cinemascope, 1.85:1 Flat, 1.43:1 IMAX 70mm, and 4:3 Academy.
- **Cinematic Color Grading Lens Filters**: Live CSS optical filter simulator for *Teal & Orange*, *Technicolor 3-Strip*, *Bleach Bypass (Fincher)*, and *Film Noir*.
- **Hollywood Trailer Voiceover Audition**: 1-click theatrical movie trailer narration synthesizing loglines in authentic movie trailer style.

### 5. 📄 Professional PDF Studio Bible Exporter
- **ReportLab PDF Engine**: 1-click backend PDF compiler generating a multi-page production bible featuring title page, executive summary, scene breakdown tables, budget itemizations, visual storyboards, casting attachments, and the studio war room consensus.

---

## 🏗️ System Architecture

```
 ┌───────────────────────────────────────────────────────────────────────────────────────┐
 │                                   CineMind AI Web UI                                  │
 │        (Dark Obsidian Interface, Style Customizer, Script Doctor, Chart.js)          │
 └──────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ (HTTP POST / SSE Event Stream)
                                            ▼
 ┌───────────────────────────────────────────────────────────────────────────────────────┐
 │                                 Flask Backend Web Server                              │
 │                 (Endpoints: /api/stream, /api/analyze, /api/export/pdf)                │
 └──────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                                            ▼
 ┌───────────────────────────────────────────────────────────────────────────────────────┐
 │                            AgentOrchestrator Coordinator                              │
 │           (Receives Script, Visual Style & Script Doctor Directives)                  │
 └──────┬───────────────────────┬───────────────────────┬───────────────────────┬────────┘
        │                       │                       │                       │
        ▼                       ▼                       ▼                       ▼
 ┌──────────────┐        ┌──────────────┐        ┌──────────────┐        ┌──────────────┐
 │ Script       │        │ Budget &     │        │ Visual       │        │ Executive    │
 │ Breakdown    │        │ Logistics    │        │ Storyboard   │        │ Pitch Deck   │
 │ Agent        │        │ Agent        │        │ Agent        │        │ Agent        │
 └──────┬───────┘        └──────┬───────┘        └──────┬───────┘        └──────┬───────┘
        │                       │                       │                       │
        └───────────────────────┴───────────┬───────────┴───────────────────────┘
                                            │
                                            ▼
                         ┌─────────────────────────────────────┐
                         │      Google Cloud Gemini 2.5 API    │
                         │   (SDK: google-genai, Pydantic)     │
                         └─────────────────────────────────────┘
```

---

## 📂 Repository File Structure

```
.
├── app.py                      # Flask Backend Server (Endpoints & SSE Streams)
├── main.py                     # Entrypoint Script
├── wsgi.py                     # Production WSGI Gunicorn Configuration
├── requirements.txt            # Python Dependencies
├── .env.example                # Environment Variable Template
├── .replit                     # Replit Cloud Deployment Settings
├── replit.nix                  # Nix Package Configuration
├── README.md                   # Hackathon Documentation
├── agents/
│   ├── __init__.py
│   ├── base_agent.py           # Base Gemini API & Fallback Agent
│   ├── schemas.py              # Pydantic Structured JSON Schemas
│   ├── script_breakdown_agent.py
│   ├── budget_logistics_agent.py
│   ├── visual_storyboard_agent.py
│   ├── casting_director_agent.py
│   ├── script_dna_agent.py
│   ├── studio_debate_agent.py
│   ├── pitch_deck_agent.py
│   └── orchestrator.py         # Multi-Agent Pipeline Coordinator & SSE Streamer
├── utils/
│   ├── __init__.py
│   ├── parser.py               # Screenplay File Parser (.txt, .pdf, .docx)
│   └── sample_scripts.py       # 4 Cinematic Preset Screenplays for Instant Demo
├── templates/
│   └── index.html              # Dark-Mode Cinematic Dashboard Template
└── static/
    ├── css/
    │   └── style.css           # Custom Glassmorphic Styling System
    └── js/
        └── app.js              # Frontend SSE & Chart Controller
```

---

## ⚡ Quickstart Guide

### Option 1: Local Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-username/cinemind-ai.git
   cd cinemind-ai
   ```

2. **Create a Virtual Environment**:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Set your Google Gemini API Key**:
   Copy `.env.example` to `.env` and add your key:
   ```bash
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   ```
   *(Note: If no key is set, CineMind AI automatically runs in Demo Mode).*

5. **Launch the Flask Server**:
   ```bash
   python main.py
   ```
   Open `http://localhost:8080` in your web browser!

---

### Option 2: Deploying to Replit

1. Fork or import this repository directly into **Replit**.
2. Set the `GEMINI_API_KEY` environment variable under Replit's **Secrets** tool (`Tools -> Secrets`).
3. Click **Run**. Replit will execute `python main.py` and expose the application web interface automatically.

---

## 🎬 Preset Screenplays Included for Testing

Judges can click any preset screenplay from the top right dropdown for instant 1-click execution:
1. 🌆 **Neon Horizon 2099**: Cyberpunk Sci-Fi Heist involving netrunners infiltrating OmniCorp's zero-g vault.
2. 🕵️ **Shadows of Venice**: Neo-Noir Detective Mystery with art assassins on foggy Venetian canals.
3. ⚔️ **The Dragon's Ember**: Epic Fantasy Siege defending Frosthold Fortress against ten thousand warriors.
4. 🎙️ **Silent Echoes**: Indie Psychological Thriller featuring deep-sea audio hydrophone anomalies.

---

## 🏆 Hackathon Track Alignment

| Requirement | Implementation Detail |
| :--- | :--- |
| **Multi-Agent Architecture** | 4 sub-agents (`ScriptBreakdown`, `BudgetForecasting`, `VisualStoryboard`, `PitchDeck`) coordinated via `AgentOrchestrator`. |
| **Gemini Multimodal & JSON** | Built with `google-genai` SDK using `response_mime_type="application/json"` and Pydantic schemas. |
| **Replit Integration** | Fully pre-configured `.replit`, `replit.nix`, and WSGI setup for 1-click cloud deployment. |
| **Production Design** | Dark obsidian UI, real-time SSE terminal logs, interactive budget charts, PDF & CSV export engine. |

---

## 📜 License & Credits

Built with ❤️ by an Elite Technical Lead for **Agentic Cinema: The Blockbuster Hackathon 2026**. Powered by Google Gemini.
