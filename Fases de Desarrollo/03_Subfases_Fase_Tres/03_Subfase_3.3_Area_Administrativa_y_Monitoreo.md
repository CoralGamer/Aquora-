# Subfase 3.3: Área Administrativa Protegida y Dashboards Individuales con Notificaciones

Esta subfase detalla el desarrollo de los tableros de control protegidos, segregando las pantallas del frontend según el rol autenticado de cada usuario y habilitando la configuración de alertas en Supabase.

---

## 📊 1. Área Administrativa (Rol: `admin`)
Solo accesible para usuarios autenticados cuyo perfil (`user_profiles.role`) sea `'admin'`.

### Componentes Protegidos:
* **Mapa Territorial de Riesgo:** El mapa Leaflet interactivo ampliado de 580px con control de calor epidemiológico cruzado con SIVIGILA.
* **TelemetryCharts (Recharts Global):** Acceso a las curvas de tendencia históricas de todas las 8 comunidades de La Guajira.
* **Visor 3D Interactivo:** Acceso a los planos del filtro inteligente.
* **Gestión de Dispositivos:** Panel para aprobar y activar nuevas claves de dispositivo (`device_keys`) solicitadas por el público en el formulario de la sección Open Source.

---

## 🏠 2. Dashboard de Miembro de la Comunidad (Rol: `community_member`)
Solo accesible para usuarios autenticados cuyo perfil tenga el rol `'community_member'`.

### Características Individualizadas:
1. **Monitoreo de Filtro Asignado:** Muestra únicamente las lecturas en tiempo real de su propio dispositivo familiar (basándose en el `device_id` enlazado en su perfil).
   * Visualización simplificada del nivel de agua del tanque.
   * Visualización del índice de pureza en sólidos TDS (ppm) y turbidez física (NTU).
2. **Alertas de Calidad de Agua en Pantalla:**
   * Mensajes urgentes como: *"⚠️ ¡Tu agua requiere filtrado! TDS superior a 400 ppm. Por favor revisa el estado del bagazo de caña o zeolita activa"*.
3. **Panel de Notificaciones y Umbrales:**
   * Formulario interactivo donde el miembro de la comunidad puede ajustar sus umbrales personalizados de alarma (ej: *"Notificarme si el TDS supera los 400 ppm o si el nivel del tanque cae por debajo de 20%"*).
   * Selección de canales de comunicación preferidos (Correo electrónico o WhatsApp). Las preferencias se guardan en la columna `notification_preferences` en formato JSONB en Supabase.
