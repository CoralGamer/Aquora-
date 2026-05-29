from supabase import create_client, Client
from app.core.config import settings

def main():
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    print("Connecting to Supabase at:", settings.SUPABASE_URL)
    
    # Seeding 12 additional filters distributed across La Guajira communities
    additional_devices = [
        # Comunidad Uribia: Center is (11.713, -72.266) (ID: 7b91f03b-4cf5-41b0-87e4-2515c9acb225)
        {"device_key": "DEV_ESP32_GUAF1_A", "active": True, "community_id": "7b91f03b-4cf5-41b0-87e4-2515c9acb225"},
        {"device_key": "DEV_ESP32_GUAF1_B", "active": True, "community_id": "7b91f03b-4cf5-41b0-87e4-2515c9acb225"},
        # Comunidad Manaure: Center is (11.775, -72.444) (ID: 28d1b963-3751-4928-b773-e184e9b9d505)
        {"device_key": "DEV_ESP32_GUAF2_A", "active": True, "community_id": "28d1b963-3751-4928-b773-e184e9b9d505"},
        {"device_key": "DEV_ESP32_GUAF2_B", "active": True, "community_id": "28d1b963-3751-4928-b773-e184e9b9d505"},
        # Comunidad Riohacha: Center is (11.544, -72.907) (ID: b0147dd4-24c8-410c-baf5-b6933f8d7a71)
        {"device_key": "DEV_ESP32_GUAF3_A", "active": True, "community_id": "b0147dd4-24c8-410c-baf5-b6933f8d7a71"},
        {"device_key": "DEV_ESP32_GUAF3_B", "active": True, "community_id": "b0147dd4-24c8-410c-baf5-b6933f8d7a71"},
        # Comunidad Maicao: Center is (11.378, -72.243) (ID: c6ea451d-496c-4db1-b3d3-e17df9ceb03f)
        {"device_key": "DEV_ESP32_GUAF4_A", "active": True, "community_id": "c6ea451d-496c-4db1-b3d3-e17df9ceb03f"},
        {"device_key": "DEV_ESP32_GUAF4_B", "active": True, "community_id": "c6ea451d-496c-4db1-b3d3-e17df9ceb03f"},
        # Comunidad San Juan del Cesar: Center is (10.767, -73.002) (ID: 28b97779-03ac-48ff-9a47-c4fb331b2230)
        {"device_key": "DEV_ESP32_GUAF5_A", "active": True, "community_id": "28b97779-03ac-48ff-9a47-c4fb331b2230"},
        # Comunidad Albania: Center is (11.161, -72.592) (ID: 76b98012-38ee-4865-96fc-fbf798cdf821)
        {"device_key": "DEV_ESP32_GUAF6_A", "active": True, "community_id": "76b98012-38ee-4865-96fc-fbf798cdf821"},
        # Comunidad Dibulla: Center is (11.272, -73.308) (ID: 4da04b99-3c10-4452-a63b-e468e81e543c)
        {"device_key": "DEV_ESP32_GUAF7_A", "active": True, "community_id": "4da04b99-3c10-4452-a63b-e468e81e543c"},
        # Comunidad Barrancas: Center is (11.018, -72.788) (ID: 784648ae-93d9-4676-8237-d9310976b6de)
        {"device_key": "DEV_ESP32_GUAF8_A", "active": True, "community_id": "784648ae-93d9-4676-8237-d9310976b6de"}
    ]

    print("Inserting 12 additional filters into Supabase...")
    for dev in additional_devices:
        try:
            # Check if already exists to avoid duplicates
            chk = supabase.table("devices").select("id").eq("device_key", dev["device_key"]).execute()
            if not chk.data:
                res = supabase.table("devices").insert([dev]).execute()
                print(f"Inserted: {dev['device_key']} -> {res.data[0]['id']}")
            else:
                print(f"Already exists: {dev['device_key']}")
        except Exception as e:
            print(f"Error inserting {dev['device_key']}: {e}")

if __name__ == "__main__":
    main()
