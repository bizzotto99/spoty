# 🛑 Cómo Matar Procesos de Spotify API

## ⚠️ Problema Identificado

Hay procesos de Next.js corriendo desde hace mucho tiempo que pueden estar causando problemas con la API de Spotify.

## 🔍 Verificar Procesos Activos

```bash
ps aux | grep -E "next|node.*spotify|minimalist" | grep -v grep
```

O ver solo los PIDs:
```bash
ps aux | grep -E "next|node.*spotify|minimalist" | grep -v grep | awk '{print $2}'
```

## 🛑 Matar Todos los Procesos

### Opción 1: Matar por Nombre (Recomendado)

```bash
# Matar procesos de Next.js
pkill -9 -f "next dev"
pkill -9 -f "next-server"
pkill -9 -f "next build"

# Matar procesos de Node relacionados con el proyecto
pkill -9 -f "minimalist-spotify-ui"
```

### Opción 2: Matar por PID Específico

Si conoces los PIDs (del comando anterior):

```bash
kill -9 49940  # next-server
kill -9 50118  # postcss
kill -9 49939  # next dev
```

### Opción 3: Matar Todos los Procesos de Node

⚠️ **CUIDADO**: Esto matará TODOS los procesos de Node.js, no solo los del proyecto.

```bash
killall -9 node
```

## 🔍 Verificar si hay un Loop

El código tiene límites de retry:

1. **Rate Limiting**: Máximo 5 reintentos (`maxRetries = 5`)
2. **Tiempo máximo de espera**: 5 minutos
3. **Fail-fast**: Si el rate limit es > 2 minutos, falla inmediatamente

Sin embargo, si hay muchos requests acumulados, podrían estar esperando uno tras otro.

## 🚨 Posible Loop en Rate Limiting

Si ves en los logs múltiples mensajes como:
```
[Spotify API] Rate limit alcanzado. Esperando Xs antes de reintentar... (intento 1/5)
[Spotify API] Rate limit alcanzado. Esperando Xs antes de reintentar... (intento 2/5)
...
```

Esto NO es un loop infinito, pero puede tomar mucho tiempo si:
- Hay muchos requests
- Spotify tiene rate limits muy altos
- Los delays se acumulan

## ✅ Solución Rápida

1. **Matar todos los procesos:**
   ```bash
   pkill -9 -f "next"
   pkill -9 -f "node.*spotify"
   ```

2. **Reiniciar el servidor:**
   ```bash
   cd /Users/ninobizzotto/Desktop/minimalist-spotify-ui
   npm run dev
   ```

3. **Verificar que no haya procesos zombies:**
   ```bash
   ps aux | grep -E "next|node" | grep -v grep
   ```

## 📊 Ver Uso de CPU/Memoria

Para ver qué procesos están usando más recursos:

```bash
ps aux | grep -E "next|node" | grep -v grep | sort -k3 -rn | head -10
```

Esto muestra los procesos ordenados por uso de CPU.

## 🔧 Script Automático

Ejecuta el script `KILL_PROCESSES.sh`:

```bash
cd /Users/ninobizzotto/Desktop/minimalist-spotify-ui
./KILL_PROCESSES.sh
```

O directamente:
```bash
bash KILL_PROCESSES.sh
```

