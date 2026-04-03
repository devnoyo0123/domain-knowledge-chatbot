from fastapi import APIRouter
from langchain_ollama import ChatOllama
from pydantic import BaseModel

from app.config import settings
from app.database import get_vector_store

router = APIRouter()

PROMPT_TEMPLATE = """\
다음 참고자료를 바탕으로 질문에 답변해주세요.
참고자료에 없는 내용은 "해당 정보가 없습니다"라고 답변하세요.

참고자료:
{context}

질문: {question}"""


class ChatRequest(BaseModel):
    question: str


class SourceDocument(BaseModel):
    id: str
    title: str
    content: str


class ChatResponse(BaseModel):
    answer: str
    sources: list[SourceDocument]


@router.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest) -> ChatResponse:
    vector_store = get_vector_store()
    docs = vector_store.similarity_search(req.question, k=3)

    context = "\n\n".join(doc.page_content for doc in docs)
    prompt = PROMPT_TEMPLATE.format(context=context, question=req.question)

    llm = ChatOllama(model=settings.ollama_model, base_url=settings.ollama_base_url)
    response = llm.invoke(prompt)
    answer = str(response.content)

    sources = [
        SourceDocument(
            id=doc.metadata.get("id", ""),
            title=doc.metadata.get("title", ""),
            content=doc.page_content,
        )
        for doc in docs
    ]

    return ChatResponse(answer=answer, sources=sources)
