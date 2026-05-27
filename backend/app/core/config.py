from pydantic import BaseSettings

class Settings(BaseSettings):
    SUPABASE_URL: str = "https://your-project.supabase.co"
    SUPABASE_KEY: str = "your-service-role-key"
    API_PORT: int = 8000
    PROJECT_NAME: str = "AQUORA Unified API"

    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'
        extra = "ignore" # Ignorar variables de entorno extras

settings = Settings()
