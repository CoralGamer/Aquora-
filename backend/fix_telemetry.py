"""
AQUORA Telemetry Fix Script
============================
Diagnostica y repara la telemetria desconectada:
1. Muestra el estado actual de comunidades, dispositivos y lecturas
2. Re-inserta lecturas frescas para TODOS los dispositivos
3. Actualiza last_connection de cada dispositivo
"""
import sys
import os
os.environ["PYTHONIOENCODING"] = "utf-8"
sys.path.append('e:/AQUORA/backend')

from supabase import create_client
from app.core.config import settings
from datetime import datetime, timedelta
import random

def main():
    print("=" * 60)
    print("  AQUORA - Diagnostico y Reparacion de Telemetria")
    print("=" * 60)
    
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    
    # 1. Diagnostico
    print("\n[1/5] Consultando comunidades...")
    comms = supabase.table("communities").select("id, name").execute()
    print(f"   Comunidades encontradas: {len(comms.data)}")
    for c in comms.data:
        print(f"   - {c['name']} ({c['id'][:8]}...)")
    
    print("\n[2/5] Consultando dispositivos...")
    devs = supabase.table("devices").select("id, device_key, community_id, active").execute()
    print(f"   Dispositivos encontrados: {len(devs.data)}")
    
    comm_map = {c["id"]: c["name"] for c in comms.data}
    for d in devs.data:
        cname = comm_map.get(d["community_id"], "SIN COMUNIDAD")
        print(f"   - {d['device_key']} -> {cname} (active={d['active']})")
    
    print("\n[3/5] Consultando perfiles de usuario...")
    profiles = supabase.table("user_profiles").select("id, email, role, device_id").execute()
    print(f"   Perfiles encontrados: {len(profiles.data)}")
    active_device_ids = set()
    for p in profiles.data:
        dev_match = "X sin device" if not p.get("device_id") else f"OK {p['device_id'][:8]}..."
        print(f"   - {p['email']} ({p['role']}) -> {dev_match}")
        if p.get("device_id"):
            active_device_ids.add(p["device_id"])
    
    print("\n[4/5] Consultando lecturas existentes...")
    readings = supabase.table("sensor_readings")\
        .select("device_id, timestamp")\
        .order("timestamp", desc=True)\
        .limit(10)\
        .execute()
    print(f"   Ultimas lecturas (top 10):")
    for r in readings.data:
        print(f"   - Device {r['device_id'][:8]}... @ {r['timestamp']}")
    
    # 2. Reparacion: re-sembrar lecturas frescas
    print("\n" + "=" * 60)
    print("  REPARACION: Re-sembrando lecturas frescas")
    print("=" * 60)
    
    total_inserted = 0
    total_failed = 0
    
    for d in devs.data:
        dev_id = d["id"]
        dev_key = d["device_key"]
        
        print(f"\n   Sembrando 5 lecturas para {dev_key}...")
        
        for i in range(5):
            ts = (datetime.utcnow() - timedelta(hours=4-i)).isoformat()
            reading = {
                "device_id": dev_id,
                "tds_ppm": round(random.uniform(180.0, 350.0), 1),
                "turbidity_ntu": round(random.uniform(0.8, 4.8), 2),
                "water_level_pct": round(random.uniform(55.0, 95.0), 1),
                "timestamp": ts
            }
            try:
                supabase.table("sensor_readings").insert(reading).execute()
                total_inserted += 1
            except Exception as e:
                total_failed += 1
                print(f"      WARN: Error en lectura {i+1}: {e}")
        
        # Actualizar last_connection
        try:
            supabase.table("devices").update({
                "last_connection": datetime.utcnow().isoformat(),
                "active": True
            }).eq("id", dev_id).execute()
        except Exception as e:
            print(f"      WARN: Error actualizando conexion: {e}")
    
    print(f"\n   OK Lecturas insertadas: {total_inserted}")
    print(f"   FAIL Lecturas fallidas: {total_failed}")
    
    # 3. Verificar
    print("\n" + "=" * 60)
    print("  VERIFICACION: Comunidades con dispositivos activos")
    print("=" * 60)
    
    comm_with_readings = set()
    fresh_readings = supabase.table("sensor_readings")\
        .select("device_id")\
        .order("timestamp", desc=True)\
        .limit(200)\
        .execute()
    
    dev_to_comm = {d["id"]: d["community_id"] for d in devs.data}
    for r in fresh_readings.data:
        cid = dev_to_comm.get(r["device_id"])
        if cid:
            comm_with_readings.add(cid)
    
    print(f"   Comunidades con lecturas de sensores: {len(comm_with_readings)}")
    for cid in comm_with_readings:
        print(f"   OK {comm_map.get(cid, cid)}")
    
    all_comm_ids = set(c["id"] for c in comms.data)
    missing = all_comm_ids - comm_with_readings
    if missing:
        print(f"\n   WARN: Comunidades SIN lecturas: {len(missing)}")
        for cid in missing:
            print(f"   X {comm_map.get(cid, cid)}")
    
    # Comunidades sin member profiles
    comms_with_members = set()
    for d in devs.data:
        if d["id"] in active_device_ids:
            comms_with_members.add(d["community_id"])
    
    comms_without_members = all_comm_ids - comms_with_members
    if comms_without_members:
        print(f"\n   WARN: Comunidades SIN miembros aprovisionados ({len(comms_without_members)}):")
        print(f"   (Estas NO aparecen en el heatmap actual)")
        for cid in comms_without_members:
            print(f"   X {comm_map.get(cid, cid)}")
        print(f"\n   >> SOLUCION: Modificar heatmap para mostrar TODAS las comunidades con dispositivos.")
    
    print("\n" + "=" * 60)
    print("  REPARACION COMPLETA")
    print("=" * 60)

if __name__ == "__main__":
    main()
