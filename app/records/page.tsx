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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"

export default function RecordsPage() {
  const [showConnectModal, setShowConnectModal] = useState(false)
  const { isAuthenticated, user, isLoading, login, logout } = useSpotifyAuth()

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

  // Verificar autenticación al cargar
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setShowConnectModal(true)
    }
  }, [isLoading, isAuthenticated])

  const handleConnect = () => {
    setShowConnectModal(false)
    login()
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

          {/* Records text */}
          <div className="flex items-center gap-4">
            <span 
              className="text-lg font-semibold"
              style={{ 
                color: "#FFD700", // Dorado
                textShadow: "0 0 10px rgba(255, 215, 0, 0.5)",
              }}
            >
              Records
            </span>

            {/* Authentication button */}
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
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center relative z-10 py-8">
        {!isAuthenticated ? (
          <div className="text-center">
            <h1 className="text-white text-3xl font-semibold mb-4">Records</h1>
            <p className="text-gray-400 text-lg">Connect with Spotify to view your records</p>
          </div>
        ) : (
          <div className="text-center">
            <h1 className="text-white text-3xl font-semibold mb-4">Records</h1>
            <p className="text-gray-400 text-lg">Your playlist records will appear here</p>
            {/* Aquí irá el contenido de records cuando esté implementado */}
          </div>
        )}
      </div>

      {/* Modal de conexión */}
      <Dialog open={showConnectModal} onOpenChange={setShowConnectModal}>
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
              Connect with Spotify
            </DialogTitle>
            <DialogDescription className="text-gray-400 pt-2">
              You need to connect your Spotify account to access Records
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-3" style={{ gap: "1rem" }}>
            <button
              onClick={() => setShowConnectModal(false)}
              className="px-6 py-2 rounded-full transition-all duration-300 font-sans text-sm font-medium"
              style={{
                backgroundColor: "transparent",
                color: "#fff",
                border: "1px solid #333",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#2a2a2a"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent"
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleConnect}
              className="px-6 py-2 rounded-full transition-all duration-300 font-sans text-sm font-medium"
              style={{
                backgroundColor: "#1DB954",
                color: "#000",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#1ed760"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#1DB954"
              }}
            >
              Connect
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}

