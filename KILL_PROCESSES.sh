#!/bin/bash
# Script para matar todos los procesos relacionados con Next.js y la API de Spotify

echo "🔍 Buscando procesos de Next.js y Node.js..."

# Matar procesos de Next.js
echo "🛑 Matando procesos de Next.js..."
pkill -f "next dev"
pkill -f "next-server"
pkill -f "next build"

# Matar procesos de Node relacionados con el proyecto
echo "🛑 Matando procesos de Node.js del proyecto..."
pkill -f "minimalist-spotify-ui"

# Matar por PID específico si hay alguno bloqueado
# Reemplaza estos PIDs con los que aparezcan en ps aux
# pkill -9 -f "52927"  # PostCSS
# pkill -9 -f "49940"  # next-server

echo "✅ Procesos terminados"
echo ""
echo "Verificando procesos restantes..."
ps aux | grep -E "next|node.*spotify|minimalist" | grep -v grep

