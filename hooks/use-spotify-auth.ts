"use client"

import { useState, useEffect } from "react"

interface SpotifyUser {
  id: string
  display_name: string
  email?: string
  images?: Array<{ url: string }>
}

interface UseSpotifyAuthReturn {
  isAuthenticated: boolean
  user: SpotifyUser | null
  isLoading: boolean
  login: () => void
  logout: () => Promise<void>
}

export function useSpotifyAuth(): UseSpotifyAuthReturn {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<SpotifyUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Verificar estado de autenticación al cargar
  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const response = await fetch("/api/auth/me")
      const data = await response.json()

      if (data.authenticated && data.user) {
        setIsAuthenticated(true)
        setUser(data.user)
      } else {
        setIsAuthenticated(false)
        setUser(null)
      }
    } catch (error) {
      console.error("Error al verificar autenticación:", error)
      setIsAuthenticated(false)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const login = () => {
    // Redirigir al endpoint de login que iniciará el flujo OAuth
    window.location.href = "/api/auth/login"
  }

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      setIsAuthenticated(false)
      setUser(null)
      // Recargar la página para limpiar el estado
      window.location.reload()
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    }
  }

  return {
    isAuthenticated,
    user,
    isLoading,
    login,
    logout,
  }
}

