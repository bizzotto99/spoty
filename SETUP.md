# 🎵 Configuración Completa - Spotify Playlist Generator

Guía única para configurar la aplicación desde cero hasta producción.

---

## 👥 Para Nuevos Colaboradores

Si eres un nuevo colaborador en el proyecto, sigue estos pasos rápidos:

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/bizzotto99/spoty.git
   cd spoty
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno:**
   - Crea un archivo `.env.local` en la raíz del proyecto
   - Pide a tu compañero las credenciales necesarias (SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, GEMINI_API_KEY)
   - Obtén tu propia Gemini API Key en https://aistudio.google.com/ (gratis)
   - Ver la sección "Paso 2: Configurar Variables de Entorno" para más detalles

4. **Ejecutar el proyecto localmente:**
   ```bash
   npm run dev
   ```

5. **Configurar Spotify para desarrollo:**
   - Si necesitas agregar usuarios para probar, ve a Spotify Dashboard → Users and Access
   - Puedes agregar hasta 25 usuarios en modo desarrollo

⚠️ **Nota**: Las credenciales de Spotify son compartidas, pero la API Key de Gemini puede ser personal (cada uno puede tener la suya).

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

### 1.4 Permitir Múltiples Usuarios (IMPORTANTE)

Por defecto, las apps en modo desarrollo solo permiten acceso al creador. Para que otros usuarios puedan conectarse:

1. En tu aplicación en el Dashboard, ve a la sección **"Users and Access"** o **"Edit Settings"**
2. En la sección de **"Users"** o **"Users and Access"**, verás:
   - **Development Mode**: Limita el acceso a usuarios específicos
   - Puedes agregar hasta **25 usuarios** en modo desarrollo
3. **Opción A - Agregar usuarios específicos:**
   - Haz clic en **"Add User"** o **"Add"**
   - Ingresa el email o username de Spotify del usuario
   - Guarda los cambios
4. **Opción B - Para acceso público (más de 25 usuarios):**
   - Necesitarás solicitar que Spotify apruebe tu app para modo producción
   - Esto requiere información adicional sobre tu aplicación
   - Puede tomar varios días o semanas

⚠️ **Importante**: Si no agregas usuarios en "Users and Access", solo el creador de la app (ninobizzotto) podrá conectarse.

### 1.5 Solicitar Aprobación para Más de 25 Usuarios (Extended Quota)

Si necesitas que más de 25 usuarios puedan usar tu aplicación, debes solicitar una **Extended Quota** a Spotify:

#### Requisitos para Solicitar Extended Quota:

⚠️ **Requisitos estrictos que debes cumplir:**

1. **Entidad comercial establecida**: Tu app debe estar asociada a una empresa/entidad legalmente registrada
2. **Servicio activo y lanzado**: La aplicación debe estar operativa públicamente
3. **Usuarios activos mensuales**: Mínimo **250,000 usuarios activos mensuales**
4. **Disponibilidad en mercados clave**: Debe estar disponible en los principales mercados de Spotify
5. **Viabilidad comercial**: Debe demostrar un modelo de negocio sostenible
6. **Cumplimiento de términos**: Debe cumplir con todas las políticas de Spotify

⚠️ **Importante**: A partir del 15 de mayo de 2025, Spotify **solo acepta solicitudes de organizaciones** (empresas), no de individuos.

#### Cómo Solicitar Extended Quota:

1. Ve a https://developer.spotify.com/dashboard
2. Selecciona tu aplicación
3. Haz clic en **"Settings"** (Configuración)
4. Ve a la pestaña **"Quota extension Request"** (Solicitud de extensión de cuota)
5. Completa el cuestionario en 4 pasos con información detallada sobre:
   - Descripción de tu aplicación
   - Modelo de negocio
   - Número de usuarios
   - Mercados donde está disponible
6. Haz clic en **"Submit"** (Enviar)

**Tiempo de revisión**: Hasta **6 semanas** para que Spotify evalúe tu solicitud.

#### Alternativas si No Cumples los Requisitos:

- **Opción 1**: Agregar usuarios manualmente (hasta 25) mientras creces la aplicación
- **Opción 2**: Crear una empresa/entidad comercial si planeas escalar seriamente
- **Opción 3**: Esperar a alcanzar los 250,000 usuarios antes de solicitar

📚 **Más información**: https://developer.spotify.com/documentation/web-api/concepts/quota-modes

### 1.6 Estrategia para Proyectos Pequeños

Si tu proyecto es pequeño y no cumples los requisitos de Extended Quota, aquí hay estrategias prácticas:

#### ✅ **Recomendado para Proyectos Pequeños:**

1. **Usar el límite de 25 usuarios durante el crecimiento inicial**
   - Agrega usuarios manualmente según vayan pidiendo acceso
   - Prioriza usuarios activos o beta testers
   - Es suficiente para validar tu idea y hacer crecer la comunidad

2. **Monitorear el crecimiento**
   - Si llegas cerca de 25 usuarios, evalúa si vale la pena crear una empresa
   - No puedes solicitar Extended Quota como individuo después de mayo 2025

3. **Planificar a futuro**
   - Si el proyecto crece mucho, considera crear una empresa/startup
   - Esto te permitiría solicitar Extended Quota más adelante

#### ⚠️ **Realidad para Proyectos Pequeños:**

- **No hay opción intermedia**: Es 25 usuarios o 250,000+. No existe término medio.
- **Los requisitos son muy estrictos**: Están diseñados para aplicaciones grandes, no proyectos pequeños
- **No hay "workaround"**: Debes trabajar dentro de las limitaciones o cumplir los requisitos

#### 💡 **Consejo:**

Para la mayoría de proyectos pequeños, **25 usuarios es suficiente para comenzar**. Muchas apps exitosas empezaron así y luego escalaron cuando tuvieron tracción suficiente para justificar crear una empresa y solicitar la Extended Quota.

---

## 📋 Paso 2: Configurar Variables de Entorno

### Para Desarrollo Local (`.env.local`)

Crea un archivo `.env.local` en la raíz del proyecto:

```env
SPOTIFY_CLIENT_ID=tu_client_id_aqui
SPOTIFY_CLIENT_SECRET=tu_client_secret_aqui
SPOTIFY_REDIRECT_URI=https://spoty-three.vercel.app/api/auth/callback
GEMINI_API_KEY=tu_gemini_api_key_aqui

# Supabase (opcional - solo si usas base de datos)
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key_aqui
```

⚠️ **Importante**: 
- Reemplaza los valores con tus credenciales reales
- El archivo `.env.local` NO debe subirse a Git (ya está en `.gitignore`)
- Reinicia el servidor después de crear/modificar este archivo
- Solo usamos la URL de producción: `https://spoty-three.vercel.app/api/auth/callback`

### Configurar Gemini API Key

1. Ve a https://aistudio.google.com/
2. Inicia sesión con tu cuenta de Google
3. Crea un proyecto o selecciona uno existente
4. Ve a la sección de credenciales/configuración
5. Genera una nueva API key
6. Copia la API key y agrégala a tu `.env.local` como `GEMINI_API_KEY`

**Límites del plan gratuito:**
- 5 solicitudes por minuto
- 25 solicitudes por día
- 1,000,000 tokens por minuto

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

   - **Name**: `GEMINI_API_KEY`
   - **Value**: Tu Gemini API Key (obtenida de Google AI Studio)
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

---

## 📋 Paso 3: Configurar Supabase (Base de Datos - Opcional)

Si quieres usar una base de datos para guardar información de usuarios, playlists, etc., puedes configurar Supabase.

### 3.1 Crear Proyecto en Supabase

1. Ve a https://supabase.com
2. Inicia sesión o crea una cuenta
3. Haz clic en **"New Project"**
4. Completa el formulario:
   - **Project name**: Nombre de tu proyecto (ej: "spoty-db")
   - **Database Password**: Crea una contraseña segura (guárdala)
   - **Region**: Selecciona la región más cercana
5. Haz clic en **"Create new project"** y espera ~2 minutos

### 3.2 Obtener Credenciales

1. En tu proyecto de Supabase, ve a **Settings** (⚙️) → **API**
2. Copia estos valores:

   - **Project URL**: 
     ```
     https://xxxxx.supabase.co
     ```
   
   - **anon public key**: 
     ```
     eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
     ```
     (Es la key que empieza con `eyJ`)

### 3.3 Agregar Variables de Entorno

Agrega estas líneas a tu `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **Importante**:
- Reemplaza `tu-proyecto` con tu Project URL real
- Reemplaza la key con tu `anon public` key real
- El prefijo `NEXT_PUBLIC_` es necesario para que Next.js exponga estas variables al cliente

### 3.4 Crear las Tablas

1. En tu proyecto de Supabase, ve a **SQL Editor** (menú lateral)
2. Haz clic en **"New query"**
3. Abre el archivo `supabase-schema.sql` en este proyecto
4. Copia y pega todo el contenido en el editor SQL
5. Haz clic en **"Run"** o presiona `Ctrl+Enter`

Esto creará las tablas necesarias:
- `label_records` - Almacena los records labels
- `users` - Almacena información de usuarios
- `playlists` - Almacena las playlists generadas

### 3.5 Configurar en Vercel (Producción)

1. Ve a tu proyecto en https://vercel.com/dashboard
2. Ve a **Settings** → **Environment Variables**
3. Agrega:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Selecciona los ambientes (Production, Preview, Development)
5. Guarda y vuelve a hacer deploy

---
