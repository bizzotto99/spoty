# Configuración de Spotify OAuth

Para que la autenticación con Spotify funcione, necesitas configurar las credenciales de la API de Spotify.

## Pasos para configurar:

### 1. Crear una aplicación en Spotify Developer Dashboard

1. Ve a [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Inicia sesión con tu cuenta de Spotify
3. Haz clic en **"Create app"**
4. Completa el formulario:
   - **App name**: Nombre de tu aplicación (ej: "Mi Playlist Generator")
   - **App description**: Descripción opcional
   - **Website**: Tu sitio web o `http://localhost:3000` para desarrollo
   - **Redirect URI**: 
     - Para desarrollo: `http://localhost:3000/api/auth/callback`
     - Para producción: `https://tu-dominio.com/api/auth/callback`
   - Marca las casillas necesarias (términos y condiciones)
5. Haz clic en **"Save"**

### 2. Obtener las credenciales

1. En tu aplicación creada, verás:
   - **Client ID**: Tu identificador de cliente
   - **Client Secret**: Tu secreto de cliente (haz clic en "View client secret" para verlo)

### 3. Configurar las variables de entorno

1. Crea un archivo `.env.local` en la raíz del proyecto (junto a `package.json`)
2. Agrega las siguientes variables:

```env
SPOTIFY_CLIENT_ID=tu_client_id_aqui
SPOTIFY_CLIENT_SECRET=tu_client_secret_aqui
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/auth/callback
```

**Importante**: 
- Reemplaza `tu_client_id_aqui` y `tu_client_secret_aqui` con tus credenciales reales
- Para desarrollo local, usa `http://localhost:3000/api/auth/callback`
- Para producción, cambia la URL a tu dominio real

### 4. Agregar Redirect URI en Spotify Dashboard

1. Vuelve a [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Selecciona tu aplicación
3. Haz clic en **"Edit Settings"**
4. En **"Redirect URIs"**, agrega:
   - `http://localhost:3000/api/auth/callback` (para desarrollo)
   - `https://tu-dominio.com/api/auth/callback` (para producción)
5. Haz clic en **"Add"** y luego **"Save"**

### 5. Reiniciar el servidor

Después de crear el archivo `.env.local`, reinicia el servidor de desarrollo:

```bash
npm run dev
```

## Permisos (Scopes) solicitados

La aplicación solicita los siguientes permisos:
- `user-read-private`: Leer información del perfil privado
- `user-read-email`: Leer email del usuario
- `user-read-recently-played`: Ver canciones recientemente reproducidas
- `user-top-read`: Ver top canciones y artistas
- `user-read-playback-state`: Leer estado de reproducción
- `playlist-modify-public`: Crear y modificar playlists públicas
- `playlist-modify-private`: Crear y modificar playlists privadas
- `playlist-read-private`: Leer playlists privadas

## Probar la autenticación

1. Asegúrate de que el servidor esté corriendo
2. Abre la aplicación en `http://localhost:3000`
3. Haz clic en **"Conectar con Spotify"**
4. Serás redirigido a Spotify para autorizar la aplicación
5. Después de autorizar, serás redirigido de vuelta a la app

## Troubleshooting

### Error: "SPOTIFY_CLIENT_ID no está configurado"
- Verifica que el archivo `.env.local` existe en la raíz del proyecto
- Asegúrate de haber reiniciado el servidor después de crear el archivo
- Verifica que las variables tengan los nombres correctos (sin espacios)

### Error: "invalid_client" o "redirect_uri_mismatch"
- Verifica que el Redirect URI en `.env.local` coincida exactamente con el configurado en Spotify Dashboard
- Asegúrate de haber guardado los cambios en Spotify Dashboard

### Error: "access_denied"
- El usuario canceló la autorización
- No hay problema, puede intentar de nuevo

