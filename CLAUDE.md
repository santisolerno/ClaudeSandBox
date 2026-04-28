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
