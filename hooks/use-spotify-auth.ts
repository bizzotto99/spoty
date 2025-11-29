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
    // Modo de desarrollo: simular usuario autenticado
    // Solo funciona en localhost para desarrollo
    const isDevelopment = typeof window !== "undefined" && 
      (window.location.hostname === "localhost" || 
       window.location.hostname === "127.0.0.1")
    
    // Activar mock automáticamente en desarrollo si está en la URL o localStorage
    // También se puede activar manualmente con ?mock=true
    const urlParams = new URLSearchParams(window.location.search)
    if (isDevelopment && urlParams.get("mock") === "true") {
      localStorage.setItem("spoty_mock_mode", "true")
    }
    
    const isMockMode = isDevelopment && 
      (urlParams.get("mock") === "true" || 
       localStorage.getItem("spoty_mock_mode") === "true")

    // Si está en modo mock, simular usuario
    if (isMockMode) {
      setIsAuthenticated(true)
      setUser({
        id: "mock_user_123",
        display_name: "Ivan Levy",
        email: "ivan@dotasolutions.agency",
        images: [{
          url: "https://i.scdn.co/image/ab6775700000ee85c8d027b6e57b5c4e5c5b5b5b"
        }]
      })
      setIsLoading(false)
      return
    }

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
        
        // Obtener datos adicionales del usuario en segundo plano
        fetch("/api/user/data", {
          credentials: 'include',
          cache: 'no-store',
        }).catch(() => {
          // Silenciar errores, es opcional
        })
        
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

  const login = (returnTo?: string) => {
    // En modo mock, activar mock mode (solo en desarrollo)
    const isDevelopment = typeof window !== "undefined" && 
      (window.location.hostname === "localhost" || 
       window.location.hostname === "127.0.0.1")
    
    const isMockMode = isDevelopment && 
      (window.location.search.includes("mock=true") || 
       localStorage.getItem("spoty_mock_mode") === "true")
    
    if (isMockMode) {
      localStorage.setItem("spoty_mock_mode", "true")
      window.location.reload()
      return
    }
    // Redirigir al endpoint de login que iniciará el flujo OAuth
    // Si se proporciona returnTo, pasarlo como parámetro
    const loginUrl = returnTo 
      ? `/api/auth/login?return_to=${encodeURIComponent(returnTo)}`
      : "/api/auth/login"
    window.location.href = loginUrl
  }

  const logout = async () => {
    // En modo mock, desactivar mock mode (solo en desarrollo)
    const isDevelopment = typeof window !== "undefined" && 
      (window.location.hostname === "localhost" || 
       window.location.hostname === "127.0.0.1")
    
    const isMockMode = isDevelopment && 
      (window.location.search.includes("mock=true") || 
       localStorage.getItem("spoty_mock_mode") === "true")
    
    if (isMockMode) {
      localStorage.removeItem("spoty_mock_mode")
      setIsAuthenticated(false)
      setUser(null)
      window.location.reload()
      return
    }
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

