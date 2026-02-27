# Agent Builder (DevDay Challenge)

A small monorepo to **design, save, and run LLM “flows”** (router → agent) with a visual editor.

- **Backend:** Fastify (TypeScript)  
- **Frontend:** Vite + React + React Flow/XYFlow  
- **Storage (MVP):** filesystem for flows + in-memory conversation store  
- **LLM:** Google Gemini (via `@google/genai`)

---

## Features

### Backend (apps/api)
- `POST /flows` — Save a flow (stored on disk, returns `flow_id`)
- `GET /flows/:id` — Load a flow by id
- `POST /chat` — Run a flow for a message (`router_llm -> pickNext -> agent`)
- Trace output for debugging (router decision + selected agent)
- Swagger UI available at `/docs`

### Frontend (apps/web)
- Visual flow editor using **React Flow**
- Custom nodes:
  - Router LLM node
  - Agent node
- Save flow to backend and display the generated `flow_id`

---

## Monorepo Structure
apps/
api/ # Fastify API (TypeScript)
web/ # Vite + React UI (React Flow)
packages/
shared/ # (reserved, mostly empty for now)


---

## Requirements
- Node.js 18+ recommended
- npm (or your preferred package manager)