"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { LogOut, ChevronDown } from "lucide-react"
import { ParticlesBackground } from "@/components/particles-background"
import { useSpotifyAuth } from "@/hooks/use-spotify-auth"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"

const ACCESS_TOKEN_STORAGE_KEY = "records_access_token_validated"

export default function RecordsPage() {
  const [accessToken, setAccessToken] = useState("")
  const [showTokenModal, setShowTokenModal] = useState(false)
  const [isValidatingToken, setIsValidatingToken] = useState(false)
  const [tokenError, setTokenError] = useState("")
  const [isAccessTokenValidated, setIsAccessTokenValidated] = useState(false)
  
  const { isAuthenticated, user, isLoading, login, logout } = useSpotifyAuth()

  // Verificar si el token ya fue validado al cargar
  useEffect(() => {
    const validated = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY) === "true"
    setIsAccessTokenValidated(validated)
    if (!validated) {
      setShowTokenModal(true)
    }
  }, [])

  // Check if there's an error or success in the URL (from callback)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const error = params.get("error")
    const connected = params.get("connected")
    
    if (error) {
      console.error("Authentication error:", error)
      
      let errorMessage = "Connection failed"
      let errorDescription = "Please try connecting again"
      
      switch (error) {
        case "user_fetch_failed":
          errorMessage = "Could not fetch user information"
          errorDescription = "There was a problem retrieving your Spotify account. Please try again."
          break
        case "token_exchange_failed":
          errorMessage = "Authentication failed"
          errorDescription = "Could not complete authentication. Please try again."
          break
        case "invalid_state":
          errorMessage = "Security check failed"
          errorDescription = "Please try connecting again."
          break
        default:
          errorMessage = "Connection failed"
          errorDescription = `Error: ${error}. Please try again.`
      }
      
      toast.error(errorMessage, {
        description: errorDescription,
        duration: 5000,
      })
      window.history.replaceState({}, "", "/records")
    } else if (connected === "true") {
      window.history.replaceState({}, "", "/records")
      toast.success("Connected!", {
        description: "Your Spotify account is now connected",
        duration: 2000,
      })
    }
  }, [])

  // Verificar autenticación al cargar y redirigir automáticamente si no está autenticado
  // Pero solo si el token de acceso ya fue validado
  useEffect(() => {
    if (!isLoading && !isAuthenticated && isAccessTokenValidated) {
      // Redirigir directamente a la conexión de Spotify, pasando la ruta actual para volver aquí
      login("/records")
    }
  }, [isLoading, isAuthenticated, isAccessTokenValidated, login])

  const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Solo permitir números y máximo 3 caracteres
    if (value === "" || (/^\d+$/.test(value) && value.length <= 3)) {
      setAccessToken(value)
      setTokenError("")
      
      // Si tiene exactamente 3 números, validar automáticamente
      if (value.length === 3) {
        handleValidateToken(value)
      }
    }
  }

  const handleValidateToken = async (tokenToValidate?: string) => {
    const token = tokenToValidate || accessToken.trim()
    
    if (!token || token.length !== 3) {
      return
    }

    setIsValidatingToken(true)
    setTokenError("")

    try {
      const response = await fetch("/api/validate-access-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()

      if (data.valid) {
        // Token válido, guardar en localStorage
        localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, "true")
        setIsAccessTokenValidated(true)
        setShowTokenModal(false)
        setAccessToken("")
        toast.success("Access granted", {
          description: "Redirecting to Spotify connection...",
          duration: 2000,
        })
      } else {
        setTokenError("Invalid token")
        setAccessToken("")
      }
    } catch (error) {
      setTokenError("Error validating token. Please try again.")
      setAccessToken("")
    } finally {
      setIsValidatingToken(false)
    }
  }

  return (
    <main className="min-h-screen w-full flex flex-col relative" style={{ backgroundColor: "#000" }}>
      <ParticlesBackground />
      <nav className="w-full px-6 py-4 relative z-10" style={{ backgroundColor: "transparent" }}>
        <div
          className="flex items-center justify-between rounded-full px-6 py-3 max-w-6xl mx-auto"
          style={{ backgroundColor: "#1DB954" }}
        >
          {/* Logo */}
          <a href="/" className="flex items-center cursor-pointer transition-opacity duration-300 hover:opacity-80">
            <img 
              src="/logo.png" 
              alt="Spoty" 
              className="h-10 w-auto"
            />
          </a>

          {/* Authentication button */}
          <div className="flex items-center gap-4">
            {isLoading ? (
              <div className="px-5 py-2 text-sm text-gray-600" style={{ color: "#000" }}>
                Loading...
              </div>
            ) : isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 font-sans text-sm font-medium hover:opacity-90"
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
                    {/* User avatar */}
                    {user.images && user.images[0] ? (
                      <img
                        src={user.images[0].url}
                        alt={user.display_name || "User"}
                        className="w-7 h-7 rounded-full"
                      />
                    ) : (
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold"
                        style={{ backgroundColor: "#1DB954", color: "#000" }}
                      >
                        {user.display_name?.charAt(0).toUpperCase() || "U"}
                      </div>
                    )}
                    {/* Greeting and name */}
                    <span className="text-sm font-medium" style={{ color: "#1DB954" }}>
                      Hello, {user.display_name?.split(" ")[0] || user.email?.split("@")[0] || "User"}
                    </span>
                    <ChevronDown size={16} style={{ color: "#1DB954" }} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="min-w-[180px] rounded-lg"
                  style={{
                    backgroundColor: "#1a1a1a",
                    border: "1px solid #333",
                  }}
                >
                  <DropdownMenuItem
                    onClick={logout}
                    className="cursor-pointer focus:bg-[#1DB954] focus:text-black"
                    style={{ color: "#fff" }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <button
                onClick={login}
                className="px-5 py-2 rounded-full transition-all duration-300 font-sans text-sm font-medium hover:opacity-90"
                style={{
                  backgroundColor: "#000",
                  color: "#1DB954",
                  border: "1px solid #1DB954",
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
                Connect with Spotify
              </button>
            )}
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center relative z-10 py-8">
        {isLoading ? (
          <div className="text-center">
            <p className="text-gray-400 text-lg">Loading...</p>
          </div>
        ) : isAuthenticated ? (
          <div className="text-center">
            <div className="flex items-center justify-center gap-4 mb-4">
              <h1 className="text-white text-5xl font-bold tracking-tight" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
                Records
              </h1>
              <span 
                className="text-5xl"
                style={{ 
                  color: "#ffffff",
                  fontFamily: "var(--font-playfair), 'Playfair Display', 'Cormorant Garamond', 'Georgia', serif",
                  fontWeight: 300,
                  letterSpacing: "0.15em",
                  fontStyle: "italic",
                }}
              >
                Records
              </span>
            </div>
            <p className="text-gray-400 text-lg">Your playlist records will appear here</p>
            {/* Aquí irá el contenido de records cuando esté implementado */}
          </div>
        ) : (
          <div className="text-center">
            <p className="text-gray-400 text-lg">Redirecting to Spotify...</p>
          </div>
        )}
      </div>

      {/* Modal de validación de token de acceso */}
      <Dialog open={showTokenModal} onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-md rounded-2xl"
          showCloseButton={false}
          style={{
            backgroundColor: "#1a1a1a",
            border: "1px solid #333",
            borderRadius: "1.5rem",
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-white text-xl font-semibold">
              Access Token Required
            </DialogTitle>
            <DialogDescription className="text-gray-400 pt-2">
              Please enter your access token to continue to Records
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={3}
              value={accessToken}
              onChange={handleTokenChange}
              placeholder="123"
              className="w-full px-4 py-3 rounded-lg bg-[#0a0a0a] border border-[#333] text-white placeholder-gray-500 outline-none focus:border-[#1DB954] transition-colors text-center text-2xl tracking-widest"
              style={{ color: "#fff", fontFamily: "monospace", letterSpacing: "0.5em" }}
              disabled={isValidatingToken}
              autoFocus
            />
            {tokenError && (
              <div className="mt-3">
                <p className="text-red-400 text-sm text-center">{tokenError}</p>
                {showContact && (
                  <button
                    onClick={handleContact}
                    className="mt-2 flex items-center gap-2 text-sm text-[#1DB954] hover:text-[#1ed760] transition-colors"
                  >
                    <Mail size={16} />
                    <span>Contact us to get access</span>
                  </button>
                )}
              </div>
            )}
            {isValidatingToken && (
              <div className="mt-3">
                <p className="text-gray-400 text-sm text-center">Validating...</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}

