from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    ollama_base_url: str = "http://host.docker.internal:11434"
    ollama_model: str = "qwen2.5:7b"
    ollama_embedding_model: str = "bge-m3"

    class Config:
        env_file = ".env"


settings = Settings()
