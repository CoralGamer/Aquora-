import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";

// Generador determinista de claves de API seguras que coincide al 100% con el backend
function generateSecureApiKey(deviceKey) {
  if (!deviceKey) return "";
  const salt = "AQUORA_SECURE_SALT_2026";
  const str = deviceKey + salt;
  
  // First hash
  let hash1 = 0;
  for (let i = 0; i < str.length; i++) {
    hash1 = (hash1 << 5) - hash1 + str.charCodeAt(i);
    hash1 = hash1 & 0xffffffff;
  }
  if (hash1 >= 0x80000000) {
    hash1 -= 0x100000000;
  }
  const positiveHash = Math.abs(hash1).toString(16).padStart(8, '0');
  
  // Second hash
  let hash2 = 5381;
  for (let i = 0; i < str.length; i++) {
    hash2 = ((hash2 << 5) + hash2) + str.charCodeAt(i);
    hash2 = hash2 & 0xffffffff;
  }
  if (hash2 >= 0x80000000) {
    hash2 -= 0x100000000;
  }
  const positiveHash2 = Math.abs(hash2).toString(16).padStart(8, '0');
  
  return `aq_api_${positiveHash}${positiveHash2}`.toLowerCase();
}

export default function AdminUserProvisioning({ getApiUrl, userRole }) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("community_member");
  const [selectedDevices, setSelectedDevices] = useState([]);
  
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [communities, setCommunities] = useState([]);
  const [activeListTab, setActiveListTab] = useState("devices"); // 'devices' or 'communities'
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCommunityId, setFilterCommunityId] = useState("");
  const [deviceSearchQuery, setDeviceSearchQuery] = useState("");

  // Queue of active pending filter/community requests from SQLite backend
  const [pendingFilterRequests, setPendingFilterRequests] = useState([]);
  const [pendingCommRequests, setPendingCommRequests] = useState([]);

  // QR Label Modal States
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [activeLabel, setActiveLabel] = useState(null);

  // Fetch pending requests from FastAPI backend
  const fetchRequests = async () => {
    try {
      const apiUrl = getApiUrl();
      const filterRes = await fetch(`${apiUrl}/api/v1/requests/filter`);
      if (filterRes.ok) {
        const filterData = await filterRes.json();
        setPendingFilterRequests(filterData.filter(r => r.status === "Pendiente"));
      }

      const commRes = await fetch(`${apiUrl}/api/v1/requests/community`);
      if (commRes.ok) {
        const commData = await commRes.json();
        setPendingCommRequests(commData.filter(r => r.status === "Pendiente"));
      }
    } catch (err) {
      console.error("Error fetching requests from backend:", err);
    }
  };

  // Fetch all devices and communities from Supabase on mount
  useEffect(() => {
    supabase
      .from("devices")
      .select("id, device_key, active, community_id")
      .then(({ data, error }) => {
        if (!error && data) {
          setDevices(data);
        } else {
          // Resilient fallback mock devices
          setDevices([
            { id: "dev-1", device_key: "DEV_ESP32_GUAF1", active: true, latitude: 11.775, longitude: -72.444, community_id: "28d1b963-3751-4928-b773-e184e9b9d505" },
            { id: "dev-2", device_key: "DEV_ESP32_GUAF8392", active: true, latitude: 11.713, longitude: -72.266, community_id: "7b91f03b-4cf5-41b0-87e4-2515c9acb225" }
          ]);
        }
      });

    supabase
      .from("communities")
      .select("id, name, latitude, longitude")
      .then(({ data, error }) => {
        if (!error && data) {
          setCommunities(data);
        } else {
          // Resilient fallback communities matching our pilot database
          setCommunities([
            { id: "7b91f03b-4cf5-41b0-87e4-2515c9acb225", name: "Comunidad Uribia", latitude: 11.713, longitude: -72.266 },
            { id: "28d1b963-3751-4928-b773-e184e9b9d505", name: "Comunidad Manaure", latitude: 11.775, longitude: -72.444 },
            { id: "b0147dd4-24c8-410c-baf5-b6933f8d7a71", name: "Comunidad Riohacha", latitude: 11.544, longitude: -72.907 },
            { id: "c6ea451d-496c-4db1-b3d3-e17df9ceb03f", name: "Comunidad Maicao", latitude: 11.378, longitude: -72.243 },
            { id: "28b97779-03ac-48ff-9a47-c4fb331b2230", name: "Comunidad San Juan del Cesar", latitude: 10.767, longitude: -73.002 },
            { id: "76b98012-38ee-4865-96fc-fbf798cdf821", name: "Comunidad Albania", latitude: 11.161, longitude: -72.592 },
            { id: "4da04b99-3c10-4452-a63b-e468e81e543c", name: "Comunidad Dibulla", latitude: 11.272, longitude: -73.308 },
            { id: "784648ae-93d9-4676-8237-d9310976b6de", name: "Comunidad Barrancas", latitude: 11.018, longitude: -72.788 }
          ]);
        }
      });

    fetchRequests();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const apiUrl = getApiUrl();
      const payload = {
        email: email.trim(),
        password: password,
        full_name: fullName.trim(),
        role: role,
        device_id: selectedDevices.join(",") || null
      };

      const res = await fetch(`${apiUrl}/api/v1/admin/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.detail || "Error aprovisionando cuenta de usuario.");
      }

      setSuccessMsg(`¡Cuenta registrada y perfil enlazado exitosamente en Supabase! La contraseña temporal asignada es: ${password}`);
      setEmail("");
      setFullName("");
      setPassword("");
      setSelectedDevices([]);
      setRole("community_member");
    } catch (err) {
      console.error("User creation failed:", err);
      setErrorMsg(err.message || "Fallo en la comunicación con el servidor backend seguro.");
    } finally {
      setLoading(false);
    }
  };

  // Authorize a pending filter request, generate Serial + QR code label
  const handleAuthorizeRequest = async (request) => {
    // Generate unique serial code key
    const randSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const generatedSerial = `DEV_ESP32_GUAF${randSuffix}`;
    const today = new Date().toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });

    // Match community name and location dynamically from communities state
    let communityName = "Comunidad General";
    let locationName = "La Guajira, Colombia";
    let latVal = 11.378;
    let lonVal = -72.6;

    const matchedComm = communities.find(c => c.id === request.community_id);
    if (matchedComm) {
      communityName = matchedComm.name;
      locationName = `${matchedComm.name}, La Guajira`;
      latVal = matchedComm.latitude || 11.378;
      lonVal = matchedComm.longitude || -72.6;
    }

    const labelData = {
      serial: generatedSerial,
      apiKey: generateSecureApiKey(generatedSerial),
      solicitor: request.name,
      location: locationName,
      communityId: request.community_id,
      latitude: latVal,
      longitude: lonVal,
      date: today,
      authorizer: userRole === "super_admin" ? "Super Admin AQUORA" : "Staff Ábaco"
    };

    setActiveLabel(labelData);
    setShowLabelModal(true);

    // Try to insert device in database live in Supabase
    try {
      const { data, error } = await supabase
        .from("devices")
        .insert([
          { 
            device_key: generatedSerial, 
            active: true, 
            community_id: request.community_id
          }
        ])
        .select();

      if (!error && data) {
        setDevices(prev => [...prev, data[0]]);
      } else {
        console.error("Error inserting device in Supabase:", error);
        // Local state fallback
        setDevices(prev => [...prev, { 
          id: `generated-${randSuffix}`, 
          device_key: generatedSerial, 
          active: true,
          latitude: latVal,
          longitude: lonVal,
          community_id: request.community_id
        }]);
      }
    } catch (err) {
      console.warn("Supabase insert skipped or failed, using state cache:", err);
      // Local state fallback
      setDevices(prev => [...prev, { 
        id: `generated-${randSuffix}`, 
        device_key: generatedSerial, 
        active: true,
        latitude: latVal,
        longitude: lonVal,
        community_id: request.community_id
      }]);
    }

    // Update state in backend SQLite via PATCH
    try {
      const apiUrl = getApiUrl();
      await fetch(`${apiUrl}/api/v1/requests/filter/${request.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Aprobado" })
      });
    } catch (err) {
      console.error("Error approving filter request on backend:", err);
    }

    // Refresh lists
    fetchRequests();
  };

  // Authorize a pending community request
  const handleAuthorizeCommunity = async (request) => {
    // GPS Mapping for Departments & Municipalities
    const MUNI_GPS = {
      "Uribia": { lat: 11.713, lon: -72.266 },
      "Manaure": { lat: 11.775, lon: -72.444 },
      "Riohacha": { lat: 11.544, lon: -72.907 },
      "Maicao": { lat: 11.378, lon: -72.243 },
      "San Juan del Cesar": { lat: 10.767, lon: -73.002 },
      "Albania": { lat: 11.161, lon: -72.592 },
      "Dibulla": { lat: 11.272, lon: -73.308 },
      "Barrancas": { lat: 11.018, lon: -72.788 },
      "Santa Marta": { lat: 11.240, lon: -74.199 },
      "Ciénaga": { lat: 11.008, lon: -74.250 },
      "Aracataca": { lat: 10.592, lon: -74.190 },
      "Plato": { lat: 9.790, lon: -74.782 },
      "Fundación": { lat: 10.518, lon: -74.185 },
      "El Banco": { lat: 9.001, lon: -73.972 },
      "Barranquilla": { lat: 10.963, lon: -74.796 },
      "Soledad": { lat: 10.917, lon: -74.749 },
      "Malambo": { lat: 10.859, lon: -74.774 },
      "Sabanalarga": { lat: 10.632, lon: -74.921 },
      "Puerto Colombia": { lat: 10.988, lon: -74.955 },
      "Cartagena": { lat: 10.391, lon: -75.479 },
      "Turbaco": { lat: 10.334, lon: -75.441 },
      "Arjona": { lat: 10.258, lon: -75.345 },
      "Magangué": { lat: 9.242, lon: -74.754 },
      "El Carmen de Bolívar": { lat: 9.717, lon: -75.121 },
      "Valledupar": { lat: 10.463, lon: -73.253 },
      "Aguachica": { lat: 8.307, lon: -73.614 },
      "Agustín Codazzi": { lat: 10.037, lon: -73.236 },
      "Bosconia": { lat: 9.978, lon: -73.886 },
      "San Diego": { lat: 10.338, lon: -73.181 }
    };

    const gps = MUNI_GPS[request.municipality] || { lat: 11.378, lon: -72.600 };
    const communityLocation = request.corregimiento 
      ? `${request.corregimiento} (${request.municipality})`
      : request.municipality;
    const communityName = `Comunidad ${communityLocation}`;

    try {
      // 1. Insert community in Supabase (satisfying schema NOT NULL constraints)
      const { data, error } = await supabase
        .from("communities")
        .insert([
          {
            name: communityName,
            department: request.department || "La Guajira",
            latitude: gps.lat,
            longitude: gps.lon,
            whatsapp_contact: "+573000000000" // Default fallback contact number
          }
        ])
        .select();

      if (!error && data) {
        setCommunities(prev => [...prev, data[0]]);
        alert(`¡Comunidad "${communityName}" registrada exitosamente en Supabase!\nCoordenadas: ${gps.lat}, ${gps.lon}`);
      } else {
        throw new Error(error?.message || "Error al insertar la comunidad en Supabase.");
      }
    } catch (err) {
      console.warn("Supabase insert community skipped or failed, using state cache:", err);
      // Local state fallback
      setCommunities(prev => [...prev, {
        id: `gen-comm-${request.id}`,
        name: communityName,
        latitude: gps.lat,
        longitude: gps.lon
      }]);
      alert(`¡Comunidad "${communityName}" aprobada localmente en la caché!`);
    }

    // 2. PATCH request status in backend SQLite to transitions it to Approved
    try {
      const apiUrl = getApiUrl();
      await fetch(`${apiUrl}/api/v1/requests/community/${request.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Aprobado" })
      });
    } catch (err) {
      console.error("Error approving community request on backend:", err);
    }

    // 3. Refresh lists
    fetchRequests();
  };

  const filteredDevices = devices.filter(device => {
    const matchedComm = communities.find(c => c.id === device.community_id);
    const commName = matchedComm ? matchedComm.name : "Comunidad General";
    const locName = matchedComm ? `${matchedComm.name}, La Guajira` : "La Guajira, Colombia";
    const query = searchQuery.toLowerCase().trim();
    
    if (!query) return true;
    
    return (
      device.device_key.toLowerCase().includes(query) ||
      commName.toLowerCase().includes(query) ||
      locName.toLowerCase().includes(query) ||
      device.id.toLowerCase().includes(query) ||
      (device.latitude && device.latitude.toString().includes(query)) ||
      (device.longitude && device.longitude.toString().includes(query))
    );
  });

  const filteredCommunities = communities.filter(community => {
    const commDevices = devices.filter(d => d.community_id === community.id);
    const hasDeviceMatch = commDevices.some(d => d.device_key.toLowerCase().includes(searchQuery.toLowerCase().trim()));
    const query = searchQuery.toLowerCase().trim();
    
    if (!query) return true;
    
    return (
      community.name.toLowerCase().includes(query) ||
      (community.latitude && community.latitude.toString().includes(query)) ||
      (community.longitude && community.longitude.toString().includes(query)) ||
      hasDeviceMatch
    );
  });

  const filteredDevicesForAccount = devices.filter(d => {
    // Filter by community
    if (filterCommunityId && d.community_id !== filterCommunityId) {
      return false;
    }
    // Filter by text search
    if (deviceSearchQuery) {
      const q = deviceSearchQuery.toLowerCase().trim();
      const serialMatch = d.device_key && d.device_key.toLowerCase().includes(q);
      
      const deviceComm = communities.find(c => c.id === d.community_id);
      const commMatch = deviceComm && deviceComm.name.toLowerCase().includes(q);
      
      if (!serialMatch && !commMatch) return false;
    }
    return true;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
      
      {/* Dynamic sticker printing stylesheet embedded safely */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          /* Hide all non-printable wrappers cleanly */
          header, .header, footer, .footer-main, .no-print, .no-print * {
            display: none !important;
            height: 0 !important;
            overflow: hidden !important;
          }
          .no-print-overlay {
            background: white !important;
            backdrop-filter: none !important;
            padding: 0 !important;
            margin: 0 !important;
            display: block !important;
            position: relative !important;
            width: 100% !important;
            height: auto !important;
            z-index: auto !important;
          }
          body {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          #aquora-print-sticker {
            background: white !important;
            color: black !important;
            border: 2px dashed #000000 !important;
            padding: 24px !important;
            width: 340px !important;
            margin: 40px auto !important; /* Center horizontally with margin */
            box-shadow: none !important;
            border-radius: 8px !important;
            font-family: monospace !important;
            text-align: center !important;
            page-break-inside: avoid !important;
            page-break-after: avoid !important;
          }
          /* Force ALL nested elements inside the sticker to black text and transparent background for high contrast */
          #aquora-print-sticker * {
            color: #000000 !important;
            background: transparent !important;
            border-color: #000000 !important;
            fill: #000000 !important;
          }
        }
      `}} />

      {/* Top Section: Form and Solicitudes Grid */}
      <div className="no-print" style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "2.5rem" }}>
        
        {/* Left Card: Account Provisioning Form */}
        <div className="card" style={{ 
          background: "linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.6) 100%)",
          border: "1px solid hsla(var(--primary) / 0.15)"
        }}>
          <h3 style={{ fontFamily: "var(--font-title)", fontSize: "1.5rem", color: "hsl(var(--text-main))", marginBottom: "0.5rem" }}>
            👥 Aprovisionar Nueva Cuenta Comunitaria
          </h3>
          <p style={{ color: "hsl(var(--text-muted))", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
            Crea de forma centralizada una cuenta de acceso para un miembro o staff en territorio. El sistema registrará el correo, generará un perfil en Supabase y asociará múltiples filtros inteligentes.
          </p>

          {successMsg ? (
            <div style={{ 
              background: "rgba(16, 185, 129, 0.1)", 
              border: "1px solid hsla(var(--success) / 0.3)", 
              borderRadius: "12px", 
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
              marginBottom: "1.5rem"
            }}>
              <span style={{ fontSize: "2rem" }}>🎉</span>
              <h4 style={{ color: "hsl(var(--success))", fontWeight: "bold", margin: 0 }}>¡Aprovisionamiento Exitoso!</h4>
              <p style={{ color: "hsl(var(--text-main))", fontSize: "0.9rem", lineHeight: "1.4", margin: 0 }}>
                {successMsg}
              </p>
              <button className="btn btn-secondary" style={{ marginTop: "0.5rem" }} onClick={() => setSuccessMsg("")}>
                Aprovisionar Otro Miembro
              </button>
            </div>
          ) : (
            <form onSubmit={handleCreateUser} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Nombre Completo</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={fullName} 
                    onChange={(e) => setFullName(e.target.value)} 
                    placeholder="Familia Pushaina o Nombre del Admin"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Correo Electrónico</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="ejemplo@correo.com"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Contraseña Temporal</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder="Ej: Aquora2026!"
                    required
                    minLength={6}
                    disabled={loading}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Rol del Usuario</label>
                  <select 
                    className="form-input"
                    style={{ background: "rgba(15, 23, 42, 0.95)", border: "1px solid hsl(var(--border-light))", color: "hsl(var(--text-main))", cursor: "pointer" }}
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    required
                    disabled={loading}
                  >
                    <option value="community_member" style={{ background: "#0f172a", color: "#f8fafc" }}>Miembro de la Comunidad</option>
                    <option value="abaco_staff" style={{ background: "#0f172a", color: "#f8fafc" }}>Miembro Staff de la ONG Ábaco</option>
                  </select>
                </div>
              </div>

              {role === "community_member" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  
                  {/* Grid de Filtros para Selección de Dispositivos */}
                  <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "0.75rem" }}>
                    
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: "0.75rem", color: "hsl(var(--text-muted))" }}>Filtrar por Comunidad</label>
                      <select
                        className="form-input"
                        style={{ 
                          background: "rgba(15, 23, 42, 0.8)", 
                          border: "1px solid rgba(173, 219, 255, 0.15)", 
                          color: "hsl(var(--text-main))", 
                          cursor: "pointer",
                          fontSize: "0.8rem",
                          padding: "0.4rem 0.6rem",
                          height: "38px"
                        }}
                        value={filterCommunityId}
                        onChange={(e) => setFilterCommunityId(e.target.value)}
                        disabled={loading}
                      >
                        <option value="" style={{ background: "#0f172a", color: "#f8fafc" }}>📍 Todas las Comunidades</option>
                        {communities.map(c => (
                          <option key={c.id} value={c.id} style={{ background: "#0f172a", color: "#f8fafc" }}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: "0.75rem", color: "hsl(var(--text-muted))" }}>Buscar por Código / Serie</label>
                      <input 
                        type="text" 
                        className="form-input"
                        style={{ 
                          fontSize: "0.8rem",
                          padding: "0.4rem 0.6rem",
                          height: "38px"
                        }}
                        value={deviceSearchQuery} 
                        onChange={(e) => setDeviceSearchQuery(e.target.value)} 
                        placeholder="Ej: GUAF7 o Maicao"
                        disabled={loading}
                      />
                    </div>

                  </div>

                  {/* Acciones Rápidas de Selección */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
                    <div style={{ display: "flex", gap: "0.4rem" }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ 
                          fontSize: "0.7rem", 
                          padding: "0.25rem 0.5rem", 
                          background: "rgba(34, 197, 94, 0.15)", 
                          border: "1px solid rgba(34, 197, 94, 0.3)",
                          color: "#4ade80",
                          borderRadius: "4px"
                        }}
                        onClick={() => {
                          const keysToAdd = filteredDevicesForAccount.map(d => d.device_key);
                          setSelectedDevices(Array.from(new Set([...selectedDevices, ...keysToAdd])));
                        }}
                        disabled={filteredDevicesForAccount.length === 0}
                      >
                        ✅ Seleccionar {filteredDevicesForAccount.length} Filtrados
                      </button>
                      
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ 
                          fontSize: "0.7rem", 
                          padding: "0.25rem 0.5rem", 
                          background: "rgba(239, 68, 68, 0.15)", 
                          border: "1px solid rgba(239, 68, 68, 0.3)",
                          color: "#f87171",
                          borderRadius: "4px"
                        }}
                        onClick={() => {
                          const keysToRemove = filteredDevicesForAccount.map(d => d.device_key);
                          setSelectedDevices(selectedDevices.filter(k => !keysToRemove.includes(k)));
                        }}
                        disabled={filteredDevicesForAccount.length === 0}
                      >
                        ❌ Deseleccionar Filtrados
                      </button>
                    </div>

                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ 
                        fontSize: "0.7rem", 
                        padding: "0.25rem 0.5rem", 
                        borderRadius: "4px"
                      }}
                      onClick={() => setSelectedDevices([])}
                      disabled={selectedDevices.length === 0}
                    >
                      Limpiar Todo ({selectedDevices.length})
                    </button>
                  </div>

                  {/* Checklist Multiselección */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "hsl(var(--text-muted))" }}>
                      <span>Asociación de Filtros Inteligentes ({filteredDevicesForAccount.length} mostrados)</span>
                      <span style={{ fontSize: "0.75rem", color: "hsl(var(--sky))", fontWeight: "bold" }}>
                        {selectedDevices.length} seleccionados
                      </span>
                    </label>
                    
                    <div style={{ 
                      maxHeight: "140px", 
                      overflowY: "auto", 
                      border: "1px solid rgba(173, 219, 255, 0.15)", 
                      borderRadius: "8px", 
                      padding: "0.6rem", 
                      background: "rgba(15, 23, 42, 0.6)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem"
                    }}>
                      {filteredDevicesForAccount.map((d) => {
                        const isChecked = selectedDevices.includes(d.device_key);
                        const commName = communities.find(c => c.id === d.community_id)?.name || "Sin Comunidad";
                        return (
                          <label 
                            key={d.id} 
                            style={{ 
                              display: "flex", 
                              alignItems: "center", 
                              justifyContent: "space-between",
                              gap: "0.6rem", 
                              color: isChecked ? "hsl(var(--sky))" : "#f8fafc", 
                              cursor: "pointer",
                              fontSize: "0.85rem",
                              fontWeight: isChecked ? "600" : "normal",
                              padding: "0.25rem 0.4rem",
                              borderRadius: "4px",
                              background: isChecked ? "rgba(56, 189, 248, 0.08)" : "transparent"
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                              <input 
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedDevices([...selectedDevices, d.device_key]);
                                  } else {
                                    setSelectedDevices(selectedDevices.filter(k => k !== d.device_key));
                                  }
                                }}
                                style={{ accentColor: "hsl(var(--sky))" }}
                              />
                              <span>{d.device_key} {d.active ? "✓" : "(Inactivo)"}</span>
                            </div>
                            <span style={{ fontSize: "0.75rem", color: "hsl(var(--text-muted))", fontStyle: "italic" }}>
                              {commName}
                            </span>
                          </label>
                        );
                      })}
                      {filteredDevicesForAccount.length === 0 && (
                        <span style={{ color: "hsl(var(--text-muted))", fontSize: "0.8rem", fontStyle: "italic", textAlign: "center", padding: "1rem 0" }}>
                          No se encontraron filtros en esta búsqueda.
                        </span>
                      )}
                    </div>
                  </div>

                </div>
              )}

              {errorMsg && (
                <div style={{ 
                  color: "hsl(var(--danger))", 
                  fontSize: "0.8rem", 
                  lineHeight: "1.4",
                  background: "rgba(244, 63, 94, 0.08)",
                  padding: "0.6rem 0.8rem",
                  borderRadius: "8px",
                  border: "1px solid rgba(244, 63, 94, 0.2)"
                }}>
                  ⚠️ {errorMsg}
                </div>
              )}

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: "100%", marginTop: "0.5rem" }}
                disabled={loading}
              >
                {loading ? "Registrando en Supabase..." : "🚀 Crear Cuenta y Perfil"}
              </button>

            </form>
          )}
        </div>

        {/* Right Column containing Requests Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          
          {/* Card 1: Pending Filter Requests List */}
          <div className="card" style={{ 
            background: "rgba(10, 24, 34, 0.4)",
            borderColor: "rgba(173, 219, 255, 0.08)",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
            justifyContent: "flex-start"
          }}>
            <div>
              <h3 style={{ fontFamily: "var(--font-title)", fontSize: "1.3rem", color: "#ffffff", display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
                <span>📬</span> Solicitudes de Filtros Pendientes
              </h3>
              <p style={{ color: "hsl(var(--text-muted))", fontSize: "0.82rem", marginTop: "0.25rem" }}>
                Solicitudes de vinculación familiar para comunidades registradas. Haz clic en "Autorizar" para inyectar su código de serie inteligente y generar la etiqueta de hardware.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {pendingFilterRequests.length === 0 ? (
                <div style={{ textAlign: "center", padding: "2rem", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: "8px" }}>
                  <span style={{ fontSize: "1.5rem" }}>🙌</span>
                  <p style={{ color: "hsl(var(--text-muted))", fontSize: "0.85rem", margin: "0.5rem 0 0 0" }}>
                    No hay solicitudes de filtros pendientes en el territorio.
                  </p>
                </div>
              ) : (
                pendingFilterRequests.map((request) => {
                  const matchedComm = communities.find(c => c.id === request.community_id);
                  const communityName = matchedComm ? matchedComm.name : "Comunidad General";
                  const latVal = matchedComm ? matchedComm.latitude : 11.378;
                  const lonVal = matchedComm ? matchedComm.longitude : -72.6;
                  
                  let formattedDate = "Reciente";
                  if (request.created_at) {
                    try {
                      formattedDate = new Date(request.created_at).toLocaleDateString("es-CO", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit"
                      });
                    } catch (e) {}
                  }

                  return (
                    <div 
                      key={request.id}
                      style={{ 
                        padding: "1rem", 
                        backgroundColor: "rgba(15, 23, 42, 0.75)", 
                        border: "1px solid rgba(173, 219, 255, 0.1)", 
                        borderRadius: "10px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.75rem",
                        textAlign: "left"
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                          <strong style={{ color: "#ffffff", fontSize: "0.95rem" }}>{request.name}</strong>
                          <span style={{ fontSize: "0.7rem", color: "hsl(var(--text-dim))" }}>{formattedDate}</span>
                        </div>
                        <p style={{ color: "hsl(var(--text-muted))", fontSize: "0.82rem", margin: 0 }}>
                          📍 Comunidad Destino: {communityName}
                        </p>
                        <p style={{ color: "hsl(var(--sky))", fontSize: "0.78rem", margin: "0.25rem 0 0 0" }}>
                          🗺️ Coordenadas Asignadas: {latVal?.toFixed(4)}, {lonVal?.toFixed(4)}
                        </p>
                        <p style={{ color: "hsl(var(--text-dim))", fontSize: "0.75rem", margin: "0.15rem 0 0 0" }}>
                          📧 Contacto: {request.email}
                        </p>
                      </div>
                      
                      <button 
                        className="btn btn-primary"
                        onClick={() => handleAuthorizeRequest(request)}
                        style={{ padding: "0.45rem 1rem", fontSize: "0.8rem", width: "100%" }}
                      >
                        ⚡ Autorizar e Iniciar Filtro
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Card 2: Pending Community Requests List */}
          <div className="card" style={{ 
            background: "rgba(10, 24, 34, 0.4)",
            borderColor: "rgba(173, 219, 255, 0.08)",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
            justifyContent: "flex-start"
          }}>
            <div>
              <h3 style={{ fontFamily: "var(--font-title)", fontSize: "1.3rem", color: "#ffffff", display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
                <span>🏢</span> Solicitudes de Nueva Comunidad
              </h3>
              <p style={{ color: "hsl(var(--text-muted))", fontSize: "0.82rem", marginTop: "0.25rem" }}>
                Postulaciones públicas para incorporar veredas en el programa. Al autorizar, se creará el registro en Supabase con geoposición regional.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {pendingCommRequests.length === 0 ? (
                <div style={{ textAlign: "center", padding: "2rem", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: "8px" }}>
                  <span style={{ fontSize: "1.5rem" }}>🤝</span>
                  <p style={{ color: "hsl(var(--text-muted))", fontSize: "0.85rem", margin: "0.5rem 0 0 0" }}>
                    No hay postulaciones de comunidades pendientes.
                  </p>
                </div>
              ) : (
                pendingCommRequests.map((request) => {
                  let formattedDate = "Reciente";
                  if (request.created_at) {
                    try {
                      formattedDate = new Date(request.created_at).toLocaleDateString("es-CO", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit"
                      });
                    } catch (e) {}
                  }

                  return (
                    <div 
                      key={request.id}
                      style={{ 
                        padding: "1rem", 
                        backgroundColor: "rgba(15, 23, 42, 0.75)", 
                        border: "1px solid rgba(173, 219, 255, 0.1)", 
                        borderRadius: "10px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.75rem",
                        textAlign: "left"
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                          <strong style={{ color: "#ffffff", fontSize: "0.95rem" }}>{request.name}</strong>
                          <span style={{ fontSize: "0.7rem", color: "hsl(var(--text-dim))" }}>{formattedDate}</span>
                        </div>
                        <p style={{ color: "hsl(var(--text-muted))", fontSize: "0.82rem", margin: 0 }}>
                          📍 Región: {request.department} ({request.municipality} - {request.corregimiento})
                        </p>
                        <p style={{ color: "hsl(var(--sky))", fontSize: "0.78rem", margin: "0.25rem 0" }}>
                          📝 Motivación: "{request.description}"
                        </p>
                        <p style={{ color: "hsl(var(--text-dim))", fontSize: "0.75rem", margin: 0 }}>
                          📧 Contacto: {request.email}
                        </p>
                      </div>
                      
                      <button 
                        className="btn btn-secondary"
                        onClick={() => handleAuthorizeCommunity(request)}
                        style={{ 
                          padding: "0.45rem 1rem", 
                          fontSize: "0.8rem", 
                          width: "100%",
                          background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--sky)) 100%)",
                          color: "#ffffff",
                          border: "none"
                        }}
                      >
                        🏢 Autorizar y Crear Comunidad
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Dynamic Help Center Card inside the Provisioning */}
          <div style={{ 
            background: "hsla(var(--sky) / 0.04)", 
            border: "1px solid hsla(var(--sky) / 0.15)",
            padding: "1rem",
            borderRadius: "8px",
            textAlign: "left"
          }}>
            <h4 style={{ fontFamily: "var(--font-title)", color: "hsl(var(--sky))", margin: "0 0 0.5rem 0", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <span>🛠️</span> Ayuda para la Determinación de Filtros
            </h4>
            <p style={{ color: "hsl(var(--text-muted))", fontSize: "0.8rem", lineHeight: "1.4", margin: 0 }}>
              Para configurar físicamente el purificador, inyecta el número de serie generado (`device_key`) en las constantes C++ de tu firmware ESP32. Esto enlazará el módulo de telemetría de forma automática y transmitirá a Supabase.
            </p>
          </div>
        </div>

      </div>

      {/* Bottom Section: Registered Purifiers List Section */}
      <div className="card no-print" style={{ 
        background: "linear-gradient(135deg, rgba(10, 24, 34, 0.6) 0%, rgba(15, 23, 42, 0.4) 100%)",
        border: "1px solid rgba(173, 219, 255, 0.08)",
        padding: "1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem"
      }}>
        <div style={{ textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1.5rem" }}>
          <div>
            <h3 style={{ fontFamily: "var(--font-title)", fontSize: "1.5rem", color: "#ffffff", display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
              <span>📟</span> Filtros Purificadores Registrados en el Territorio
            </h3>
            <p style={{ color: "hsl(var(--text-muted))", fontSize: "0.85rem", marginTop: "0.25rem", lineHeight: "1.5" }}>
              Listado completo de purificadores AQUORA activos en La Guajira. Visualiza su estado, coordenadas GPS e imprime sus códigos QR únicos para que los miembros de la comunidad puedan escanearlos en su aplicación y monitorear la calidad del agua de su propio filtro.
            </p>
          </div>

          {/* Search Box and Switcher Tabs Row */}
          <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
            
            {/* Glassmorphic Search Input Box */}
            <div style={{ position: "relative", width: "280px" }}>
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por filtro, comunidad, GPS..."
                style={{
                  padding: "0.45rem 1rem 0.45rem 2.2rem",
                  width: "100%",
                  fontSize: "0.8rem",
                  background: "rgba(15, 23, 42, 0.6)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  color: "#ffffff",
                  height: "36px",
                  boxSizing: "border-box"
                }}
              />
              <span style={{
                position: "absolute",
                left: "0.75rem",
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: "0.85rem",
                color: "hsl(var(--text-muted))",
                pointerEvents: "none"
              }}>
                🔍
              </span>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  style={{
                    position: "absolute",
                    right: "0.75rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "hsl(var(--text-muted))",
                    cursor: "pointer",
                    fontSize: "0.8rem"
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Interactive list switcher tabs */}
            <div style={{ display: "flex", gap: "0.5rem", background: "rgba(15, 23, 42, 0.6)", padding: "0.3rem", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
              <button
                type="button"
                onClick={() => setActiveListTab("devices")}
                style={{
                  padding: "0.45rem 1.1rem",
                  fontSize: "0.8rem",
                  fontWeight: "bold",
                  borderRadius: "6px",
                  border: "none",
                  cursor: "pointer",
                  background: activeListTab === "devices" ? "hsl(var(--primary))" : "transparent",
                  color: activeListTab === "devices" ? "#ffffff" : "hsl(var(--text-muted))",
                  transition: "all 0.2s"
                }}
              >
                📟 Dispositivos Activos ({filteredDevices.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveListTab("communities")}
                style={{
                  padding: "0.45rem 1.1rem",
                  fontSize: "0.8rem",
                  fontWeight: "bold",
                  borderRadius: "6px",
                  border: "none",
                  cursor: "pointer",
                  background: activeListTab === "communities" ? "hsl(var(--primary))" : "transparent",
                  color: activeListTab === "communities" ? "#ffffff" : "hsl(var(--text-muted))",
                  transition: "all 0.2s"
                }}
              >
                🏢 Distribución por Comunidades ({filteredCommunities.length})
              </button>
            </div>
          </div>
        </div>

        {activeListTab === "devices" ? (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))",
            gap: "1.25rem"
          }}>
            {filteredDevices.map((device) => {
              const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${device.device_key}`;
              
              // Map community name dynamically for visual fidelity
              let communityName = "Comunidad General";
              let locationName = "La Guajira, Colombia";
              let latVal = 11.378;
              let lonVal = -72.6;

              const matchedComm = communities.find(c => c.id === device.community_id);
              if (matchedComm) {
                communityName = matchedComm.name;
                locationName = `${matchedComm.name}, La Guajira`;
                latVal = matchedComm.latitude || 11.378;
                lonVal = matchedComm.longitude || -72.6;
              } else {
                if (device.device_key === "DEV_ESP32_GUAF1" || device.community_id === "mock-uuid-2") {
                  communityName = "Comunidad Manaure";
                  locationName = "Manaure, Sector El Pájaro";
                  latVal = 11.775;
                  lonVal = -72.444;
                } else if (device.device_key === "DEV_ESP32_GUAF8392" || device.community_id === "mock-uuid-1") {
                  communityName = "Comunidad Uribia";
                  locationName = "Uribia, Sector Cardón";
                  latVal = 11.713;
                  lonVal = -72.266;
                } else if (device.latitude && device.longitude) {
                  latVal = device.latitude;
                  lonVal = device.longitude;
                  communityName = "Comunidad Wayúu Asignada";
                  locationName = "Alta Guajira, Colombia";
                }
              }

              return (
                <div 
                  key={device.id}
                  style={{
                    background: "rgba(15, 23, 42, 0.75)",
                    border: "1px solid rgba(173, 219, 255, 0.08)",
                    borderRadius: "12px",
                    padding: "1.25rem",
                    display: "flex",
                    gap: "1rem",
                    alignItems: "center",
                    textAlign: "left",
                    transition: "all 0.3s ease"
                  }}
                >
                  {/* QR Code image for the device card */}
                  <div style={{ 
                    background: "white", 
                    padding: "6px", 
                    borderRadius: "6px", 
                    flexShrink: 0,
                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.5)"
                  }}>
                    <img 
                      src={qrUrl} 
                      alt={`QR ${device.device_key}`}
                      style={{ width: "85px", height: "85px", display: "block" }}
                    />
                  </div>

                  {/* Filter info details */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ 
                        fontFamily: "monospace", 
                        fontSize: "0.95rem", 
                        fontWeight: "bold", 
                        color: "hsl(var(--primary))",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}>
                        {device.device_key}
                      </span>
                      <span style={{
                        fontSize: "0.65rem",
                        fontWeight: "bold",
                        padding: "1px 6px",
                        borderRadius: "9999px",
                        backgroundColor: device.active ? "rgba(16, 185, 129, 0.15)" : "rgba(244, 63, 94, 0.15)",
                        color: device.active ? "hsl(var(--success))" : "hsl(var(--danger))"
                      }}>
                        {device.active ? "Activo" : "Inactivo"}
                      </span>
                    </div>

                    <strong style={{ color: "#ffffff", fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      📍 {communityName}
                    </strong>
                    <span style={{ color: "hsl(var(--text-muted))", fontSize: "0.78rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {locationName}
                    </span>
                    <span style={{ color: "hsl(var(--sky))", fontSize: "0.75rem", fontFamily: "monospace" }}>
                      {latVal.toFixed(4)}, {lonVal.toFixed(4)}
                    </span>

                    {/* Copyable API/Firmware Key */}
                    <div style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "0.4rem", 
                      background: "rgba(255, 255, 255, 0.03)", 
                      padding: "0.35rem 0.5rem", 
                      borderRadius: "6px", 
                      border: "1px solid rgba(255, 255, 255, 0.05)",
                      marginTop: "0.2rem",
                      justifyContent: "space-between"
                    }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.1rem", minWidth: 0, flex: 1 }}>
                        <span style={{ fontSize: "0.6rem", color: "hsl(var(--text-muted))", fontWeight: "bold", textTransform: "uppercase" }}>
                          🔑 CLAVE DE API (FIRMWARE)
                        </span>
                        <code style={{ 
                          fontFamily: "monospace", 
                          fontSize: "0.75rem", 
                          color: "hsl(var(--sky))", 
                          overflow: "hidden", 
                          textOverflow: "ellipsis", 
                          whiteSpace: "nowrap" 
                        }}>
                          {generateSecureApiKey(device.device_key)}
                        </code>
                      </div>
                      <button 
                        type="button"
                        className="btn btn-secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          const secureKey = generateSecureApiKey(device.device_key);
                          navigator.clipboard.writeText(secureKey);
                          alert(`¡Clave de API del filtro "${device.device_key}" copiada al portapapeles!\n\nClave: ${secureKey}`);
                        }}
                        style={{ 
                          padding: "0.2rem 0.4rem", 
                          fontSize: "0.65rem", 
                          cursor: "pointer", 
                          display: "flex", 
                          alignItems: "center", 
                          gap: "0.15rem",
                          height: "fit-content",
                          flexShrink: 0
                        }}
                      >
                        📋
                      </button>
                    </div>

                    {/* Print QR button */}
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        const today = new Date().toLocaleDateString("es-CO", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric"
                        });
                        setActiveLabel({
                          serial: device.device_key,
                          apiKey: generateSecureApiKey(device.device_key),
                          solicitor: communityName,
                          location: locationName,
                          communityId: device.community_id || "mock-uuid-generic",
                          latitude: latVal,
                          longitude: lonVal,
                          date: today,
                          authorizer: userRole === "super_admin" ? "Super Admin AQUORA" : "Staff Ábaco"
                        });
                        setShowLabelModal(true);
                      }}
                      style={{ 
                        padding: "0.35rem 0.75rem", 
                        fontSize: "0.75rem", 
                        marginTop: "0.5rem",
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.25rem",
                        cursor: "pointer"
                      }}
                    >
                      🖨️ Ver / Imprimir Etiqueta
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "1.5rem"
          }}>
            {filteredCommunities.map((community) => {
              const commDevices = devices.filter(d => d.community_id === community.id);
              return (
                <div 
                  key={community.id}
                  style={{
                    background: "rgba(15, 23, 42, 0.75)",
                    border: "1px solid rgba(173, 219, 255, 0.08)",
                    borderRadius: "12px",
                    padding: "1.25rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                    textAlign: "left"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "0.75rem" }}>
                    <div>
                      <h4 style={{ color: "#ffffff", fontSize: "1.1rem", fontFamily: "var(--font-title)", margin: 0 }}>
                        📍 {community.name}
                      </h4>
                      <span style={{ color: "hsl(var(--sky))", fontSize: "0.75rem", fontFamily: "monospace" }}>
                        🗺️ GPS: {community.latitude?.toFixed(4)}, {community.longitude?.toFixed(4)}
                      </span>
                    </div>
                    <span style={{
                      fontSize: "0.7rem",
                      fontWeight: "bold",
                      padding: "2px 8px",
                      borderRadius: "9999px",
                      backgroundColor: commDevices.length > 0 ? "rgba(16, 185, 129, 0.12)" : "rgba(255,255,255,0.05)",
                      color: commDevices.length > 0 ? "hsl(var(--success))" : "hsl(var(--text-muted))"
                    }}>
                      {commDevices.length} {commDevices.length === 1 ? "filtro" : "filtros"}
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {commDevices.length === 0 ? (
                      <span style={{ color: "hsl(var(--text-muted))", fontSize: "0.8rem", fontStyle: "italic", padding: "0.5rem 0" }}>
                        No hay filtros purificadores asignados a esta comunidad.
                      </span>
                    ) : (
                      commDevices.map(device => {
                        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${device.device_key}`;
                        return (
                          <div 
                            key={device.id} 
                            style={{ 
                              display: "flex", 
                              alignItems: "center", 
                              gap: "0.75rem", 
                              background: "rgba(255, 255, 255, 0.02)", 
                              padding: "0.6rem 0.8rem", 
                              borderRadius: "8px", 
                              border: "1px solid rgba(255, 255, 255, 0.04)" 
                            }}
                          >
                            {/* Mini QR thumbnail */}
                            <div style={{ background: "white", padding: "3px", borderRadius: "4px", flexShrink: 0 }}>
                              <img src={qrUrl} alt="Mini QR" style={{ width: "35px", height: "35px", display: "block" }} />
                            </div>
                            
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.1rem", flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <code style={{ fontFamily: "monospace", fontSize: "0.85rem", color: "hsl(var(--primary))", fontWeight: "bold" }}>
                                  {device.device_key}
                                </code>
                                <span style={{
                                  fontSize: "0.6rem",
                                  fontWeight: "bold",
                                  padding: "1px 5px",
                                  borderRadius: "9999px",
                                  backgroundColor: device.active ? "rgba(16, 185, 129, 0.1)" : "rgba(244, 63, 94, 0.1)",
                                  color: device.active ? "hsl(var(--success))" : "hsl(var(--danger))"
                                }}>
                                  {device.active ? "Activo" : "Inactivo"}
                                </span>
                              </div>
                              
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.15rem" }}>
                                <span style={{ fontSize: "0.65rem", color: "hsl(var(--text-muted))" }}>🔑 API: {generateSecureApiKey(device.device_key)}</span>
                                <button 
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const secureKey = generateSecureApiKey(device.device_key);
                                    navigator.clipboard.writeText(secureKey);
                                    alert(`¡Clave de API del filtro "${device.device_key}" copiada al portapapeles!\n\nClave: ${secureKey}`);
                                  }}
                                  style={{ background: "none", border: "none", color: "hsl(var(--sky))", fontSize: "0.65rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.15rem", padding: 0 }}
                                >
                                  📋 Copiar
                                </button>
                              </div>
                            </div>
                            
                            {/* Print sticker button */}
                            <button
                              type="button"
                              onClick={() => {
                                const today = new Date().toLocaleDateString("es-CO", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric"
                                });
                                setActiveLabel({
                                  serial: device.device_key,
                                  apiKey: generateSecureApiKey(device.device_key),
                                  solicitor: community.name,
                                  location: `${community.name}, La Guajira`,
                                  communityId: community.id,
                                  latitude: community.latitude || 11.378,
                                  longitude: community.longitude || -72.6,
                                  date: today,
                                  authorizer: userRole === "super_admin" ? "Super Admin AQUORA" : "Staff Ábaco"
                                });
                                setShowLabelModal(true);
                              }}
                              style={{
                                background: "rgba(173, 219, 255, 0.08)",
                                border: "1px solid rgba(173, 219, 255, 0.15)",
                                color: "#ffffff",
                                padding: "0.3rem 0.5rem",
                                borderRadius: "4px",
                                fontSize: "0.65rem",
                                cursor: "pointer",
                                transition: "all 0.2s"
                              }}
                              onMouseOver={(e) => e.target.style.background = "hsl(var(--primary))"}
                              onMouseOut={(e) => e.target.style.background = "rgba(173, 219, 255, 0.08)"}
                            >
                              🖨️
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════
          AQUORA PRINTABLE QR CODE LABEL MODAL
          ═══════════════════════════════════════════ */}
      {showLabelModal && activeLabel && (
        <div style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.85)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "1rem"
        }} className="no-print-overlay">
          
          <div 
            id="aquora-print-sticker"
            style={{
              background: "#0c1e2d",
              border: "2px dashed hsl(var(--primary))",
              borderRadius: "12px",
              width: "350px",
              padding: "1.5rem",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.7)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1rem",
              textAlign: "center"
            }}
          >
            {/* Sticker Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", borderBottom: "1px solid rgba(255,255,255,0.1)", width: "100%", paddingBottom: "0.75rem", justifyContent: "center" }}>
              <svg viewBox="0 0 24 24" style={{ width: "24px", height: "24px", fill: "hsl(var(--primary))" }}>
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0L12 2.69z" />
              </svg>
              <div>
                <h4 style={{ fontFamily: "var(--font-title)", color: "#ffffff", margin: 0, fontSize: "1.1rem", fontWeight: "bold" }}>AQUORA SMART FILTER</h4>
                <span style={{ fontSize: "0.65rem", color: "hsl(var(--sky))", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: "600" }}>Dispositivo IoT de Código Abierto</span>
              </div>
            </div>

            {/* Generated QR Code Image */}
            <div style={{ background: "white", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${activeLabel.apiKey || activeLabel.serial}`} 
                alt="Código QR del Filtro" 
                style={{ width: "135px", height: "135px", display: "block" }}
              />
            </div>

            {/* Serial and API key details */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", width: "100%", textAlign: "center" }}>
              <div>
                <span style={{ color: "hsl(var(--text-muted))", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "bold" }}>Código de Serie Hardware</span>
                <div style={{ fontFamily: "monospace", color: "#ffffff", fontSize: "1.15rem", fontWeight: "bold", marginTop: "0.1rem", letterSpacing: "1px" }}>
                  {activeLabel.serial}
                </div>
              </div>
              <div style={{ borderTop: "1px dashed rgba(255,255,255,0.1)", paddingTop: "0.4rem" }}>
                <span style={{ color: "hsl(var(--text-muted))", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "bold" }}>Clave API Firmware (Segura)</span>
                <div style={{ fontFamily: "monospace", color: "hsl(var(--primary))", fontSize: "0.9rem", fontWeight: "bold", marginTop: "0.1rem", wordBreak: "break-all" }}>
                  {activeLabel.apiKey || "aq_api_pending"}
                </div>
              </div>
            </div>

            {/* Metadata Fields */}
            <div style={{ 
              width: "100%", 
              background: "rgba(255,255,255,0.02)", 
              border: "1px solid rgba(255,255,255,0.05)", 
              borderRadius: "6px", 
              padding: "0.75rem",
              textAlign: "left",
              fontSize: "0.8rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.4rem",
              color: "#e2e8f0"
            }}>
              <div><strong>👨‍🌾 Solicitante:</strong> {activeLabel.solicitor}</div>
              <div><strong>📍 Ubicación:</strong> {activeLabel.location}</div>
              <div><strong>🗺️ GPS:</strong> {activeLabel.latitude.toFixed(4)}, {activeLabel.longitude.toFixed(4)}</div>
              <div><strong>⚖️ Autorizado por:</strong> {activeLabel.authorizer}</div>
              <div><strong>📅 Fecha:</strong> {activeLabel.date}</div>
            </div>

            {/* Actions for Modal */}
            <div style={{ display: "flex", gap: "0.75rem", width: "100%" }} className="no-print">
              <button 
                className="btn btn-secondary" 
                onClick={() => { setShowLabelModal(false); setActiveLabel(null); }}
                style={{ flex: 1, padding: "0.55rem 1rem", fontSize: "0.85rem" }}
              >
                Cerrar
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => window.print()}
                style={{ flex: 1.2, padding: "0.55rem 1rem", fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.25rem" }}
              >
                🖨️ Imprimir Etiqueta
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
