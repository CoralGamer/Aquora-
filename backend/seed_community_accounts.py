import uuid
from supabase import create_client, Client
from app.core.config import settings

def main():
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    print("Connecting to Supabase at:", settings.SUPABASE_URL)
    
    # 4 high-fidelity pilot community accounts with their associated multiple filters
    community_members = [
        {
            "id": "ae493cf0-0cbd-4fd2-abff-668377a06191", # Handcrafted UUID
            "email": "juan.epiayu@aquora.org",
            "full_name": "Líder Juan Epiayú",
            "role": "community_member",
            "device_id": "DEV_ESP32_GUAF1,DEV_ESP32_GUAF1_A,DEV_ESP32_GUAF1_B",
            "notification_preferences": {"email": True, "whatsapp": True, "tds_threshold": 400.0, "turbidity_threshold": 5.0}
        },
        {
            "id": "ae493cf0-0cbd-4fd2-abff-668377a06192",
            "email": "maria.pushaina@aquora.org",
            "full_name": "Líder María Pushaina",
            "role": "community_member",
            "device_id": "DEV_ESP32_GUAF2,DEV_ESP32_GUAF2_A,DEV_ESP32_GUAF2_B",
            "notification_preferences": {"email": True, "whatsapp": True, "tds_threshold": 400.0, "turbidity_threshold": 5.0}
        },
        {
            "id": "ae493cf0-0cbd-4fd2-abff-668377a06193",
            "email": "jose.uriana@aquora.org",
            "full_name": "Líder José Uriana",
            "role": "community_member",
            "device_id": "DEV_ESP32_GUAF3,DEV_ESP32_GUAF3_A,DEV_ESP32_GUAF3_B",
            "notification_preferences": {"email": True, "whatsapp": True, "tds_threshold": 400.0, "turbidity_threshold": 5.0}
        },
        {
            "id": "ae493cf0-0cbd-4fd2-abff-668377a06194",
            "email": "carmen.pushaina@aquora.org",
            "full_name": "Líder Carmen Pushaina",
            "role": "community_member",
            "device_id": "DEV_ESP32_GUAF4,DEV_ESP32_GUAF4_A,DEV_ESP32_GUAF4_B",
            "notification_preferences": {"email": True, "whatsapp": True, "tds_threshold": 400.0, "turbidity_threshold": 5.0}
        }
    ]

    print("Seeding pilot community accounts into Supabase user_profiles...")
    for member in community_members:
        try:
            # Check if exists
            chk = supabase.table("user_profiles").select("id").eq("email", member["email"]).execute()
            if not chk.data:
                res = supabase.table("user_profiles").insert([member]).execute()
                print(f"Seeded Profile: {member['full_name']} ({member['email']}) linked with filters: {member['device_id']}")
            else:
                # Update filters just in case
                res = supabase.table("user_profiles").update({"device_id": member["device_id"]}).eq("email", member["email"]).execute()
                print(f"Updated Profile: {member['full_name']} ({member['email']}) -> Filters updated to: {member['device_id']}")
        except Exception as e:
            print(f"Error seeding profile {member['email']}: {e}")

if __name__ == "__main__":
    main()
