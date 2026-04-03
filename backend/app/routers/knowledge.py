from fastapi import APIRouter
from pydantic import BaseModel

from app.database import get_vector_store

router = APIRouter()


class KnowledgeRequest(BaseModel):
    title: str
    content: str
    category: str | None = None


class KnowledgeResponse(BaseModel):
    id: str
    title: str
    message: str


@router.post("/knowledge", response_model=KnowledgeResponse)
def create_knowledge(req: KnowledgeRequest) -> KnowledgeResponse:
    vector_store = get_vector_store()

    metadata: dict = {"title": req.title}
    if req.category is not None:
        metadata["category"] = req.category

    ids = vector_store.add_texts(texts=[req.content], metadatas=[metadata])

    return KnowledgeResponse(id=ids[0], title=req.title, message="저장 완료")
