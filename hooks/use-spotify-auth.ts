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
    // Si estamos volviendo del callback, hacer múltiples intentos
    const isReturningFromCallback = typeof window !== "undefined" && 
      window.location.search.includes("connected=true")
    
    if (isReturningFromCallback) {
      // Limpiar el query parameter de la URL si aún está presente
      const url = new URL(window.location.href)
      if (url.searchParams.has("connected")) {
        url.searchParams.delete("connected")
        window.history.replaceState({}, "", url.toString())
      }
      
      // Hacer múltiples intentos para verificar la autenticación
      let attempts = 0
      const maxAttempts = 5
      const attemptInterval = 600 // ms
      
      const tryCheckAuth = async () => {
        attempts++
        const authenticated = await checkAuthStatus()
        
        // Si no está autenticado después del intento y aún tenemos intentos, intentar de nuevo
        // Usar un pequeño delay para permitir que las cookies estén disponibles
        if (!authenticated && attempts < maxAttempts) {
          setTimeout(tryCheckAuth, attemptInterval)
        }
      }
      
      // Empezar después de un delay inicial para dar tiempo a las cookies
      setTimeout(tryCheckAuth, 800)
    } else {
      checkAuthStatus()
    }
  }, [])

  const checkAuthStatus = async (): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: 'include',
        cache: 'no-store',
      })
      const data = await response.json()

      if (data.authenticated && data.user) {
        setIsAuthenticated(true)
        setUser(data.user)
        setIsLoading(false)
        return true
      } else {
        setIsAuthenticated(false)
        setUser(null)
        setIsLoading(false)
        return false
      }
    } catch (error) {
      console.error("Error al verificar autenticación:", error)
      setIsAuthenticated(false)
      setUser(null)
      setIsLoading(false)
      return false
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

