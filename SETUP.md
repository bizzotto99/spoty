# 🎵 Configuración Completa - Spotify Playlist Generator

Guía única para configurar la aplicación desde cero hasta producción.

---

## 📋 Paso 1: Obtener Credenciales de Spotify

### 1.1 Crear Aplicación en Spotify Dashboard

1. Ve a https://developer.spotify.com/dashboard
2. Inicia sesión con tu cuenta de Spotify
3. Haz clic en **"Create app"**
4. Completa el formulario:
   - **App name**: Nombre de tu app (ej: "Spoty Playlist Generator")
   - **Description**: Descripción opcional
   - **Website**: `https://spoty-three.vercel.app`
   - **Redirect URI**: `https://spoty-three.vercel.app/api/auth/callback`
   - Acepta los términos y haz clic en **"Save"**

### 1.2 Obtener Credenciales

1. **Client ID**: Está visible en la página de tu app
2. **Client Secret**: Haz clic en **"View client secret"** para verlo (cópialo inmediatamente)

### 1.3 Configurar Redirect URI en Spotify

1. En tu aplicación, haz clic en **"Edit Settings"**
2. Ve a **"Redirect URIs"**
3. Agrega: `https://spoty-three.vercel.app/api/auth/callback`
4. Guarda los cambios

---

## 📋 Paso 2: Configurar Variables de Entorno

### Para Desarrollo Local (`.env.local`)

Crea un archivo `.env.local` en la raíz del proyecto:

```env
SPOTIFY_CLIENT_ID=tu_client_id_aqui
SPOTIFY_CLIENT_SECRET=tu_client_secret_aqui
SPOTIFY_REDIRECT_URI=https://spoty-three.vercel.app/api/auth/callback
```

⚠️ **Importante**: 
- Reemplaza los valores con tus credenciales reales
- El archivo `.env.local` NO debe subirse a Git (ya está en `.gitignore`)
- Reinicia el servidor después de crear/modificar este archivo
- Solo usamos la URL de producción: `https://spoty-three.vercel.app/api/auth/callback`

### Para Producción en Vercel

1. Ve a tu proyecto en https://vercel.com/dashboard
2. Selecciona el proyecto
3. Ve a **Settings** → **Environment Variables**
4. Agrega estas 3 variables:

   - **Name**: `SPOTIFY_CLIENT_ID`
   - **Value**: Tu Client ID
   - **Environment**: `Production` (y `Preview` si quieres)

   - **Name**: `SPOTIFY_CLIENT_SECRET`
   - **Value**: Tu Client Secret
   - **Environment**: `Production` (y `Preview` si quieres)

   - **Name**: `SPOTIFY_REDIRECT_URI`
   - **Value**: `https://spoty-three.vercel.app/api/auth/callback`
   - **Environment**: `Production` (y `Preview` si quieres)

5. Haz clic en **Save** para cada una
6. Haz un **Redeploy** después de agregar las variables

---

## 📋 Paso 3: Desplegar en Vercel

### Si ya está conectado a GitHub

1. El proyecto ya está en: https://github.com/bizzotto99/spoty
2. Vercel hará deploy automático cuando hagas push
3. O ve a **Deployments** y haz clic en **"Redeploy"**

### Si no está conectado

1. Ve a https://vercel.com
2. Importa el repositorio `bizzotto99/spoty` desde GitHub
3. Vercel detectará automáticamente que es Next.js
4. Agrega las variables de entorno durante la configuración
5. Haz clic en **"Deploy"**

---

## ✅ Verificación

### Producción

1. Ve a `https://spoty-three.vercel.app`
2. Haz clic en **"Conectar con Spotify"**
3. Deberías ser redirigido a Spotify para autorizar
4. Después de autorizar, volverás a tu app

---

## 🔧 Troubleshooting

### Error: "redirect_uri_mismatch"

**Solución:**
- Verifica que el Redirect URI en Vercel sea exactamente: `https://spoty-three.vercel.app/api/auth/callback`
- Verifica que esté agregado en Spotify Dashboard
- No debe haber espacios o caracteres extra

### Error: "invalid_client"

**Solución:**
- Verifica que las variables de entorno en Vercel sean correctas
- Asegúrate de haber hecho redeploy después de agregar las variables
- Verifica que no haya espacios adicionales

### Error: "SPOTIFY_CLIENT_ID no está configurado"

**Solución:**
- Verifica que el archivo `.env.local` exista y tenga los valores correctos
- Reinicia el servidor de desarrollo
- Verifica que los nombres de las variables sean exactamente: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REDIRECT_URI`

---

## 📝 Resumen de URLs y Configuración

| Entorno | Redirect URI | Variables de Entorno |
|---------|--------------|---------------------|
| **Producción** | `https://spoty-three.vercel.app/api/auth/callback` | Vercel Dashboard → Settings → Environment Variables |

**Importante:**
- Solo usamos el link de producción
- Las credenciales (Client ID y Client Secret) son las mismas para todos los entornos
- Puedes agregar/modificar Redirect URIs en Spotify Dashboard en cualquier momento

---

## 🚀 Próximos Pasos

Después de configurar la autenticación:
- ✅ Integración con Gemini API para interpretar prompts
- ✅ Lectura de datos del usuario de Spotify
- ✅ Generación de playlists personalizadas
- ✅ Priorización de BPM en las playlists

---

**¿Problemas?** Revisa los logs en:
- Terminal (desarrollo local)
- Vercel Dashboard → Deployments → Tu deployment → Functions (producción)


