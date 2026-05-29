from supabase import create_client
from app.core.config import settings

def main():
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    res = supabase.table("devices").select("*").limit(1).execute()
    if res.data:
        print("Columns in devices table:", res.data[0].keys())
        print("Sample device:", res.data[0])
    else:
        print("No devices found")

if __name__ == "__main__":
    main()
