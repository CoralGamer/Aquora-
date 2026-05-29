from supabase import create_client
import sys
sys.path.append('e:/AQUORA/backend')
from app.core.config import settings
from datetime import datetime, timedelta
import random

def main():
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    
    # 1. Obtener todos los dispositivos
    devs_res = supabase.table("devices").select("*").execute()
    if not devs_res.data:
        print("No devices found to seed readings.")
        return
        
    print(f"Found {len(devs_res.data)} devices. Seeding sensor readings...")
    
    for d in devs_res.data:
        dev_id = d["id"]
        dev_key = d["device_key"]
        print(f"Seeding readings for {dev_key} ({dev_id})...")
        
        # Insert 5 readings separated by 1 hour
        for i in range(5):
            ts = (datetime.utcnow() - timedelta(hours=5-i)).isoformat()
            reading = {
                "device_id": dev_id,
                "tds_ppm": round(random.uniform(220.0, 310.0), 1),
                "turbidity_ntu": round(random.uniform(1.0, 4.5), 2),
                "water_level_pct": round(random.uniform(65.0, 88.0), 1),
                "timestamp": ts
            }
            try:
                supabase.table("sensor_readings").insert(reading).execute()
            except Exception as e:
                print(f"Bypassed inserting reading for {dev_key}: {e}")
            
        # Update last connection
        try:
            supabase.table("devices").update({"last_connection": datetime.utcnow().isoformat()}).eq("id", dev_id).execute()
        except Exception as e:
            print(f"Bypassed updating connection for {dev_key}: {e}")
        
    print("Successfully seeded all active telemetry channels!")

if __name__ == "__main__":
    main()
