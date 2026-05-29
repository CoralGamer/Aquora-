"""Generate API keys for all devices to verify which key to use in Wokwi firmware."""
import sys
sys.path.append('e:/AQUORA/backend')

from supabase import create_client
from app.core.config import settings

def generate_secure_api_key(device_key):
    if not device_key:
        return ""
    salt = "AQUORA_SECURE_SALT_2026"
    string = device_key + salt
    
    hash1 = 0
    for char in string:
        hash1 = (hash1 << 5) - hash1 + ord(char)
        hash1 = hash1 & 0xffffffff
        if hash1 >= 0x80000000:
            hash1 -= 0x100000000
    positive_hash = hex(abs(hash1))[2:].zfill(8)
    
    hash2 = 5381
    for char in string:
        hash2 = ((hash2 << 5) + hash2) + ord(char)
        hash2 = hash2 & 0xffffffff
        if hash2 >= 0x80000000:
            hash2 -= 0x100000000
    positive_hash2 = hex(abs(hash2))[2:].zfill(8)
    
    return f"aq_api_{positive_hash}{positive_hash2}".lower()

def main():
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    devs = supabase.table("devices").select("device_key, community_id").execute()
    comms = supabase.table("communities").select("id, name").execute()
    comm_map = {c["id"]: c["name"] for c in comms.data}
    
    print(f"{'DEVICE KEY':<25} {'COMMUNITY':<35} {'API KEY (for firmware)'}")
    print("-" * 100)
    for d in devs.data:
        key = d["device_key"]
        comm = comm_map.get(d["community_id"], "?")
        api_key = generate_secure_api_key(key)
        print(f"{key:<25} {comm:<35} {api_key}")

if __name__ == "__main__":
    main()
