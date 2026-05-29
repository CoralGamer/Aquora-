import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";

export default function MembersManagement({ getApiUrl, userProfile, onLogout }) {
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSubTab, setActiveSubTab] = useState("list"); // 'list' or 'audit'
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  
  // Modal states for deleting a user account
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // Edit member modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editDeviceIds, setEditDeviceIds] = useState([]);  // Array of device UUIDs
  const [allDevices, setAllDevices] = useState([]);
  const [allCommunities, setAllCommunities] = useState([]);
  const [editSaving, setEditSaving] = useState(false);

  // Fetch all users/members from our FastAPI backend
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/v1/admin/users`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        throw new Error("No se pudo obtener el listado de miembros.");
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setErrorMsg("Error al conectar con la base de datos de usuarios.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch all audit logs from SQLite via backend
  const fetchAuditLogs = async () => {
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/v1/admin/audit-logs`);
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data);
      }
    } catch (err) {
      console.error("Error fetching audit logs:", err);
    }
  };

  // Fetch devices and communities for the edit modal dropdown
  const fetchDevicesAndCommunities = async () => {
    try {
      const { data: devData } = await supabase.from("devices").select("id, device_key, community_id, active");
      const { data: commData } = await supabase.from("communities").select("id, name");
      if (devData) setAllDevices(devData);
      if (commData) setAllCommunities(commData);
    } catch (err) {
      console.error("Error fetching devices/communities:", err);
    }
  };

  // Open the edit modal for a user
  const openEditModal = (user) => {
    setEditUser(user);
    setEditName(user.full_name || "");
    setEditRole(user.role || "community_member");
    // Parse comma-separated device_id into array
    const ids = user.device_id ? user.device_id.split(",").map(s => s.trim()).filter(Boolean) : [];
    setEditDeviceIds(ids);
    setShowEditModal(true);
    setErrorMsg("");
    setSuccessMsg("");
  };

  // Add a device to the list
  const addDeviceToList = (deviceId) => {
    if (deviceId && !editDeviceIds.includes(deviceId)) {
      setEditDeviceIds(prev => [...prev, deviceId]);
    }
  };

  // Remove a device from the list
  const removeDeviceFromList = (deviceId) => {
    setEditDeviceIds(prev => prev.filter(id => id !== deviceId));
  };

  // Handle saving edits
  const handleEditSave = async () => {
    if (!editUser) return;
    setEditSaving(true);
    setErrorMsg("");
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/v1/admin/users/${editUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: editName,
          role: editRole,
          device_id: editDeviceIds.length > 0 ? editDeviceIds.join(",") : null
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Error al actualizar el perfil.");
      }
      setSuccessMsg(`Perfil de ${editUser.email} actualizado exitosamente.`);
      setShowEditModal(false);
      setEditUser(null);
      fetchUsers();
    } catch (err) {
      console.error("Edit user failed:", err);
      setErrorMsg(err.message || "Error de comunicación con el servidor.");
    } finally {
      setEditSaving(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchAuditLogs();
    fetchDevicesAndCommunities();
  }, []);

  // Check if current user has permission to delete the target user
  const canDeleteUser = (targetUser) => {
    if (!userProfile) return false;
    const actorRole = userProfile.role;
    const targetRole = targetUser.role;

    // A user cannot delete themselves here (they do it via Profile Tab "Dar de baja")
    if (userProfile.email === targetUser.email) return false;

    // Super Admin / Admin of AQUORA can delete anyone EXCEPT other super admins
    if (actorRole === "admin" || actorRole === "super_admin") {
      return targetRole !== "admin" && targetRole !== "super_admin";
    }

    // Ábaco NGO Staff can delete ONLY community members
    if (actorRole === "abaco_staff") {
      return targetRole === "community_member";
    }

    return false;
  };

  // Handle final deletion confirmation
  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const apiUrl = getApiUrl();
      // Prepare actor details for the audit log
      const actorEmail = userProfile?.email || "anonimo@aquora.org";
      const actorRole = userProfile?.role || "unknown";
      
      const queryParams = new URLSearchParams({
        actor_email: actorEmail,
        actor_role: actorRole,
        target_email: userToDelete.email,
        target_role: userToDelete.role
      });

      const res = await fetch(`${apiUrl}/api/v1/admin/users/${userToDelete.id}?${queryParams}`, {
        method: "DELETE"
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Fallo al eliminar la cuenta de usuario.");
      }

      setSuccessMsg(`La cuenta de ${userToDelete.email} ha sido eliminada exitosamente. Acción registrada en la bitácora.`);
      setShowDeleteModal(false);
      setUserToDelete(null);
      
      // Refresh
      fetchUsers();
      fetchAuditLogs();
    } catch (err) {
      console.error("Delete user failed:", err);
      setErrorMsg(err.message || "Fallo en la comunicación con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  // Filter members based on search
  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (u.full_name && u.full_name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.role && u.role.toLowerCase().includes(q))
    );
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      
      {/* Header and Sub-tab switcher */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(173, 219, 255, 0.15)", paddingBottom: "1rem" }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-title)", fontSize: "1.75rem", color: "hsl(var(--text-main))", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            👥 Miembros y Roles
          </h2>
          <p style={{ color: "hsl(var(--text-muted))", fontSize: "0.85rem", marginTop: "0.25rem", margin: 0 }}>
            Administración del personal en territorio y control auditado de accesos al ecosistema AQUORA.
          </p>
        </div>

        {/* Tab Buttons */}
        <div style={{ display: "flex", gap: "0.5rem", background: "rgba(15, 23, 42, 0.5)", padding: "0.3rem", borderRadius: "8px", border: "1px solid rgba(173, 219, 255, 0.1)" }}>
          <button 
            className={`btn ${activeSubTab === "list" ? "btn-primary" : "btn-secondary"}`}
            style={{ padding: "0.4rem 1rem", fontSize: "0.8rem" }}
            onClick={() => setActiveSubTab("list")}
          >
            📋 Listado ({filteredUsers.length})
          </button>
          
          {(userProfile?.role === "admin" || userProfile?.role === "super_admin" || userProfile?.role === "abaco_staff") && (
            <button 
              className={`btn ${activeSubTab === "audit" ? "btn-primary" : "btn-secondary"}`}
              style={{ padding: "0.4rem 1rem", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.4rem" }}
              onClick={() => setActiveSubTab("audit")}
            >
              📜 Bitácora de Auditoría
              <span style={{ fontSize: "0.7rem", background: "rgba(14, 165, 233, 0.2)", color: "#38bdf8", padding: "1px 6px", borderRadius: "10px" }}>
                {auditLogs.length}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      {successMsg && (
        <div style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "8px", padding: "1rem", color: "#4ade80", fontSize: "0.85rem" }}>
          ✓ {successMsg}
        </div>
      )}
      {errorMsg && (
        <div style={{ background: "rgba(244, 63, 94, 0.1)", border: "1px solid rgba(244, 63, 94, 0.3)", borderRadius: "8px", padding: "1rem", color: "#f87171", fontSize: "0.85rem" }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {/* SUBTAB 1: MEMBERS LIST */}
      {activeSubTab === "list" && (
        <div className="card" style={{ background: "linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(30, 41, 59, 0.6) 100%)", border: "1px solid rgba(173, 219, 255, 0.15)", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          
          {/* Search bar */}
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <input
                type="text"
                className="form-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar miembros por nombre, correo electrónico o rol..."
                style={{ paddingLeft: "2.5rem", height: "42px" }}
              />
              <span style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "hsl(var(--text-muted))" }}>🔍</span>
            </div>
            <button className="btn btn-secondary" onClick={fetchUsers} disabled={loading} style={{ height: "42px", padding: "0 1.25rem" }}>
              🔄 Recargar
            </button>
          </div>

          {/* Members Table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid rgba(173, 219, 255, 0.15)", color: "hsl(var(--text-muted))" }}>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: "bold" }}>Nombre Completo</th>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: "bold" }}>Correo Electrónico</th>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: "bold" }}>Rol del Ecosistema</th>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: "bold" }}>Filtro Vinculado</th>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: "bold", textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const isCurrent = userProfile && userProfile.email === u.email;
                  const allowedToDelete = canDeleteUser(u);

                  return (
                    <tr 
                      key={u.id} 
                      style={{ 
                        borderBottom: "1px solid rgba(173, 219, 255, 0.08)", 
                        background: isCurrent ? "rgba(14, 165, 233, 0.05)" : "transparent",
                        transition: "background 0.2s"
                      }}
                      onMouseEnter={(e) => { if (!isCurrent) e.currentTarget.style.background = "rgba(173, 219, 255, 0.03)" }}
                      onMouseLeave={(e) => { if (!isCurrent) e.currentTarget.style.background = "transparent" }}
                    >
                      <td style={{ padding: "1rem", fontWeight: "600", color: "#f8fafc" }}>
                        {u.full_name || "Miembro sin nombre"} {isCurrent && <span style={{ fontSize: "0.75rem", color: "hsl(var(--sky))", fontStyle: "italic" }}>(Tú)</span>}
                      </td>
                      <td style={{ padding: "1rem", color: "hsl(var(--text-main))" }}>
                        {u.email}
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <span className={`badge ${
                          u.role === "admin" || u.role === "super_admin"
                            ? "badge-danger"
                            : u.role === "abaco_staff"
                              ? "badge-warning"
                              : "badge-success"
                        }`}>
                          {u.role === "admin" || u.role === "super_admin"
                            ? "Admin AQUORA"
                            : u.role === "abaco_staff"
                              ? "NGO Staff Ábaco"
                              : "Miembro Comunidad"}
                        </span>
                      </td>
                      <td style={{ padding: "1rem", fontSize: "0.85rem" }}>
                        {(() => {
                          if (!u.device_id) return <span style={{ color: "hsl(var(--text-muted))" }}>Ninguno</span>;
                          const ids = u.device_id.split(",").filter(Boolean);
                          if (ids.length === 1) {
                            const dev = allDevices.find(d => d.id === ids[0]);
                            return <span style={{ fontFamily: "monospace", color: "hsl(var(--primary))" }}>{dev ? dev.device_key : ids[0].substring(0, 12) + "..."}</span>;
                          }
                          return (
                            <span style={{ 
                              background: "rgba(14, 165, 233, 0.1)", 
                              border: "1px solid rgba(14, 165, 233, 0.25)", 
                              borderRadius: "12px", 
                              padding: "0.2rem 0.6rem", 
                              fontSize: "0.8rem",
                              color: "hsl(var(--sky))",
                              fontWeight: "600"
                            }}>
                              {ids.length} filtros vinculados
                            </span>
                          );
                        })()}
                      </td>
                      <td style={{ padding: "1rem", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", alignItems: "center" }}>
                          {/* Edit button - visible for admins and staff */}
                          {(userProfile?.role === "admin" || userProfile?.role === "super_admin" || userProfile?.role === "abaco_staff") && !isCurrent && (
                            <button
                              className="btn btn-secondary"
                              style={{ 
                                padding: "0.3rem 0.75rem", 
                                fontSize: "0.75rem", 
                                color: "hsl(var(--sky))", 
                                borderColor: "rgba(56, 189, 248, 0.3)",
                                background: "rgba(56, 189, 248, 0.06)"
                              }}
                              onClick={() => openEditModal(u)}
                            >
                              ✏️ Editar
                            </button>
                          )}
                          {/* Delete button */}
                          {allowedToDelete ? (
                            <button
                              className="btn btn-secondary"
                              style={{ 
                                padding: "0.3rem 0.75rem", 
                                fontSize: "0.75rem", 
                                color: "hsl(var(--danger))", 
                                borderColor: "rgba(244, 63, 94, 0.3)",
                                background: "rgba(244, 63, 94, 0.06)"
                              }}
                              onClick={() => {
                                setUserToDelete(u);
                                setShowDeleteModal(true);
                              }}
                            >
                              🗑️ Eliminar
                            </button>
                          ) : (
                            !isCurrent && !(userProfile?.role === "admin" || userProfile?.role === "super_admin" || userProfile?.role === "abaco_staff") && (
                              <span style={{ fontSize: "0.75rem", color: "hsl(var(--text-muted))", fontStyle: "italic" }}>
                                Sin permisos
                              </span>
                            )
                          )}
                          {isCurrent && (
                            <span style={{ fontSize: "0.75rem", color: "hsl(var(--text-muted))", fontStyle: "italic" }}>
                              Tu propia cuenta
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ padding: "2rem", textAlign: "center", color: "hsl(var(--text-muted))", fontStyle: "italic" }}>
                      No se encontraron miembros registrados en esta búsqueda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Self-service box for community member giving up account */}
          {userProfile?.role === "community_member" && (
            <div style={{ 
              marginTop: "1.5rem", 
              background: "rgba(244, 63, 94, 0.06)", 
              border: "1px dashed rgba(244, 63, 94, 0.25)", 
              borderRadius: "10px", 
              padding: "1.25rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div>
                <h4 style={{ color: "hsl(var(--danger))", margin: 0, fontWeight: "bold" }}>⚠️ Sección de Baja Voluntaria</h4>
                <p style={{ color: "hsl(var(--text-muted))", fontSize: "0.8rem", margin: 0, marginTop: "0.25rem" }}>
                  Si ya no requieres acceso al ecosistema, puedes dar de baja tu cuenta de forma permanente. Esto removerá tus datos y se registrará en la bitácora de control.
                </p>
              </div>
              <button 
                className="btn btn-secondary" 
                style={{ color: "hsl(var(--danger))", borderColor: "rgba(244, 63, 94, 0.4)", padding: "0.5rem 1rem", fontSize: "0.8rem" }}
                onClick={() => {
                  setUserToDelete(userProfile);
                  setShowDeleteModal(true);
                }}
              >
                Dar de Baja mi Cuenta
              </button>
            </div>
          )}

        </div>
      )}

      {/* SUBTAB 2: AUDIT LOGS */}
      {activeSubTab === "audit" && (
        <div className="card" style={{ background: "linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(30, 41, 59, 0.6) 100%)", border: "1px solid rgba(173, 219, 255, 0.15)", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#f8fafc", fontFamily: "var(--font-title)" }}>
              📜 Historial de Auditoría de Cuentas (SQLite Control DB)
            </h3>
            <button className="btn btn-secondary" onClick={fetchAuditLogs} style={{ padding: "0.3rem 0.75rem", fontSize: "0.75rem" }}>
              🔄 Recargar Bitácora
            </button>
          </div>
          
          <p style={{ color: "hsl(var(--text-muted))", fontSize: "0.8rem", margin: 0 }}>
            Bitácora inalterable que registra quién dio de baja o eliminó a cada miembro, la fecha exacta y el rol involucrado. Cumple con la directiva RBAC de control territorial de AQUORA.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: "400px", overflowY: "auto", paddingRight: "0.5rem" }}>
            {auditLogs.map((log) => (
              <div 
                key={log.id} 
                style={{ 
                  background: "rgba(15, 23, 42, 0.7)", 
                  borderLeft: "4px solid #f43f5e", 
                  padding: "0.75rem 1rem", 
                  borderRadius: "0 8px 8px 0",
                  fontSize: "0.8rem"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                  <span style={{ fontWeight: "bold", color: "#f8fafc" }}>🚨 {log.action}</span>
                  <span style={{ color: "hsl(var(--text-muted))" }}>
                    {new Date(log.timestamp).toLocaleString("es-CO")}
                  </span>
                </div>
                <code style={{ color: "#38bdf8", display: "block", background: "rgba(0,0,0,0.3)", padding: "0.4rem 0.6rem", borderRadius: "4px", lineHeight: "1.4" }}>
                  {log.details}
                </code>
              </div>
            ))}

            {auditLogs.length === 0 && (
              <div style={{ padding: "2.5rem", textAlign: "center", color: "hsl(var(--text-muted))", fontStyle: "italic" }}>
                No se registran eventos de eliminación ni bajas voluntarias en la bitácora aún.
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {showDeleteModal && userToDelete && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(2, 6, 12, 0.8)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "1rem"
        }}>
          <div className="card animate-fade-in" style={{
            background: "linear-gradient(135deg, rgba(20, 30, 48, 0.95) 0%, rgba(36, 59, 85, 0.95) 100%)",
            border: "1px solid rgba(244, 63, 94, 0.3)",
            borderRadius: "16px",
            maxWidth: "480px",
            width: "100%",
            padding: "2rem",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)",
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", borderBottom: "1px solid rgba(244, 63, 94, 0.2)", paddingBottom: "0.75rem" }}>
              <span style={{ fontSize: "2rem" }}>⚠️</span>
              <h3 style={{ fontFamily: "var(--font-title)", fontSize: "1.25rem", color: "#f8fafc", fontWeight: "bold", margin: 0 }}>
                {userToDelete.id === userProfile?.id ? "Confirmar Baja Voluntaria" : "Confirmar Eliminación de Cuenta"}
              </h3>
            </div>

            <p style={{ color: "#e2e8f0", fontSize: "0.9rem", lineHeight: "1.5", margin: 0 }}>
              {userToDelete.id === userProfile?.id ? (
                <span>
                  ¿Estás completamente seguro de que deseas <strong>dar de baja tu cuenta</strong> de forma permanente en AQUORA? Esta acción eliminará tu acceso de inmediato, te desvinculará del sistema y cerrará tu sesión actual de forma irrevocable.
                </span>
              ) : (
                <span>
                  ¿Estás seguro de que deseas eliminar permanentemente la cuenta del usuario <strong>{userToDelete.full_name} ({userToDelete.email})</strong>?
                  <br /><br />
                  Esta acción es irreversible. Se registrará formalmente en la bitácora de auditoría inalterable de SQLite indicando que tú (<strong>{userProfile?.email}</strong>) ejecutaste esta eliminación.
                </span>
              )}
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => {
                  setShowDeleteModal(false);
                  setUserToDelete(null);
                }}
                disabled={loading}
              >
                Cancelar
              </button>
              
              <button 
                className="btn btn-primary"
                style={{ 
                  background: "rgba(244, 63, 94, 0.9)", 
                  borderColor: "#f43f5e", 
                  color: "#f8fafc",
                  boxShadow: "0 0 12px rgba(244, 63, 94, 0.4)"
                }}
                onClick={async () => {
                  if (userToDelete.id === userProfile?.id) {
                    // Handle self-delete
                    try {
                      setLoading(true);
                      const apiUrl = getApiUrl();
                      const queryParams = new URLSearchParams({
                        actor_email: userToDelete.email,
                        actor_role: userToDelete.role,
                        target_email: userToDelete.email,
                        target_role: userToDelete.role
                      });
                      
                      const res = await fetch(`${apiUrl}/api/v1/admin/users/${userToDelete.id}?${queryParams}`, {
                        method: "DELETE"
                      });

                      if (res.ok) {
                        alert("Tu cuenta ha sido dada de baja exitosamente. Sesión cerrada.");
                        onLogout(); // Log out current user
                      } else {
                        throw new Error("No se pudo dar de baja la cuenta.");
                      }
                    } catch (err) {
                      setErrorMsg(err.message || "Fallo en la comunicación con el servidor.");
                      setShowDeleteModal(false);
                    } finally {
                      setLoading(false);
                    }
                  } else {
                    handleDeleteConfirm();
                  }
                }}
                disabled={loading}
              >
                {loading ? "Procesando..." : (userToDelete.id === userProfile?.id ? "Sí, Dar de Baja" : "Sí, Eliminar Cuenta")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MEMBER MODAL */}
      {showEditModal && editUser && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(2, 6, 12, 0.8)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "1rem"
        }}>
          <div className="card animate-fade-in" style={{
            background: "linear-gradient(135deg, rgba(20, 30, 48, 0.97) 0%, rgba(36, 59, 85, 0.97) 100%)",
            border: "1px solid rgba(56, 189, 248, 0.3)",
            borderRadius: "16px",
            maxWidth: "560px",
            width: "100%",
            padding: "2rem",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)",
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem",
            maxHeight: "90vh",
            overflowY: "auto"
          }}>
            {/* Modal Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", borderBottom: "1px solid rgba(56, 189, 248, 0.2)", paddingBottom: "0.75rem" }}>
              <span style={{ fontSize: "1.75rem" }}>✏️</span>
              <div>
                <h3 style={{ fontFamily: "var(--font-title)", fontSize: "1.25rem", color: "#f8fafc", fontWeight: "bold", margin: 0 }}>
                  Editar Miembro
                </h3>
                <p style={{ color: "hsl(var(--text-muted))", fontSize: "0.8rem", margin: 0 }}>
                  {editUser.email}
                </p>
              </div>
            </div>

            {/* Name Field */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label className="form-label" style={{ fontSize: "0.85rem", fontWeight: "bold", color: "hsl(var(--text-main))" }}>Nombre Completo</label>
              <input
                type="text"
                className="form-input"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Nombre del miembro"
                style={{ height: "42px" }}
              />
            </div>

            {/* Role Field */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label className="form-label" style={{ fontSize: "0.85rem", fontWeight: "bold", color: "hsl(var(--text-main))" }}>Rol del Ecosistema</label>
              <select
                className="form-input"
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
                style={{ height: "42px" }}
              >
                <option value="community_member">Miembro Comunidad</option>
                <option value="abaco_staff">NGO Staff Ábaco</option>
                <option value="admin">Admin AQUORA</option>
              </select>
            </div>

            {/* Device Assignment - Multi-device chips + Add dropdown */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label className="form-label" style={{ fontSize: "0.85rem", fontWeight: "bold", color: "hsl(var(--text-main))" }}>
                Filtros / Sensores IoT Vinculados
              </label>
              <p style={{ color: "hsl(var(--text-muted))", fontSize: "0.75rem", margin: 0 }}>
                Gestiona los dispositivos (purificadores) asignados a este miembro. Puedes agregar o quitar filtros.
              </p>

              {/* Assigned device chips */}
              {editDeviceIds.length > 0 ? (
                <div style={{ 
                  display: "flex", flexWrap: "wrap", gap: "0.4rem", 
                  padding: "0.6rem", 
                  background: "rgba(14, 165, 233, 0.05)", 
                  border: "1px solid rgba(14, 165, 233, 0.15)", 
                  borderRadius: "8px",
                  minHeight: "44px"
                }}>
                  {editDeviceIds.map(devId => {
                    const dev = allDevices.find(d => d.id === devId);
                    const commMap = {};
                    allCommunities.forEach(c => { commMap[c.id] = c.name; });
                    const commName = dev ? commMap[dev.community_id] : "";
                    return (
                      <div key={devId} style={{
                        display: "inline-flex", alignItems: "center", gap: "0.4rem",
                        background: "rgba(14, 165, 233, 0.12)",
                        border: "1px solid rgba(14, 165, 233, 0.3)",
                        borderRadius: "20px",
                        padding: "0.25rem 0.5rem 0.25rem 0.7rem",
                        fontSize: "0.78rem",
                        color: "hsl(var(--sky))",
                        fontFamily: "monospace",
                        transition: "all 0.2s"
                      }}>
                        <span title={commName ? `Comunidad: ${commName}` : ""}>
                          {dev ? dev.device_key : devId.substring(0, 12) + "..."}
                        </span>
                        {commName && (
                          <span style={{ fontSize: "0.65rem", color: "hsl(var(--text-muted))", fontFamily: "var(--font-body)" }}>
                            ({commName})
                          </span>
                        )}
                        <button
                          onClick={() => removeDeviceFromList(devId)}
                          style={{
                            background: "rgba(244, 63, 94, 0.15)",
                            border: "1px solid rgba(244, 63, 94, 0.3)",
                            borderRadius: "50%",
                            width: "20px", height: "20px",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            cursor: "pointer",
                            color: "#f87171",
                            fontSize: "0.7rem",
                            fontWeight: "bold",
                            padding: 0,
                            lineHeight: 1,
                            transition: "all 0.15s"
                          }}
                          title="Quitar este filtro"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ 
                  padding: "0.75rem", 
                  background: "rgba(100, 116, 139, 0.08)", 
                  border: "1px dashed rgba(100, 116, 139, 0.25)", 
                  borderRadius: "8px",
                  textAlign: "center",
                  color: "hsl(var(--text-muted))",
                  fontSize: "0.8rem"
                }}>
                  Sin filtros asignados. Usa el selector de abajo para agregar.
                </div>
              )}

              {/* Add device dropdown */}
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <select
                  className="form-input"
                  value=""
                  onChange={(e) => {
                    if (e.target.value) addDeviceToList(e.target.value);
                  }}
                  style={{ height: "42px", fontFamily: "monospace", fontSize: "0.85rem", flex: 1 }}
                >
                  <option value="">+ Agregar filtro / sensor...</option>
                  {(() => {
                    const commMap = {};
                    allCommunities.forEach(c => { commMap[c.id] = c.name; });
                    const grouped = {};
                    allDevices.forEach(d => {
                      if (editDeviceIds.includes(d.id)) return; // Skip already assigned
                      const commName = commMap[d.community_id] || "Sin Comunidad";
                      if (!grouped[commName]) grouped[commName] = [];
                      grouped[commName].push(d);
                    });
                    return Object.entries(grouped).map(([commName, devs]) => (
                      <optgroup key={commName} label={commName}>
                        {devs.map(d => (
                          <option key={d.id} value={d.id}>
                            {d.device_key}
                          </option>
                        ))}
                      </optgroup>
                    ));
                  })()}
                </select>
              </div>

              {/* Summary */}
              {editDeviceIds.length > 0 && (
                <div style={{ 
                  background: "rgba(14, 165, 233, 0.08)", 
                  border: "1px solid rgba(14, 165, 233, 0.2)", 
                  padding: "0.5rem 0.75rem", 
                  borderRadius: "8px",
                  fontSize: "0.8rem",
                  color: "hsl(var(--sky))"
                }}>
                  <strong>{editDeviceIds.length}</strong> filtro{editDeviceIds.length !== 1 ? "s" : ""} vinculado{editDeviceIds.length !== 1 ? "s" : ""} a esta cuenta
                </div>
              )}
            </div>

            {/* Error inside modal */}
            {errorMsg && (
              <div style={{ background: "rgba(244, 63, 94, 0.1)", border: "1px solid rgba(244, 63, 94, 0.3)", borderRadius: "8px", padding: "0.75rem", color: "#f87171", fontSize: "0.8rem" }}>
                ⚠️ {errorMsg}
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => {
                  setShowEditModal(false);
                  setEditUser(null);
                  setErrorMsg("");
                }}
                disabled={editSaving}
              >
                Cancelar
              </button>
              <button 
                className="btn btn-primary"
                style={{ 
                  background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--ocean)))",
                  boxShadow: "0 0 12px rgba(14, 165, 233, 0.3)"
                }}
                onClick={handleEditSave}
                disabled={editSaving || !editName.trim()}
              >
                {editSaving ? "Guardando..." : "💾 Guardar Cambios"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
