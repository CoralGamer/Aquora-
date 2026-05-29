import uuid
from supabase import create_client
from app.core.config import settings

def main():
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    print("Connecting to Supabase at:", settings.SUPABASE_URL)

    # 1. Fetch communities to get their correct IDs and details
    res_comm = supabase.table("communities").select("*").execute()
    communities = res_comm.data
    print(f"Found {len(communities)} communities in Supabase.")

    # Build a map of community name to ID
    comm_map = {c["name"]: c["id"] for c in communities}
    
    # Check that we have the 8 main communities
    expected_communities = [
        "Comunidad Uribia",
        "Comunidad Manaure",
        "Comunidad Riohacha",
        "Comunidad Maicao",
        "Comunidad San Juan del Cesar",
        "Comunidad Albania",
        "Comunidad Dibulla",
        "Comunidad Barrancas"
    ]
    
    for ec in expected_communities:
        if ec not in comm_map:
            print(f"Warning: Expected community '{ec}' not found in database. Please check schema.")

    # 2. Define additional devices to seed for each community to have a rich demo
    devices_to_seed = []
    
    # Mapping of communities and their devices
    devices_config = {
        "Comunidad Uribia": ["DEV_ESP32_GUAF1_C", "DEV_ESP32_GUAF1_D"],
        "Comunidad Manaure": ["DEV_ESP32_GUAF2_C", "DEV_ESP32_GUAF2_D"],
        "Comunidad Riohacha": ["DEV_ESP32_GUAF3_C", "DEV_ESP32_GUAF3_D"],
        "Comunidad Maicao": ["DEV_ESP32_GUAF4_C", "DEV_ESP32_GUAF4_D"],
        "Comunidad San Juan del Cesar": ["DEV_ESP32_GUAF5_B", "DEV_ESP32_GUAF5_C"],
        "Comunidad Albania": ["DEV_ESP32_GUAF6_B", "DEV_ESP32_GUAF6_C"],
        "Comunidad Dibulla": ["DEV_ESP32_GUAF7_B", "DEV_ESP32_GUAF7_C"],
        "Comunidad Barrancas": ["DEV_ESP32_GUAF8_B", "DEV_ESP32_GUAF8_C"]
    }
    
    for c_name, keys in devices_config.items():
        c_id = comm_map.get(c_name)
        if c_id:
            for key in keys:
                devices_to_seed.append({
                    "device_key": key,
                    "active": True,
                    "community_id": c_id
                })

    print(f"Seeding {len(devices_to_seed)} new purifiers distributed across La Guajira...")
    seeded_devices = {}
    for dev in devices_to_seed:
        try:
            # Check if exists
            chk = supabase.table("devices").select("*").eq("device_key", dev["device_key"]).execute()
            if not chk.data:
                res = supabase.table("devices").insert([dev]).execute()
                seeded_devices[dev["device_key"]] = res.data[0]["id"]
                print(f"Inserted device: {dev['device_key']} -> {res.data[0]['id']}")
            else:
                seeded_devices[dev["device_key"]] = chk.data[0]["id"]
                print(f"Device already exists: {dev['device_key']} -> {chk.data[0]['id']}")
        except Exception as e:
            print(f"Error seeding device {dev['device_key']}: {e}")

    # Fetch existing devices to make sure we can link them in user profiles
    all_dev_res = supabase.table("devices").select("*").execute()
    dev_map = {d["device_key"]: d["id"] for d in all_dev_res.data}
    print(f"Total devices in database: {len(all_dev_res.data)}")

    # 3. Create the 8 pilot Leader accounts directly in user_profiles
    pilot_leaders = [
        {
            "id": "ae493cf0-0cbd-4fd2-abff-668377a06191",
            "email": "uribia.lider@aquora.org",
            "full_name": "Líder Wayúu Uribia",
            "role": "community_member",
            "device_key": "DEV_ESP32_GUAF1", # Default link device
            "notification_preferences": {"email": True, "whatsapp": True, "tds_threshold": 350.0, "turbidity_threshold": 4.5}
        },
        {
            "id": "ae493cf0-0cbd-4fd2-abff-668377a06192",
            "email": "manaure.lider@aquora.org",
            "full_name": "Líder Wayúu Manaure",
            "role": "community_member",
            "device_key": "DEV_ESP32_GUAF2",
            "notification_preferences": {"email": True, "whatsapp": True, "tds_threshold": 400.0, "turbidity_threshold": 5.0}
        },
        {
            "id": "ae493cf0-0cbd-4fd2-abff-668377a06193",
            "email": "riohacha.lider@aquora.org",
            "full_name": "Líder Wayúu Riohacha",
            "role": "community_member",
            "device_key": "DEV_ESP32_GUAF3",
            "notification_preferences": {"email": True, "whatsapp": True, "tds_threshold": 380.0, "turbidity_threshold": 4.0}
        },
        {
            "id": "ae493cf0-0cbd-4fd2-abff-668377a06194",
            "email": "maicao.lider@aquora.org",
            "full_name": "Líder Wayúu Maicao",
            "role": "community_member",
            "device_key": "DEV_ESP32_GUAF4",
            "notification_preferences": {"email": True, "whatsapp": True, "tds_threshold": 420.0, "turbidity_threshold": 5.5}
        },
        {
            "id": "ae493cf0-0cbd-4fd2-abff-668377a06195",
            "email": "sanjuan.lider@aquora.org",
            "full_name": "Líder Wayúu San Juan",
            "role": "community_member",
            "device_key": "DEV_ESP32_GUAF5",
            "notification_preferences": {"email": True, "whatsapp": False, "tds_threshold": 300.0, "turbidity_threshold": 3.5}
        },
        {
            "id": "ae493cf0-0cbd-4fd2-abff-668377a06196",
            "email": "albania.lider@aquora.org",
            "full_name": "Líder Wayúu Albania",
            "role": "community_member",
            "device_key": "DEV_ESP32_GUAF6",
            "notification_preferences": {"email": True, "whatsapp": False, "tds_threshold": 450.0, "turbidity_threshold": 6.0}
        },
        {
            "id": "ae493cf0-0cbd-4fd2-abff-668377a06197",
            "email": "dibulla.lider@aquora.org",
            "full_name": "Líder Wayúu Dibulla",
            "role": "community_member",
            "device_key": "DEV_ESP32_GUAF7",
            "notification_preferences": {"email": True, "whatsapp": True, "tds_threshold": 320.0, "turbidity_threshold": 3.8}
        },
        {
            "id": "ae493cf0-0cbd-4fd2-abff-668377a06198",
            "email": "barrancas.lider@aquora.org",
            "full_name": "Líder Wayúu Barrancas",
            "role": "community_member",
            "device_key": "DEV_ESP32_GUAF8",
            "notification_preferences": {"email": True, "whatsapp": False, "tds_threshold": 410.0, "turbidity_threshold": 4.8}
        }
    ]

    print("\nSeeding 8 high-fidelity community leader accounts directly into user_profiles...")
    for leader in pilot_leaders:
        try:
            # Map device_key to actual UUID
            dev_uuid = dev_map.get(leader["device_key"])
            if not dev_uuid:
                print(f"Warning: Default device '{leader['device_key']}' not found in DB. Profile will have null device_id.")
            
            profile_data = {
                "id": leader["id"],
                "email": leader["email"],
                "full_name": leader["full_name"],
                "role": leader["role"],
                "device_id": dev_uuid,
                "notification_preferences": leader["notification_preferences"]
            }

            # Check if profile already exists by email
            chk = supabase.table("user_profiles").select("*").eq("email", leader["email"]).execute()
            if not chk.data:
                res = supabase.table("user_profiles").insert([profile_data]).execute()
                print(f"Profile Seeded: {leader['full_name']} ({leader['email']}) linked with device {leader['device_key']}")
            else:
                # Update existing profile
                res = supabase.table("user_profiles").update(profile_data).eq("email", leader["email"]).execute()
                print(f"Profile Updated: {leader['full_name']} ({leader['email']}) -> Config updated successfully.")
        except Exception as e:
            print(f"Error seeding profile {leader['email']}: {e}")

if __name__ == "__main__":
    main()
