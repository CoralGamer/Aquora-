import requests
from app.core.config import settings

def main():
    headers = {
        "apikey": settings.SUPABASE_KEY,
        "Authorization": f"Bearer {settings.SUPABASE_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "email": "test_pilot_1@aquora.org",
        "password": "PilotPassword123!",
        "options": {
            "data": {
                "full_name": "Piloto Prueba 1",
                "role": "community_member"
            }
        }
    }
    
    url = f"{settings.SUPABASE_URL}/auth/v1/signup"
    res = requests.post(url, json=payload, headers=headers)
    print("Status:", res.status_code)
    try:
        print("JSON:", res.json())
    except:
        print("Text:", res.text)

if __name__ == "__main__":
    main()
