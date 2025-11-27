# 🌐 Configuración: Desarrollo Local vs Producción en Vercel

## ❓ ¿Necesitas crear DOS aplicaciones diferentes en Spotify?

**NO** ✅ Solo necesitas crear **UNA aplicación** en Spotify para ambos entornos.

---

## ✅ Solución: Una Aplicación con Múltiples Redirect URIs

### 1️⃣ Crear UNA aplicación en Spotify Dashboard

- Ve a https://developer.spotify.com/dashboard
- Crea **UNA sola aplicación**
- Obtén tu **Client ID** y **Client Secret** (solo estos)

### 2️⃣ Agregar Múltiples Redirect URIs

**✅ Puedes agregar o modificar las URIs en cualquier momento.** No estás limitado a configurarlas solo al crear la aplicación.

**Opción A: Agregar ambas desde el inicio**

En la configuración de tu aplicación de Spotify, agrega **AMBAS** URIs:

```
✓ http://localhost:3000/api/auth/callback          (desarrollo local)
✓ https://tu-app.vercel.app/api/auth/callback      (producción en Vercel)
```

**Opción B: Agregar la URI de producción después**

- Por ahora, agrega solo: `http://localhost:3000/api/auth/callback`
- Cuando tengas tu URL de Vercel, vuelve a **Edit Settings** → **Redirect URIs** y agrega la nueva URI

**Cómo agregar más URIs después:**
1. Ve a Spotify Dashboard → Tu aplicación
2. Haz clic en **"Edit Settings"**
3. Ve a **"Redirect URIs"**
4. Haz clic en **"Add"** para agregar una nueva URI
5. Escribe la nueva URI y haz clic en **"Save"**

### 3️⃣ Configurar Variables de Entorno

#### Para Desarrollo Local (`.env.local`):

```env
SPOTIFY_CLIENT_ID=tu_client_id
SPOTIFY_CLIENT_SECRET=tu_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/auth/callback
```

#### Para Producción en Vercel:

1. Ve a tu proyecto en Vercel Dashboard
2. Settings → Environment Variables
3. Agrega las mismas variables:

```env
SPOTIFY_CLIENT_ID=tu_client_id        (el mismo que local)
SPOTIFY_CLIENT_SECRET=tu_client_secret (el mismo que local)
SPOTIFY_REDIRECT_URI=https://tu-app.vercel.app/api/auth/callback
```

**Nota**: Solo cambia `SPOTIFY_REDIRECT_URI` según el entorno. Las credenciales son las mismas.

---

## 📋 Resumen

| Aspecto | Desarrollo Local | Producción (Vercel) |
|---------|------------------|---------------------|
| **Aplicación en Spotify** | ✅ La misma | ✅ La misma |
| **Client ID** | ✅ El mismo | ✅ El mismo |
| **Client Secret** | ✅ El mismo | ✅ El mismo |
| **Redirect URI** | `http://localhost:3000/api/auth/callback` | `https://tu-app.vercel.app/api/auth/callback` |
| **Variables de entorno** | `.env.local` | Vercel Dashboard |

---

## 🚀 Pasos para Desplegar a Vercel

### 1. Preparar tu aplicación
```bash
# Asegúrate de que todo funciona localmente
npm run dev
```

### 2. Hacer push a GitHub
```bash
git add .
git commit -m "Preparar para producción"
git push
```

### 3. Conectar con Vercel
- Ve a https://vercel.com
- Importa tu repositorio de GitHub
- Vercel detectará automáticamente que es un proyecto Next.js

### 4. Configurar Variables de Entorno en Vercel
- En el proceso de configuración, ve a "Environment Variables"
- Agrega:
  - `SPOTIFY_CLIENT_ID` = tu client id
  - `SPOTIFY_CLIENT_SECRET` = tu client secret
  - `SPOTIFY_REDIRECT_URI` = `https://tu-app.vercel.app/api/auth/callback`

### 5. Actualizar Redirect URI en Spotify
- Ve a tu aplicación en Spotify Dashboard
- Edit Settings → Redirect URIs
- Asegúrate de tener agregado: `https://tu-app.vercel.app/api/auth/callback`

### 6. Desplegar
- Haz clic en "Deploy"
- Espera a que termine el despliegue
- Tu app estará en `https://tu-app.vercel.app`

---

## ⚠️ Recordatorios Importantes

1. **Solo UNA aplicación en Spotify** - no crees dos
2. **Mismas credenciales** para local y producción
3. **Múltiples Redirect URIs** en la misma app de Spotify
4. **Variables de entorno diferentes** - solo cambia `SPOTIFY_REDIRECT_URI`
5. **Verifica el Redirect URI en Spotify** antes de hacer deploy

---

## 🔧 Troubleshooting

### Error: "redirect_uri_mismatch" en producción

**Solución:**
1. Verifica que el Redirect URI en Vercel sea exactamente igual al configurado en Spotify
2. Asegúrate de que ambos usen `https://` (no `http://`)
3. Verifica que no haya espacios o caracteres extra

### Error: "invalid_client" en producción

**Solución:**
1. Verifica que las variables de entorno en Vercel sean correctas
2. Asegúrate de haber hecho un redeploy después de agregar las variables
3. Verifica que no haya espacios adicionales en los valores

### La autenticación funciona localmente pero no en Vercel

**Solución:**
1. Verifica que todas las variables de entorno estén configuradas en Vercel
2. Haz un redeploy completo
3. Verifica los logs en Vercel Dashboard para ver errores específicos

---

¿Necesitas más ayuda? Revisa `GUIA_CREDENCIALES_SPOTIFY.md` para la guía completa paso a paso.

