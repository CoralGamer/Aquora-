# Subfase 3.3: Área Administrativa Protegida, Creación de Cuentas de la Comunidad y Dashboards Individuales

Esta subfase detalla el desarrollo de los tableros de control protegidos para administradores y miembros de la comunidad, incluyendo el **Módulo de Aprovisionamiento de Cuentas por correo** y la **Interfaz de Configuración de Perfil** para el cambio de contraseñas.

---

## 📊 1. Área Administrativa (Rol: `admin`)
Solo accesible para usuarios autenticados cuyo perfil (`user_profiles.role`) sea `'admin'`.

### Componentes de Monitoreo Global:
* **Mapa de Riesgo Territorial Gigante (580px):** Mapa interactivo con Leaflet.js para vigilancia de las 8 comunidades.
* **TelemetryCharts (Recharts Global):** Visualización de curvas de tendencia históricas de todas las comunidades.

### 🆕 Módulo de Aprovisionamiento de Cuentas y Asignación de Filtros:
Un formulario administrativo interactivo exclusivo para la Fundación Ábaco que permite:
1. **Ingresar Correo y Nombre:** Para el nuevo miembro de la comunidad o nuevo administrador.
2. **Definir Contraseña Temporal:** Generada automáticamente o ingresada manualmente (ej: `Aquora2026!`).
3. **Asignación de Dispositivo IoT:** Menú desplegable dinámico que consulta la tabla `devices` y permite asociar de forma exclusiva un filtro físico (`device_id`) a esta nueva cuenta.
4. **Envío y Registro Directo:** Llama a la API de Supabase Admin para registrar al usuario, confirmando su cuenta de inmediato y guardándolo en `public.user_profiles` con su rol (`community_member` o `admin`) y enlace de sensor.

---

## 🏠 2. Dashboard de Miembro de la Comunidad (Rol: `community_member`)
Solo accesible para usuarios autenticados cuyo perfil tenga el rol `'community_member'`.

### Características Individuales:
* **Mi Filtro Familiar:** Muestra en tiempo real las lecturas de TDS, turbidez y nivel únicamente del `device_id` enlazado en su cuenta de usuario.
* **Alertas Sanitarias:** Notificación en pantalla si el agua supera los límites saludables de pureza.

---

## ⚙️ 3. Interfaz de Configuración de Perfil y Cambio de Contraseña

Tanto los administradores como los miembros de la comunidad tendrán acceso a una pestaña de **"Mi Perfil"** en el portal web (y app móvil) que permite:

1. **Gestión de Identidad:** Visualizar su nombre, correo, rol y el ID de su dispositivo hídrico enlazado.
2. **Cambio de Contraseña Seguro:**
   * Un formulario interactivo para ingresar su contraseña actual, nueva contraseña y confirmación.
   * Llama de forma directa y segura a la API de Supabase Auth:
     ```javascript
     const handleUpdatePassword = async (newPassword) => {
       const { error } = await supabase.auth.updateUser({
         password: newPassword
       });
       if (!error) alert("¡Contraseña actualizada con éxito!");
     };
     ```
   * Esto permite que el usuario reemplace la contraseña temporal asignada por el administrador en su primer inicio de sesión.
