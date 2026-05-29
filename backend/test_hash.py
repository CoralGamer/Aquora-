def generate_secure_api_key(device_key: str) -> str:
    if not device_key:
        return ""
    salt = "AQUORA_SECURE_SALT_2026"
    string = device_key + salt
    
    # First hash
    hash1 = 0
    for char in string:
        hash1 = (hash1 << 5) - hash1 + ord(char)
        hash1 = hash1 & 0xffffffff
        # Convert to signed 32-bit int
        if hash1 >= 0x80000000:
            hash1 -= 0x100000000
            
    positive_hash = hex(abs(hash1))[2:].zfill(8)
    
    # Second hash
    hash2 = 5381
    for char in string:
        hash2 = ((hash2 << 5) + hash2) + ord(char)
        hash2 = hash2 & 0xffffffff
        if hash2 >= 0x80000000:
            hash2 -= 0x100000000
            
    positive_hash2 = hex(abs(hash2))[2:].zfill(8)
    
    return f"aq_api_{positive_hash}{positive_hash2}".lower()

def main():
    for key in ["DEV_ESP32_GUAF1", "DEV_ESP32_GUAF2", "DEV_ESP32_GUAF1_A"]:
        print(f"Serial: {key} -> API Key: {generate_secure_api_key(key)}")

if __name__ == "__main__":
    main()
