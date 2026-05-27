# Subfase 1.2: Setup de la App Móvil (React Native Expo)
## Guía de Configuración, Emulación y Recarga en Vivo

Esta subfase inicializa la aplicación móvil de AQUORA utilizando **React Native con Expo**, preparándola para correr en vivo en el emulador de **Android Studio** o en un dispositivo físico con **Expo Go**.

---

## 1. Requisitos Previos

Asegúrate de tener instalado en tu sistema local:
* **Node.js** (Versión 18 o superior recomendada. Verifica con `node --version`).
* **Android Studio** (Con un dispositivo virtual instalado y configurado).
* **SDK de Android** y variables de entorno configuradas:
  * Abre PowerShell y asegúrate de que la ruta de tu SDK esté en tu `PATH` agregando `ANDROID_HOME` en tus variables de entorno si no lo está.

---

## 2. Inicialización del Scaffolding Móvil

Ejecutaremos los comandos para crear el directorio `/mobile` e instalar los componentes principales necesarios para nuestra aplicación de hackathon.

### Creación del Proyecto:
Ejecuta esto desde la terminal en la carpeta raíz `E:\AQUORA`:
```powershell
npx -y create-expo-app@latest mobile --template blank-typescript
```

### Instalar Librerías de la App:
Navega a la carpeta y agrega las dependencias nativas de GPS, Cámara (para escaneo QR) y navegación:
```powershell
cd E:\AQUORA\mobile
npx expo install expo-location expo-camera expo-barcode-scanner @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs react-native-safe-area-context react-native-screens @react-native-async-storage/async-storage
```

---

## 3. Preparación del Emulador de Android Studio

1. Abre **Android Studio**.
2. En la pantalla de bienvenida, haz clic en **More Actions** y selecciona **Virtual Device Manager** (o abre un proyecto cualquiera y búscalo en el menú superior derecho).
3. Selecciona tu emulador creado (ej. Pixel 6 API 33) y haz clic en el botón de **Play (Start)** para encenderlo.
4. Espera a que el sistema operativo de Android termine de cargar por completo.

---

## 4. Ejecución del Servidor y Previsualización

Una vez que el emulador esté encendido en tu pantalla, ejecuta en la terminal de tu computadora:

```powershell
cd E:\AQUORA\mobile
npx expo start
```

En la terminal aparecerá el Metro Bundler junto con un código QR y una lista de comandos de teclado:
* Presiona la tecla **`a`** en tu teclado.
* Expo instalará de forma automática la herramienta cliente de desarrollo en tu emulador de Android Studio y lanzará la pantalla de inicio de AQUORA.

---

## 5. Validación de la Recarga en Vivo (Fast Refresh)

1. Abre el archivo `/mobile/App.tsx` en tu editor de código.
2. Modifica el texto predeterminado dentro del componente `<Text>` por: `"¡AQUORA: Agua Segura e Inteligencia Territorial!"`.
3. Presiona guardar (`Ctrl + S`).
4. Observa el emulador de Android Studio: la pantalla se actualizará instantáneamente con el nuevo texto en milisegundos sin reiniciar la aplicación.
