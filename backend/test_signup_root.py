import requests
from app.core.config import settings

def main():
    headers = {
        "apikey": settings.SUPABASE_KEY,
        "Authorization": f"Bearer {settings.SUPABASE_KEY}",
        "Content-Type": "application/json"
    }
    
    # We will use another email to register a new user
    payload = {
        "email": "test_pilot_2@aquora.org",
        "password": "PilotPassword123!",
        "user_metadata": {
            "full_name": "Piloto Prueba 2",
            "role": "community_member"
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
