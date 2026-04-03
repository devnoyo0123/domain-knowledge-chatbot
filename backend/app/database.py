from langchain_postgres import PGVector

from app.config import settings
from app.embedding import get_embeddings


def get_vector_store() -> PGVector:
    return PGVector(
        embeddings=get_embeddings(),
        collection_name="knowledge",
        connection=settings.database_url,
    )
