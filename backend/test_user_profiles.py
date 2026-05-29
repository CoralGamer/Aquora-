from supabase import create_client
from app.core.config import settings

def main():
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    res = supabase.table("user_profiles").select("*").execute()
    print("Columns:", res.data[0].keys() if res.data else "No user profiles found")
    print("User Profiles:")
    for profile in res.data:
        print(profile)

if __name__ == "__main__":
    main()
