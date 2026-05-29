from supabase import create_client, Client
from app.core.config import settings

def main():
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    print("Connecting to Supabase at:", settings.SUPABASE_URL)
    
    # Fetch all communities
    res_comm = supabase.table("communities").select("*").execute()
    print("All communities in Supabase:")
    for comm in res_comm.data:
        print(f"Name: {comm['name']}, ID: {comm['id']}, Lat: {comm['latitude']}, Lon: {comm['longitude']}")

    # Fetch all devices
    res_dev = supabase.table("devices").select("*").execute()
    print("\nAll devices in Supabase:")
    for dev in res_dev.data:
        print(f"Key: {dev['device_key']}, ID: {dev['id']}, CommID: {dev['community_id']}")

if __name__ == "__main__":
    main()
