import React, { useState } from "react";
import { supabase } from "../services/supabaseClient";

export default function UserProfile({ userProfile, onLogout }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg("");
    setErrorMsg("");

    if (newPassword !== confirmPassword) {
      setErrorMsg("Las contraseñas no coinciden. Por favor ingresa el mismo valor en ambos campos.");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setSuccessMsg("¡Contraseña actualizada exitosamente! Usa esta nueva clave en tu próximo inicio de sesión.");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("Failed changing password:", err);
      setErrorMsg("Ocurrió un error al actualizar tu contraseña. Asegúrate de ingresar una clave de mínimo 6 caracteres.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "2.5rem" }}>
      
      {/* Left Card: Account Information */}
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <h3 style={{ fontFamily: "var(--font-title)", fontSize: "1.35rem", color: "hsl(var(--text-main))", borderBottom: "1px solid hsl(var(--border-light))", paddingBottom: "0.75rem", margin: 0 }}>
          👤 Información de tu Cuenta
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", fontSize: "0.95rem" }}>
          <div>
            <span style={{ fontSize: "0.75rem", color: "hsl(var(--text-dark))", textTransform: "uppercase", fontWeight: "bold" }}>Nombre Completo</span>
            <div style={{ color: "hsl(var(--text-main))", fontWeight: "bold", marginTop: "0.25rem" }}>{userProfile.full_name || "Miembro de la Comunidad"}</div>
          </div>

          <div>
            <span style={{ fontSize: "0.75rem", color: "hsl(var(--text-dark))", textTransform: "uppercase", fontWeight: "bold" }}>Correo Electrónico</span>
            <div style={{ color: "hsl(var(--text-main))", marginTop: "0.25rem" }}>{userProfile.email}</div>
          </div>

          <div>
            <span style={{ fontSize: "0.75rem", color: "hsl(var(--text-dark))", textTransform: "uppercase", fontWeight: "bold" }}>Rol asignado</span>
            <div style={{ marginTop: "0.25rem" }}>
              <span className={`badge ${userProfile.role === "admin" ? "badge-danger" : "badge-success"}`}>
                {userProfile.role === "admin" ? "Administrador Ábaco" : "Miembro de la Comunidad"}
              </span>
            </div>
          </div>

          {userProfile.device_id && (
            <div>
              <span style={{ fontSize: "0.75rem", color: "hsl(var(--text-dark))", textTransform: "uppercase", fontWeight: "bold" }}>ID Filtro Asociado</span>
              <div style={{ color: "hsl(var(--primary))", fontFamily: "monospace", fontWeight: "bold", marginTop: "0.25rem" }}>
                {userProfile.device_id}
              </div>
            </div>
          )}
        </div>

        <button className="btn btn-secondary" style={{ marginTop: "1rem", color: "hsl(var(--danger))", borderColor: "hsla(var(--danger) / 0.3)" }} onClick={onLogout}>
          🚪 Cerrar Sesión
        </button>
      </div>

      {/* Right Card: Change Password Form */}
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <h3 style={{ fontFamily: "var(--font-title)", fontSize: "1.35rem", color: "hsl(var(--text-main))", borderBottom: "1px solid hsl(var(--border-light))", paddingBottom: "0.75rem", margin: 0 }}>
          🔒 Cambiar Contraseña
        </h3>
        
        <p style={{ color: "hsl(var(--text-muted))", fontSize: "0.85rem", lineHeight: "1.4", margin: 0 }}>
          Si estás ingresando con la contraseña temporal proveída por tu administrador, te sugerimos cambiarla por una clave personal secreta de inmediato.
        </p>

        <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Nueva Contraseña</label>
            <input 
              type="password" 
              className="form-input" 
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)} 
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
              disabled={loading}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Confirmar Nueva Contraseña</label>
            <input 
              type="password" 
              className="form-input" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              placeholder="Ingresa la clave nuevamente"
              required
              minLength={6}
              disabled={loading}
            />
          </div>

          {successMsg && (
            <div style={{ color: "hsl(var(--success))", fontSize: "0.85rem", fontWeight: "bold" }}>
              ✓ {successMsg}
            </div>
          )}

          {errorMsg && (
            <div style={{ color: "hsl(var(--danger))", fontSize: "0.85rem", lineHeight: "1.4" }}>
              ⚠️ {errorMsg}
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: "100%", marginTop: "0.5rem" }}
            disabled={loading}
          >
            {loading ? "Actualizando..." : "Actualizar Contraseña"}
          </button>

        </form>
      </div>

    </div>
  );
}
