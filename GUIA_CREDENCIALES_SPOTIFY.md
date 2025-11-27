# 🎵 Guía Completa: Cómo Obtener las Credenciales de Spotify API

Esta guía te mostrará paso a paso cómo obtener tu `Client ID` y `Client Secret` para conectar tu aplicación con Spotify.

---

## ⚠️ Sobre el Mensaje de Advertencia "URL no segura"

Si ves una advertencia en rojo que dice **"Esta URL de redirección no es segura"** cuando configuras `http://localhost:3000`:

✅ **Es completamente normal y puedes ignorarla**. 

- Spotify muestra esta advertencia para todas las URLs que usan `http://` (sin la 's')
- Para desarrollo local con `localhost`, esto es esperado y funcionará perfectamente
- En producción usarás `https://` (con la 's'), que sí es seguro
- La advertencia no impide que funcione en desarrollo local

**Solo asegúrate de que:**
- La URI termine con `/api/auth/callback`
- El puerto sea correcto (3000 por defecto, o el que estés usando)
- Ejemplo correcto: `http://localhost:3000/api/auth/callback`

---

## ⚡ Respuesta Rápida: ¿Una o Dos Aplicaciones?

**Solo necesitas crear UNA aplicación en Spotify** para ambos entornos:

- ✅ **Misma aplicación** para desarrollo local Y producción
- ✅ **Mismas credenciales** (Client ID y Client Secret)
- ✅ **Múltiples Redirect URIs** en la misma app:
  - `http://localhost:3000/api/auth/callback` (desarrollo)
  - `https://tu-app.vercel.app/api/auth/callback` (producción)

**Ventajas:**
- Menos configuración y mantenimiento
- Más simple
- Las mismas credenciales funcionan en ambos entornos

**Solo cambias la variable de entorno `SPOTIFY_REDIRECT_URI` según el entorno.**

---

## 📋 Paso 1: Acceder al Dashboard de Spotify

1. Ve a la página de **Spotify Developer Dashboard**:
   - URL: https://developer.spotify.com/dashboard
   - O busca en Google: "Spotify Developer Dashboard"

2. **Inicia sesión** con tu cuenta de Spotify
   - Si no tienes cuenta, créala gratis en https://www.spotify.com/signup

---

## 📋 Paso 2: Crear una Nueva Aplicación

Una vez dentro del Dashboard:

1. Verás un botón verde que dice **"Create app"** o **"Create an app"** (Crear una aplicación)
   - Haz clic en él

2. Te aparecerá un formulario modal con los siguientes campos:

### Información de la Aplicación:

- **App name** (Nombre de la app):
  - Ejemplo: `Mi Playlist Generator` o `Spotify Playlist AI`
  - Puede ser cualquier nombre, este es solo para identificarla

- **App description** (Descripción):
  - Ejemplo: `Aplicación para generar playlists personalizadas con IA`
  - Es opcional, pero recomendado

- **Website** (Sitio web):
  - Para desarrollo local: `http://localhost:3000`
  - Para producción: Tu dominio real

- **Redirect URI** (URI de redirección) ⚠️ **MUY IMPORTANTE**:
  - Haz clic en **"Add"** para agregar una URI
  - Agrega **AMBAS** URIs (desarrollo Y producción):
    - **Para desarrollo local:**
      ```
      http://localhost:3000/api/auth/callback
      ```
    - **Para producción en Vercel:**
      ```
      https://tu-app.vercel.app/api/auth/callback
      ```
      (Reemplaza `tu-app` con el nombre de tu app en Vercel)
  - Haz clic en **"Add"** después de cada una
  - **IMPORTANTE**: Solo necesitas crear UNA aplicación en Spotify para ambos entornos. Puedes agregar múltiples Redirect URIs en la misma app.

- **Terms of Service** y **Privacy Policy**:
  - Marca las casillas para aceptar los términos
  - Puedes crear URLs placeholder si no tienes páginas aún

3. Haz clic en **"Save"** (Guardar) al final del formulario

---

## 📋 Paso 3: Ver tus Credenciales

Después de crear la aplicación, serás redirigido a la página de configuración de tu app:

### Encontrarás dos valores importantes:

1. **Client ID** (ID de Cliente):
   - Está visible directamente en la página
   - Es una cadena larga de letras y números
   - Ejemplo: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`
   - **Cópialo** - lo necesitarás para tu `.env.local`

2. **Client Secret** (Secreto del Cliente):
   - Está oculto por defecto
   - Haz clic en el botón que dice **"View client secret"** o **"Reveal client secret"**
   - Te mostrará una cadena similar al Client ID
   - Ejemplo: `x9y8z7w6v5u4t3s2r1q0p9o8n7m6l5k4`
   - **Cópialo inmediatamente** - solo se muestra una vez
   - Si lo pierdes, puedes hacer clic en **"Reset client secret"** para generar uno nuevo

---

## 📋 Paso 4: Configurar el Redirect URI (Local + Producción)

**¡IMPORTANTE!** Solo necesitas crear **UNA aplicación** en Spotify para ambos entornos (local y producción). Puedes agregar múltiples Redirect URIs en la misma app.

### ✅ Puedes Modificar las URIs en Cualquier Momento

**SÍ, puedes agregar, editar o eliminar Redirect URIs después de crear la aplicación.** No estás limitado a las URIs que configuraste inicialmente. Puedes:

- ✅ Agregar nuevas URIs en cualquier momento
- ✅ Eliminar URIs que ya no necesites  
- ✅ Modificar URIs existentes
- ✅ Agregar URIs para diferentes entornos (desarrollo, staging, producción)

**Puedes empezar con solo la URI de desarrollo local y agregar la de producción cuando tengas tu URL de Vercel.**

### Configuración Inicial:

1. En la página de tu aplicación, haz clic en **"Edit Settings"** (Editar configuración)
   - O busca el botón **"Settings"** o un ícono de engranaje ⚙️

2. Ve a la sección **"Redirect URIs"**

3. **Opción A: Agregar solo la URI de desarrollo local por ahora**

   Para empezar, agrega solo:
   ```
   http://localhost:3000/api/auth/callback
   ```
   - Haz clic en **"Add"** y escribe la URI
   - Haz clic en **"Add"** para confirmar
   - Haz clic en **"Save"** para guardar

   **Más adelante**, cuando tengas tu URL de Vercel, puedes volver aquí y agregar la URI de producción.

4. **Opción B: Agregar ambas URIs desde el inicio**

   Si ya tienes tu URL de Vercel, agrega ambas:

   **Para desarrollo local:**
   ```
   http://localhost:3000/api/auth/callback
   ```
   - ⚠️ **Importante**: Usa el puerto donde corre tu aplicación Next.js (generalmente `3000`, pero puede ser `3001` u otro si el 3000 está ocupado)
   - Haz clic en **"Add"** y escribe la URI
   - Haz clic en **"Add"** para confirmar
   - 📝 **Nota sobre la advertencia "URL no segura"**: Es normal ver una advertencia en rojo que dice "Esta URL de redirección no es segura". Esto es esperado para URLs `http://localhost` en desarrollo. Puedes ignorarla - funcionará correctamente en desarrollo local. En producción (Vercel) usarás `https://` que sí es seguro.

   **Para producción en Vercel:**
   ```
   https://tu-app.vercel.app/api/auth/callback
   ```
   - Reemplaza `tu-app` con el nombre real de tu app en Vercel
   - O usa tu dominio personalizado si lo tienes
   - Haz clic en **"Add"** y escribe la URI
   - Haz clic en **"Add"** para confirmar

5. **Ejemplo visual** de cómo debería verse si agregas ambas:
   ```
   ✓ http://localhost:3000/api/auth/callback
   ✓ https://minimalist-spotify-ui.vercel.app/api/auth/callback
   ```

6. Haz clic en **"Save"** para guardar todos los cambios

### 🔄 Cómo Agregar Más URIs Más Tarde

**Pasos para agregar una nueva URI después de crear la aplicación:**

1. Ve a tu aplicación en [Spotify Dashboard](https://developer.spotify.com/dashboard)
2. Haz clic en tu aplicación para abrirla
3. Haz clic en **"Edit Settings"** o el botón **"Settings"** ⚙️
4. Desplázate hasta la sección **"Redirect URIs"**
5. Haz clic en el botón **"Add"** (puede estar debajo de las URIs existentes o en un campo de entrada)
6. Escribe la nueva URI (por ejemplo, tu URL de Vercel)
7. Haz clic en **"Add"** o **"Save"** para confirmar
8. Haz clic en **"Save"** al final de la página para guardar todos los cambios

**Ejemplo**: Si creaste la app con solo `http://localhost:3000/api/auth/callback`, después puedes volver y agregar `https://tu-app.vercel.app/api/auth/callback` sin problemas.

**Nota**: Las mismas credenciales (Client ID y Client Secret) funcionarán para todos los entornos. Solo cambiarás la variable `SPOTIFY_REDIRECT_URI` según el entorno en el que estés trabajando.

---

## 📋 Paso 5: Crear el Archivo .env.local (Desarrollo Local)

Ahora que tienes tus credenciales, necesitas configurarlas en tu proyecto para desarrollo local:

1. En la raíz de tu proyecto (donde está `package.json`), crea un archivo llamado `.env.local`
   - **Importante**: El archivo debe llamarse exactamente `.env.local` (con el punto al inicio)

2. Abre el archivo `.env.local` en tu editor

3. Agrega las siguientes líneas, reemplazando con tus credenciales reales:

```env
SPOTIFY_CLIENT_ID=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
SPOTIFY_CLIENT_SECRET=x9y8z7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/auth/callback
```

**Ejemplo real** (con credenciales de ejemplo):
```env
SPOTIFY_CLIENT_ID=1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d
SPOTIFY_CLIENT_SECRET=9z8y7x6w5v4u3t2s1r0q9p8o7n6m5l4
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/auth/callback
```

4. **Guarda el archivo**

---

## 🌐 Paso 5B: Configurar Variables de Entorno en Vercel (Producción)

Cuando estés listo para desplegar a producción en Vercel:

### Opción 1: Desde el Dashboard de Vercel (Recomendado)

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Haz clic en tu proyecto
3. Ve a **Settings** → **Environment Variables**
4. Agrega las siguientes variables:

   - **Name**: `SPOTIFY_CLIENT_ID`
   - **Value**: Tu Client ID (el mismo que usaste localmente)
   - **Environments**: Selecciona `Production`, `Preview`, y `Development`
   - Haz clic en **Save**

   - **Name**: `SPOTIFY_CLIENT_SECRET`
   - **Value**: Tu Client Secret (el mismo que usaste localmente)
   - **Environments**: Selecciona `Production`, `Preview`, y `Development`
   - Haz clic en **Save**

   - **Name**: `SPOTIFY_REDIRECT_URI`
   - **Value**: `https://tu-app.vercel.app/api/auth/callback`
     - Reemplaza `tu-app` con tu nombre de app real en Vercel
     - O usa tu dominio personalizado si lo tienes
   - **Environments**: Selecciona `Production`, `Preview`, y `Development`
   - Haz clic en **Save**

5. Después de agregar las variables, haz un nuevo **Redeploy** de tu aplicación

### Opción 2: Usando Vercel CLI

Si prefieres usar la terminal:

```bash
# Instalar Vercel CLI (si no lo tienes)
npm i -g vercel

# Agregar variables de entorno
vercel env add SPOTIFY_CLIENT_ID production
vercel env add SPOTIFY_CLIENT_SECRET production
vercel env add SPOTIFY_REDIRECT_URI production
```

---

## ⚠️ IMPORTANTE: Una Sola Aplicación para Ambos Entornos

**¡No necesitas crear dos aplicaciones diferentes!** 

- ✅ **Una sola aplicación** en Spotify Dashboard
- ✅ **Mismas credenciales** (Client ID y Client Secret) para local y producción
- ✅ **Múltiples Redirect URIs** en la misma app:
  - `http://localhost:3000/api/auth/callback` (desarrollo)
  - `https://tu-app.vercel.app/api/auth/callback` (producción)
- ✅ Solo cambia la variable `SPOTIFY_REDIRECT_URI` según el entorno

**Ventajas:**
- Menos configuración
- Más simple de mantener
- Las mismas credenciales funcionan en ambos entornos

---

## 📋 Paso 6: Verificar que Funciona

1. **Reinicia tu servidor de desarrollo**:
   ```bash
   npm run dev
   ```
   - Es importante reiniciar para que Next.js cargue las nuevas variables de entorno

2. Abre tu aplicación en el navegador:
   ```
   http://localhost:3000
   ```

3. Haz clic en **"Conectar con Spotify"**

4. Deberías ser redirigido a Spotify para autorizar la aplicación

5. Después de autorizar, serás redirigido de vuelta a tu app

---

## ⚠️ Consejos Importantes

### Seguridad:
- **NUNCA** compartas tu `Client Secret` públicamente
- **NUNCA** subas el archivo `.env.local` a Git
- El archivo `.env.local` ya debería estar en `.gitignore` por defecto

### Errores Comunes:

1. **Error: "redirect_uri_mismatch"**
   - Verifica que el Redirect URI en `.env.local` sea **exactamente** igual al configurado en Spotify Dashboard
   - No debe tener espacios al inicio o final
   - Debe ser exactamente: `http://localhost:3000/api/auth/callback`

2. **Error: "invalid_client"**
   - Verifica que el Client ID y Client Secret sean correctos
   - Asegúrate de no tener espacios adicionales
   - Verifica que hayas guardado el archivo `.env.local`

3. **Error: "SPOTIFY_CLIENT_ID no está configurado"**
   - Asegúrate de que el archivo se llame `.env.local` (con el punto)
   - Reinicia el servidor después de crear el archivo
   - Verifica que las variables tengan exactamente estos nombres:
     - `SPOTIFY_CLIENT_ID`
     - `SPOTIFY_CLIENT_SECRET`
     - `SPOTIFY_REDIRECT_URI`

---

## 🎉 ¡Listo!

Una vez que tengas todo configurado, tu aplicación podrá:
- ✅ Autenticar usuarios con Spotify
- ✅ Acceder a sus datos de Spotify
- ✅ Crear playlists en sus cuentas

Si tienes problemas, revisa los errores en la consola del navegador (F12) y en la terminal donde corre el servidor.

---

## 📸 Referencia Visual

Si necesitas ayuda visual, estos son los elementos que deberías ver:

1. **Dashboard de Spotify**: Una lista de tus aplicaciones con botones para crear nuevas
2. **Página de la App**: Muestra Client ID visible, Client Secret oculto con botón "View"
3. **Settings**: Una sección con Redirect URIs donde puedes agregar/editarlos

---

**¿Necesitas ayuda?** Revisa el archivo `SPOTIFY_SETUP.md` para más información técnica.

