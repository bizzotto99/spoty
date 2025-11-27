"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Send, LogOut } from "lucide-react"
import { ParticlesBackground } from "@/components/particles-background"
import { useSpotifyAuth } from "@/hooks/use-spotify-auth"

export default function PlaylistPrompt() {
  const [prompt, setPrompt] = useState("")
  const { isAuthenticated, user, isLoading, login, logout } = useSpotifyAuth()

  // Verificar si hay un error en la URL (del callback)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const error = params.get("error")
    if (error) {
      console.error("Error de autenticación:", error)
      // Puedes mostrar un toast o mensaje de error aquí
      // Limpiar la URL
      window.history.replaceState({}, "", "/")
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Placeholder para futura integración con Gemini
    console.log("Prompt enviado:", prompt)
  }

  return (
    <main className="min-h-screen w-full flex flex-col relative" style={{ backgroundColor: "#000" }}>
      <ParticlesBackground />
      <nav className="w-full px-6 py-4 relative z-10" style={{ backgroundColor: "#000" }}>
        <div
          className="flex items-center justify-between rounded-full px-6 py-3 max-w-6xl mx-auto"
          style={{ backgroundColor: "#1DB954" }}
        >
          {/* Logo / nombre de la app */}
          <div className="text-white font-sans font-semibold text-lg tracking-tight" style={{ color: "#000" }}>
            spoty
          </div>

          {/* Botón de autenticación */}
          {isLoading ? (
            <div className="px-5 py-2 text-sm text-gray-600" style={{ color: "#000" }}>
              Cargando...
            </div>
          ) : isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              {/* Avatar del usuario */}
              {user.images && user.images[0] ? (
                <img
                  src={user.images[0].url}
                  alt={user.display_name || "Usuario"}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
                  style={{ backgroundColor: "#000", color: "#1DB954" }}
                >
                  {user.display_name?.charAt(0).toUpperCase() || "U"}
                </div>
              )}
              {/* Nombre del usuario */}
              <span className="text-sm font-medium" style={{ color: "#000" }}>
                {user.display_name || user.email || "Usuario"}
              </span>
              {/* Botón de logout */}
              <button
                onClick={logout}
                className="px-4 py-2 rounded-full transition-all duration-300 font-sans text-xs font-medium"
                style={{
                  backgroundColor: "#000",
                  color: "#1DB954",
                  border: "1px solid transparent",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 0 12px rgba(29, 185, 84, 0.3)"
                  e.currentTarget.style.transform = "scale(1.02)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none"
                  e.currentTarget.style.transform = "scale(1)"
                }}
                title="Cerrar sesión"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={login}
              className="px-5 py-2 rounded-full transition-all duration-300 font-sans text-sm font-medium"
              style={{
                backgroundColor: "#000",
                color: "#1DB954",
                border: "1px solid transparent",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 0 12px rgba(29, 185, 84, 0.3)"
                e.currentTarget.style.transform = "scale(1.02)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none"
                e.currentTarget.style.transform = "scale(1)"
              }}
            >
              Conectar con Spotify
            </button>
          )}
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center relative z-10">
        <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto px-4">
          <div
            className="flex items-center gap-0 rounded-full transition-all duration-300"
            style={{ backgroundColor: "#1a1a1a" }}
          >
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describí la playlist que querés…"
              className="flex-1 px-6 py-4 bg-transparent text-white placeholder-gray-500 outline-none font-sans text-base"
              style={{ color: "#ffffff" }}
            />

            <button
              type="submit"
              className="mr-3 p-2 rounded-full transition-all duration-300 hover:scale-110 flex items-center justify-center"
              style={{
                backgroundColor: "#1DB954",
                color: "#000",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 0 16px rgba(29, 185, 84, 0.4)"
                e.currentTarget.style.backgroundColor = "#1ed760"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none"
                e.currentTarget.style.backgroundColor = "#1DB954"
              }}
              aria-label="Enviar prompt"
            >
              <Send size={20} strokeWidth={2.5} />
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
