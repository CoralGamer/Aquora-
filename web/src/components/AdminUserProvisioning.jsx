import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";

export default function AdminUserProvisioning({ getApiUrl }) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("community_member");
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Fetch all devices from Supabase on mount to populate the assignment dropdown
  useEffect(() => {
    supabase
      .from("devices")
      .select("id, device_key, active")
      .then(({ data, error }) => {
        if (!error && data) {
          setDevices(data);
        }
      });
  }, []);

  // Handle creating a new community user via the secure FastAPI backend gatekeeper
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
        device_id: selectedDeviceId || null
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
      setSelectedDeviceId("");
      setRole("community_member");
    } catch (err) {
      console.error("User creation failed:", err);
      setErrorMsg(err.message || "Fallo en la comunicación con el servidor backend seguro.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "2.5rem" }}>
      
      {/* Left Card: Account Provisioning Form */}
      <div className="card" style={{ 
        background: "linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.6) 100%)",
        border: "1px solid hsla(var(--primary) / 0.15)"
      }}>
        <h3 style={{ fontFamily: "var(--font-title)", fontSize: "1.5rem", color: "hsl(var(--text-main))", marginBottom: "0.5rem" }}>
          👥 Aprovisionar Nueva Cuenta comunitaria
        </h3>
        <p style={{ color: "hsl(var(--text-muted))", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
          Crea de forma centralizada una cuenta de acceso para un nuevo administrador o una familia en territorio. El sistema registrará el correo, generará un perfil en Supabase y enlazará su filtro inteligente de forma 100% segura.
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
                  <option value="admin" style={{ background: "#0f172a", color: "#f8fafc" }}>Administrador (Ábaco)</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Asignación de Filtro Inteligente (Opcional)</label>
              <select 
                className="form-input"
                style={{ background: "rgba(15, 23, 42, 0.95)", border: "1px solid hsl(var(--border-light))", color: "hsl(var(--text-main))", cursor: "pointer" }}
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                disabled={loading}
              >
                <option value="" style={{ background: "#0f172a", color: "#f8fafc" }}>Ninguno - Solo crear cuenta</option>
                {devices.map((d) => (
                  <option key={d.id} value={d.id} style={{ background: "#0f172a", color: "#f8fafc" }}>
                    {d.device_key} {d.active ? "(Activo)" : "(Pendiente de Aprobación)"}
                  </option>
                ))}
              </select>
            </div>

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

      {/* Right Card: Role description info */}
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1.25rem", justifyContent: "center" }}>
        <h4 style={{ fontFamily: "var(--font-title)", color: "hsl(var(--primary))", margin: 0 }}>🛡️ Ciberseguridad de Secretos</h4>
        <p style={{ color: "hsl(var(--text-muted))", fontSize: "0.85rem", lineHeight: "1.5", margin: 0 }}>
          Este formulario **no interactúa directamente con Supabase** desde el navegador usando llaves maestras inseguras. En su lugar, envía la solicitud al backend en **FastAPI**, el cual valida tus permisos de administrador y ejecuta la creación de cuentas del lado del servidor de forma protegida.
        </p>
        
        <h4 style={{ fontFamily: "var(--font-title)", color: "hsl(var(--success))", margin: 0 }}>👥 Roles y Privilegios</h4>
        <p style={{ color: "hsl(var(--text-muted))", fontSize: "0.85rem", lineHeight: "1.5", margin: 0 }}>
          * **Miembro de la Comunidad:** Tiene restringido el mapa global de calor. Solo puede ver las lecturas en tiempo real de su filtro asignado, recibir notificaciones y cambiar su clave.
        </p>
        <p style={{ color: "hsl(var(--text-muted))", fontSize: "0.85rem", lineHeight: "1.5", margin: 0 }}>
          * **Administrador (Fundación Ábaco):** Acceso total al mapa global de 580px, historial de sensores, visor 3D, y potestad de crear cuentas comunitarias y activar nuevos dispositivos.
        </p>
      </div>

    </div>
  );
}
