# 🛑 Comandos para Matar Procesos

## ✅ Comando Rápido (Todo en uno)

```bash
pkill -9 -f "next-server" && pkill -9 -f "next dev" && pkill -9 -f "next build" && pkill -9 -f "minimalist-spotify-ui" && echo "✅ Procesos terminados"
```

## 🔍 Ver Procesos Activos

```bash
ps aux | grep -E "next|node.*spotify|minimalist" | grep -v grep
```

## 🛑 Matar por PID Específico

Si ves PIDs específicos, mátalos uno por uno:

```bash
kill -9 49940  # Reemplaza con el PID que veas
kill -9 50118
kill -9 49939
```

## 📋 Verificar si hay Loop

Revisa los logs para ver si hay muchos retries:

```bash
# En los logs deberías ver:
[Spotify API] Rate limit alcanzado. Esperando Xs... (intento 1/5)
[Spotify API] Rate limit alcanzado. Esperando Xs... (intento 2/5)
...
```

**No es un loop infinito**, pero puede tardar mucho si hay muchos requests esperando.

## ✅ Reiniciar Todo

Después de matar procesos:

```bash
cd /Users/ninobizzotto/Desktop/minimalist-spotify-ui
npm run dev
```

