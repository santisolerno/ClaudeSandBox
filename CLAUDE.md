# CLAUDE.md

Bitácora de sesiones de trabajo en el proyecto **ClaudeSandBox**.

## Descripción del proyecto

Repositorio de pruebas que combina en un único monorepo:

- **backend/** — servidor [FastAPI](https://fastapi.tiangolo.com/) (Python).
- **frontend/** — aplicación [React](https://react.dev/).

## Convenciones

- Cada sesión queda registrada en la sección [Historial de sesiones](#historial-de-sesiones) en orden cronológico inverso (la más reciente arriba).
- Formato de cada entrada:
  - **Fecha** (YYYY-MM-DD)
  - **Objetivo** de la sesión
  - **Cambios realizados**
  - **Pendientes / próximos pasos** (si aplica)

## Historial de sesiones

### 2026-04-28 — Stack base, Dockerización y dev cross-platform

**Objetivo:** definir el stack concreto y armar el esqueleto del monorepo, garantizando que dos devs (uno en Windows, otro en Mac) puedan correr todo de forma idéntica, con un camino claro hacia el despliegue en DigitalOcean App Platform.

**Decisiones de stack:**
- **Backend:** Python 3.12 + FastAPI 0.115 + Uvicorn. Dependencias con `pip` + `venv` + `requirements.txt` pinneado.
- **Frontend:** Vite + React 18 + TypeScript.
- **Estrategia de dev cross-platform:** Docker Compose con bind mounts y hot-reload (Uvicorn `--reload` y Vite HMR con `usePolling: true` para que detecte cambios en Win + Mac). Un solo comando (`docker compose up`) levanta todo.
- **Estrategia de despliegue:** un `Dockerfile` por servicio. DO App Platform apunta a cada `Dockerfile` como un component. La imagen que se prueba en local es la misma que se despliega.
- **Devcontainers:** descartados por ahora para no atar al equipo a un editor concreto. Si en el futuro ambos usan VS Code/Cursor, se agrega un `.devcontainer/` que apunte al `docker-compose.yml` existente (variante #5 evaluada).

**Cambios realizados:**
- Limpieza de dos directorios vacíos rotos (`backend/Dockerfile/` y `backend/.dockerignore/`) que existían como carpetas en lugar de archivos.
- **Backend (`backend/`):**
  - `app/main.py` con FastAPI, endpoint raíz `/`, `/health`, y CORS habilitado para `http://localhost:5173`.
  - `requirements.txt` con FastAPI 0.115.0 y `uvicorn[standard]` 0.32.0.
  - `Dockerfile` basado en `python:3.12-slim`, sin `--reload` (el flag se agrega desde compose para dev).
  - `.dockerignore` y `.gitignore`.
- **Frontend (`frontend/`):**
  - Scaffold manual de Vite + React + TS: `package.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts` (con `host: true` y `usePolling: true`), `index.html`, `src/main.tsx`, `src/App.tsx` (fetch al backend usando `VITE_API_URL`), `src/index.css`, `src/vite-env.d.ts`.
  - `Dockerfile` multi-stage con targets `deps`, `dev` (Vite dev server), `build` (compila estáticos) y `prod` (nginx sirviendo `dist/`).
  - `nginx.conf` con SPA fallback y cache largo para `/assets/`.
  - `.dockerignore` y `.gitignore`.
- **Raíz:**
  - `docker-compose.yml` orquestando ambos servicios. Bind mounts para hot-reload, volumen anónimo en `/app/node_modules` del frontend para evitar que el mount lo oculte.
  - `.gitignore` raíz con entradas comunes de OS / IDEs.

**Cómo correr en local:**
```bash
docker compose up --build
# Backend:  http://localhost:8000  (docs en /docs)
# Frontend: http://localhost:5173
```

**Pendientes / próximos pasos:**
- Probar `docker compose up --build` end-to-end en Mac y en Windows del hermano.
- Generar `package-lock.json` (la primera build de Docker lo va a crear; conviene comitearlo después).
- Definir variables de entorno reales (`.env.example` por servicio) cuando aparezcan secrets / config.
- Configurar el App Spec de DO App Platform (un component por `Dockerfile`, con sus env vars).
- Considerar agregar un workflow de CI (GitHub Actions) que al menos haga `docker build` de ambos servicios.
- Si más adelante ambos devs convergen en VS Code/Cursor, agregar `.devcontainer/` apuntando al `docker-compose.yml`.

---

### 2026-04-28 — Inicialización del repositorio

**Objetivo:** preparar la estructura inicial del monorepo y este registro de bitácora.

**Cambios realizados:**
- Creadas las carpetas `backend/` y `frontend/` (vacías por ahora).
- Creado `CLAUDE.md` como bitácora viva de las sesiones.
- Primer commit y push al remoto `origin` (`santisolerno/ClaudeSandBox`).

**Pendientes / próximos pasos:**
- Definir el stack concreto del backend (versión de Python, gestor de dependencias, estructura de FastAPI).
- Definir el stack concreto del frontend (Vite/CRA/Next, gestor de paquetes, TypeScript o JS).
- Decidir cómo se orquestan ambos servidores en desarrollo (scripts, Docker, etc.).
