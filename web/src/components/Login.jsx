import React, { useState } from "react";
import { supabase } from "../services/supabaseClient";

export default function Login({ onAuthSuccess, onCancel }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.session) {
        onAuthSuccess(data.session);
      }
    } catch (err) {
      console.error("Login failed:", err);
      setErrorMsg("Credenciales de acceso incorrectas. Por favor verifica tu correo y contraseña.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      maxWidth: "420px", 
      width: "100%", 
      margin: "4rem auto", 
      display: "flex", 
      flexDirection: "column", 
      gap: "1.5rem" 
    }}>
      
      <div className="card" style={{ 
        padding: "2.5rem 2.25rem",
        background: "linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.6) 100%)",
        border: "1px solid hsla(var(--primary) / 0.15)",
        boxShadow: "0 20px 40px -15px rgba(0,0,0,0.7), var(--shadow-glow)"
      }}>
        
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h2 style={{ fontFamily: "var(--font-title)", fontSize: "1.75rem", color: "hsl(var(--text-main))", fontWeight: "bold" }}>
            🔑 Iniciar Sesión
          </h2>
          <p style={{ color: "hsl(var(--text-muted))", fontSize: "0.85rem", marginTop: "0.4rem" }}>
            Acceso seguro para Administradores de Ábaco y Miembros de la Comunidad
          </p>
        </div>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Correo Electrónico</label>
            <input 
              type="email" 
              className="form-input" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="correo@ejemplo.com"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Contraseña</label>
            <input 
              type="password" 
              className="form-input" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••"
              required
              disabled={loading}
            />
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

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              style={{ flex: 1 }}
              onClick={onCancel}
              disabled={loading}
            >
              Volver
            </button>
            
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ flex: 1.5 }}
              disabled={loading}
            >
              {loading ? "Ingresando..." : "Entrar 🚀"}
            </button>
          </div>

        </form>

      </div>

    </div>
  );
}
