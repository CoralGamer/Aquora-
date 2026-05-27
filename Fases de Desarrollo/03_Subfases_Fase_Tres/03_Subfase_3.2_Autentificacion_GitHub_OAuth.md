# Subfase 3.2: Sistema de Autenticación con Supabase Auth (Email/Password), Creación de Cuentas Administrativas y RBAC

Esta subfase detalla el diseño de seguridad, identidad y aprovisionamiento de cuentas de **AQUORA** utilizando la infraestructura nativa de **Supabase Auth** basada en Correo y Contraseña, eliminando dependencias externas y permitiendo un control administrativo absoluto.

---

## 🔐 1. ¿Por qué Supabase Auth (Email/Password) es mejor en este caso?

* **Independencia Tecnológica:** Los miembros de las comunidades indígenas y rurales en La Guajira no poseen cuentas de GitHub ni perfiles de desarrollador. Utilizar autenticación directa por Correo y Contraseña garantiza una accesibilidad total.
* **Aprovisionamiento Administrativo:** Permite a la Fundación Ábaco crear de forma centralizada cuentas para administradores y miembros de la comunidad con un **correo electrónico y una contraseña temporal**, agilizando el despliegue en territorio.
* **Flujo de Cambio de Contraseña:** Facilita que los usuarios inicien sesión con la contraseña temporal proveída y la actualicen por una privada dentro de su panel de perfil.

---

## 🗄️ 2. Arquitectura de Base de Datos para RBAC y Perfiles

Manejaremos la tabla pública de perfiles vinculada dinámicamente con los usuarios registrados en Supabase Auth (`auth.users`).

### Tabla: `public.user_profiles`
* `id` (uuid, primary key, REFERENCES auth.users ON DELETE CASCADE): ID único asignado por Supabase Auth.
* `email` (text, unique): Correo electrónico de acceso.
* `full_name` (text): Nombre completo del usuario.
* `role` (text, check role IN ('admin', 'community_member')): Rol de acceso.
  * `'admin'`: Miembros de la Fundación Ábaco con control total.
  * `'community_member'`: Familias y líderes comunitarios con acceso a un único sensor.
* `device_id` (uuid, REFERENCES public.devices, Unique, nullable): Dispositivo hídrico asignado al miembro de la comunidad.
* `notification_preferences` (jsonb): Configuración de alertas (Correo/WhatsApp) y umbrales de alarma.
* `created_at` (timestamp with time zone).

---

## ⚙️ 3. Aprovisionamiento Seguro de Cuentas (Admin Service)

Para permitir que los administradores creen cuentas directamente desde su panel:

1. **Supabase Admin Client:** El backend en FastAPI o la consola administrativa utilizarán la API de Servicio Especial de Supabase (`supabase.auth.admin`) empleando la `Service Role Key` de forma segura (nunca expuesta al frontend público).
2. **Método de Creación:**
   ```python
   # Simulación de la creación administrativa de usuario
   admin_client.auth.admin.create_user({
     "email": "familiar.uribia@aquora.org",
     "password": "TemporalPassword123!", # Contraseña temporal
     "email_confirm": True, # Auto-confirmar para evitar esperas de correo
     "user_metadata": { "full_name": "Familia Pushaina" }
   })
   ```
3. **Trigger de Automatización:** Al insertarse en `auth.users`, un trigger en PostgreSQL asocia inmediatamente el perfil del nuevo usuario en `public.user_profiles` con su rol correspondiente y enlaza su `device_id` asignado.
