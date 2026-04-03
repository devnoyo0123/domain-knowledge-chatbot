from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import chat, knowledge

app = FastAPI(title="Domain Knowledge Chatbot")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(knowledge.router)
app.include_router(chat.router)
