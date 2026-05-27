# Subfase 1.1: Setup del Backend (FastAPI + Supabase)
## Guía de Configuración y Ejecución Paso a Paso

Esta subfase inicializa la infraestructura del servidor de la API de AQUORA utilizando **FastAPI (Python)** y la integra con el backend de base de datos relacional de **Supabase**.

---

## 1. Requisitos Previos

Asegúrate de tener instalado en tu sistema local (Windows):
* **Python 3.10+** (Puedes verificarlo ejecutando `python --version` en PowerShell).

---

## 2. Inicialización del Entorno de Desarrollo (Paso a Paso)

Ejecuta los siguientes comandos desde la terminal en la raíz de tu espacio de trabajo para configurar el entorno virtual de Python:

```powershell
# 1. Navegar a la carpeta backend
cd E:\AQUORA\backend

# 2. Crear un entorno virtual de Python llamado 'venv'
python -m venv venv

# 3. Activar el entorno virtual en Windows PowerShell
.\venv\Scripts\Activate.ps1

# 4. Instalar las dependencias listadas en requirements.txt
pip install --upgrade pip
pip install -r requirements.txt
```

---

## 3. Configuración de Variables de Entorno

1. En la carpeta `E:\AQUORA\backend\`, encontrarás un archivo llamado `.env.example`.
2. Renombra este archivo a `.env`.
3. Reemplaza los valores con las credenciales de tu proyecto de Supabase (el walkthrough final detalla cómo crearlo si aún no lo tienes):
   ```env
   SUPABASE_URL="https://tu-proyecto.supabase.co"
   SUPABASE_KEY="tu-clave-service-role-o-anon-key"
   ```

---

## 4. Estructura de Código Base Inicial

El código base del backend está compuesto por:
1. `requirements.txt`: Contiene los paquetes (FastAPI, Uvicorn, Supabase, Pydantic).
2. `main.py`: Archivo principal con CORS habilitado para que tu app móvil (React Native) pueda realizar consultas de forma local sin problemas de seguridad de red.

---

## 5. Cómo Ejecutar el Backend en Local

Con tu entorno virtual activo (`venv`), levanta el servidor de desarrollo en caliente ejecutando:

```powershell
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

> [!TIP]
> Usar `--host 0.0.0.0` es **crucial** cuando programas para móviles. Esto permite que tu teléfono físico (Expo Go) o el emulador de Android Studio puedan descubrir y consumir el servidor local utilizando la dirección IP de tu computadora en la red local.

---

## 6. Verificación

Una vez encendido:
* Abre tu navegador e ingresa a `http://localhost:8000/`. Deberás ver la respuesta JSON de bienvenida.
* Ingresa a `http://localhost:8000/docs` para visualizar la documentación interactiva en Swagger y probar los endpoints.
