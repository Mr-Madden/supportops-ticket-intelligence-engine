from pydantic import BaseSettings

class Settings(BaseSettings):
    ZENDESK_SUBDOMAIN: str = "your_subdomain"
    ZENDESK_EMAIL: str = "your_email"
    ZENDESK_API_TOKEN: str = "your_token"
    OPENAI_API_KEY: str = "your_key"

    class Config:
        env_file = ".env"

settings = Settings()
