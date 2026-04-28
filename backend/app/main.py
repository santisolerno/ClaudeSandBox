import os
import secrets

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="ClaudeSandBox API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    message: str


@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest):
    expected_user = os.getenv("AUTH_USER", "")
    expected_pass = os.getenv("AUTH_PASSWORD", "")

    # secrets.compare_digest evita timing attacks comparando longitudes y bytes
    # en tiempo constante. Es la forma correcta de comparar credenciales.
    user_ok = secrets.compare_digest(payload.username, expected_user)
    pass_ok = secrets.compare_digest(payload.password, expected_pass)

    if not (user_ok and pass_ok):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas",
        )

    return LoginResponse(message="bienvenido")
