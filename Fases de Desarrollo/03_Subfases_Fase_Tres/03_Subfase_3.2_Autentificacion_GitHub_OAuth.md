# Subfase 3.2: Sistema de Autenticación de Código Abierto con GitHub OAuth y RBAC en Supabase

Esta subfase detalla el diseño de seguridad e identidad para proteger el Centro de Comando de AQUORA y brindar dashboards individualizados a miembros de la comunidad usando **GitHub OAuth** y un modelo de **Control de Acceso Basado en Roles (RBAC)**.

---

## 🔐 1. Flujo de Autenticación de Código Abierto (SSO)
Implementaremos inicio de sesión único (Single Sign-On) integrado directamente con el panel de Supabase Auth utilizando la API oficial de GitHub.

### Configuración en Supabase Auth:
1. Habilitar el proveedor de identidad **GitHub** en la consola de Supabase.
2. Configurar la URL de callback oficial en la configuración de la aplicación de desarrollador en GitHub (`https://<project-ref>.supabase.co/auth/v1/callback`).
3. Declarar de forma segura en las variables de entorno el `Client ID` y `Client Secret` generados.

---

## 🗄️ 2. Arquitectura de Base de Datos para RBAC (Supabase)
Manejaremos perfiles extendidos en la tabla pública vinculados dinámicamente con las identidades de Supabase.

### Tabla: `public.user_profiles`
| Columna | Tipo | Restricción | Descripción |
|---------|------|-------------|-------------|
| `id` | uuid | Primary Key, REFERENCES auth.users | ID de usuario de Supabase Auth |
| `email` | text | Unique | Correo del usuario |
| `full_name` | text | | Nombre completo recuperado de GitHub |
| `avatar_url` | text | | Foto de perfil de GitHub |
| `role` | text | Check ('admin', 'community_member') | Rol asignado (Default: `'community_member'`) |
| `device_id` | uuid | REFERENCES public.devices, Unique | Filtro asignado al miembro de la comunidad |
| `notification_preferences` | jsonb | | Preferencias de alertas para sensores |
| `created_at` | timestamptz | | Fecha de creación del perfil |

### Automatización con PostgreSQL Triggers:
Diseñaremos una función en PostgreSQL que se dispare automáticamente al insertar un usuario en `auth.users` (durante su primer login con GitHub) para duplicar y estructurar su registro en la tabla pública de perfiles:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, avatar_url, role)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    'community_member'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```
