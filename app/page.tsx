"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Send, LogOut, ChevronDown, Music, Loader2, CheckCircle2, ExternalLink, RefreshCw, Edit2, Save } from "lucide-react"
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

interface Track {
  id: string
  name: string
  artist: string
  album: string
  image: string
  duration_ms: number
  preview_url?: string
}

type FlowState = 'idle' | 'loading' | 'preview' | 'creating' | 'success'

export default function PlaylistPrompt() {
  const [prompt, setPrompt] = useState("")
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [flowState, setFlowState] = useState<FlowState>('idle')
  const [tracks, setTracks] = useState<Track[]>([])
  const [playlistUrl, setPlaylistUrl] = useState<string>("")
  const [playlistName, setPlaylistName] = useState("")
  const [isEditingName, setIsEditingName] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState("Analyzing your request...")
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
      window.history.replaceState({}, "", "/")
    } else if (connected === "true") {
      // Limpiar la URL - el hook manejará la verificación
      window.history.replaceState({}, "", "/")
      // Mostrar mensaje de éxito
      toast.success("Connected!", {
        description: "Your Spotify account is now connected",
        duration: 2000,
      })
    }
  }, [])

  // Mock function para generar canciones (sin Gemini todavía)
  const generateTracks = async (promptText: string): Promise<Track[]> => {
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Mock tracks basados en el prompt
    const mockTracks: Track[] = [
      {
        id: "1",
        name: "Song 1",
        artist: "Artist 1",
        album: "Album 1",
        image: "https://via.placeholder.com/300/1DB954/000000?text=Album+1",
        duration_ms: 180000,
      },
      {
        id: "2",
        name: "Song 2",
        artist: "Artist 2",
        album: "Album 2",
        image: "https://via.placeholder.com/300/1DB954/000000?text=Album+2",
        duration_ms: 210000,
      },
      {
        id: "3",
        name: "Song 3",
        artist: "Artist 3",
        album: "Album 3",
        image: "https://via.placeholder.com/300/1DB954/000000?text=Album+3",
        duration_ms: 195000,
      },
      {
        id: "4",
        name: "Song 4",
        artist: "Artist 4",
        album: "Album 4",
        image: "https://via.placeholder.com/300/1DB954/000000?text=Album+4",
        duration_ms: 220000,
      },
      {
        id: "5",
        name: "Song 5",
        artist: "Artist 5",
        album: "Album 5",
        image: "https://via.placeholder.com/300/1DB954/000000?text=Album+5",
        duration_ms: 200000,
      },
    ]
    
    return mockTracks
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Check if user is authenticated
    if (!isAuthenticated) {
      setShowConnectModal(true)
      return
    }

    if (!prompt.trim()) {
      toast.error("Describe your playlist", {
        description: "Tell us what you want to listen to!",
        duration: 3000,
      })
      return
    }

    // Paso 1: Loading/Generación
    setFlowState('loading')
    setLoadingMessage("Analyzing your request...")
    
    // Cambiar mensajes durante la carga
    const messages = [
      "Analyzing your request...",
      "Searching for perfect songs...",
      "Curating your playlist...",
      "Almost ready...",
    ]
    
    let messageIndex = 0
    const messageInterval = setInterval(() => {
      messageIndex++
      if (messageIndex < messages.length) {
        setLoadingMessage(messages[messageIndex])
      }
    }, 500)
    
    try {
      // Generar canciones (mock por ahora)
      const generatedTracks = await generateTracks(prompt)
      clearInterval(messageInterval)
      
      setTracks(generatedTracks)
      
      // Generar nombre de playlist basado en el prompt
      const generatedName = prompt.length > 30 ? prompt.substring(0, 30) + "..." : prompt
      setPlaylistName(generatedName)
      
      // Paso 2: Preview
      setFlowState('preview')
    } catch (error) {
      clearInterval(messageInterval)
      toast.error("Error generating playlist", {
        description: "Please try again",
        duration: 3000,
      })
      setFlowState('idle')
    }
  }

  const handleCreatePlaylist = async () => {
    // Paso 3: Creando playlist
    setFlowState('creating')
    
    try {
      // Simular creación de playlist en Spotify
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Mock URL de playlist
      const mockPlaylistUrl = "https://open.spotify.com/playlist/mock123"
      setPlaylistUrl(mockPlaylistUrl)
      
      // Paso 4: Éxito
      setFlowState('success')
    } catch (error) {
      toast.error("Error creating playlist", {
        description: "Please try again",
        duration: 3000,
      })
      setFlowState('preview')
    }
  }

  const handleRegenerate = () => {
    setFlowState('loading')
    generateTracks(prompt).then((generatedTracks) => {
      setTracks(generatedTracks)
      setFlowState('preview')
    }).catch(() => {
      setFlowState('idle')
    })
  }

  const handleReset = () => {
    setFlowState('idle')
    setTracks([])
    setPrompt("")
    setPlaylistUrl("")
    setPlaylistName("")
    setIsEditingName(false)
  }

  const handleSaveName = () => {
    if (playlistName.trim()) {
      setIsEditingName(false)
    }
  }

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
          <div className="flex items-center">
            <img 
              src="/logo.png" 
              alt="Spoty" 
              className="h-10 w-auto"
            />
          </div>

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
              Connect with Spotify
            </button>
          )}
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center relative z-10 py-8">
        {flowState === 'idle' && (
          <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto px-4 flex flex-col items-center gap-4">
            <h2 className="text-white text-2xl font-medium text-center mb-2" style={{ fontFamily: "system-ui, sans-serif" }}>
              What do you feel like listening to today?
            </h2>
            
            <div
              className="flex items-center gap-0 rounded-full transition-all duration-300 w-full"
              style={{ backgroundColor: "#1a1a1a" }}
            >
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the playlist you want…"
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
                aria-label="Send prompt"
              >
                <Send size={20} strokeWidth={2.5} />
              </button>
            </div>
          </form>
        )}

        {flowState === 'loading' && (
          <div className="w-full max-w-2xl mx-auto px-4 flex flex-col items-center gap-6">
            <div className="flex flex-col items-center gap-6">
              {/* Spinner grande */}
              <div className="relative">
                <Loader2 className="w-16 h-16 text-[#1DB954] animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Music className="w-6 h-6 text-[#1DB954] opacity-60" />
                </div>
              </div>
              
              {/* Texto animado */}
              <div className="text-center">
                <h2 className="text-white text-2xl font-medium mb-3" style={{ fontFamily: "system-ui, sans-serif" }}>
                  Creating your playlist
                </h2>
                <p className="text-gray-400 text-sm animate-pulse">
                  {loadingMessage}
                </p>
              </div>
            </div>
          </div>
        )}

        {flowState === 'preview' && (
          <div className="w-full max-w-4xl mx-auto px-4 flex flex-col gap-6">
            {/* Card de Playlist */}
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
              {/* Cuadrado de playlist (como Spotify) */}
              <div className="w-full sm:w-64 h-64 rounded-lg flex-shrink-0 shadow-2xl overflow-hidden">
                <img
                  src="/icon.png"
                  alt="Playlist"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Información de la playlist */}
              <div className="flex-1 w-full flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  {isEditingName ? (
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={playlistName}
                        onChange={(e) => setPlaylistName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveName()
                          }
                          if (e.key === 'Escape') {
                            setIsEditingName(false)
                          }
                        }}
                        className="flex-1 px-4 py-2 rounded-lg bg-[#1a1a1a] text-white text-xl font-semibold outline-none border-2 border-[#1DB954] focus:border-[#1ed760]"
                        autoFocus
                        placeholder="Playlist name"
                      />
                      <button
                        onClick={handleSaveName}
                        className="p-2 rounded-lg transition-all duration-300"
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
                        <Save size={18} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center gap-3">
                      <h2 className="text-white text-2xl font-semibold" style={{ fontFamily: "system-ui, sans-serif" }}>
                        {playlistName || "My Playlist"}
                      </h2>
                      <button
                        onClick={() => setIsEditingName(true)}
                        className="p-1.5 rounded-lg transition-all duration-300 hover:bg-[#1a1a1a]"
                        style={{ color: "#1DB954" }}
                      >
                        <Edit2 size={18} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <span>Playlist</span>
                  <span>•</span>
                  <span>{tracks.length} songs</span>
                </div>

                {/* Botones de acción */}
                <div className="flex flex-col sm:flex-row gap-3 mt-2">
                  <button
                    onClick={handleRegenerate}
                    className="px-5 py-2.5 rounded-full transition-all duration-300 font-sans text-sm font-medium flex items-center justify-center gap-2"
                    style={{
                      backgroundColor: "#2a2a2a",
                      color: "#fff",
                      border: "1px solid #444",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#333"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#2a2a2a"
                    }}
                  >
                    <RefreshCw size={16} />
                    Regenerate
                  </button>
                  <button
                    onClick={handleCreatePlaylist}
                    className="px-6 py-2.5 rounded-full transition-all duration-300 font-sans text-sm font-medium flex items-center justify-center gap-2"
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
                    <ExternalLink size={16} />
                    Export to Spotify
                  </button>
                </div>
              </div>
            </div>

            {/* Lista de canciones */}
            <div className="mt-4">
              <h3 className="text-white text-lg font-medium mb-4" style={{ fontFamily: "system-ui, sans-serif" }}>
                Songs
              </h3>
              <div className="space-y-2">
                {tracks.map((track, index) => (
                  <div
                    key={track.id}
                    className="flex items-center gap-4 p-3 rounded-lg transition-all duration-300 hover:bg-[#1a1a1a]"
                    style={{ backgroundColor: "#0a0a0a" }}
                  >
                    <span className="text-gray-500 text-sm w-6 text-right">{index + 1}</span>
                    <img
                      src={track.image}
                      alt={track.album}
                      className="w-12 h-12 rounded object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">{track.name}</p>
                      <p className="text-gray-400 text-xs truncate">{track.artist}</p>
                    </div>
                    <div className="text-gray-500 text-xs">
                      {Math.floor(track.duration_ms / 60000)}:{(Math.floor((track.duration_ms % 60000) / 1000)).toString().padStart(2, '0')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {flowState === 'creating' && (
          <div className="w-full max-w-2xl mx-auto px-4 flex flex-col items-center gap-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 text-[#1DB954] animate-spin" />
              <div className="text-center">
                <h2 className="text-white text-2xl font-medium mb-2" style={{ fontFamily: "system-ui, sans-serif" }}>
                  Creating your playlist...
                </h2>
                <p className="text-gray-400 text-sm">
                  Adding {tracks.length} songs to Spotify
                </p>
              </div>
            </div>
          </div>
        )}

        {flowState === 'success' && (
          <div className="w-full max-w-2xl mx-auto px-4 flex flex-col items-center gap-6">
            <div className="flex flex-col items-center gap-4">
              <CheckCircle2 className="w-16 h-16 text-[#1DB954]" />
              <div className="text-center">
                <h2 className="text-white text-2xl font-medium mb-2" style={{ fontFamily: "system-ui, sans-serif" }}>
                  Playlist Created!
                </h2>
                <p className="text-gray-400 text-sm mb-6">
                  Your playlist has been successfully created on Spotify
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={playlistUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 rounded-full transition-all duration-300 font-sans text-sm font-medium flex items-center justify-center gap-2"
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
                  Open in Spotify
                  <ExternalLink size={16} />
                </a>
                <button
                  onClick={handleReset}
                  className="px-6 py-3 rounded-full transition-all duration-300 font-sans text-sm font-medium"
                  style={{
                    backgroundColor: "#2a2a2a",
                    color: "#fff",
                    border: "1px solid #444",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#333"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#2a2a2a"
                  }}
                >
                  Create Another
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal para conectar Spotify */}
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
              Connect your Spotify
            </DialogTitle>
            <DialogDescription className="text-gray-400 pt-2">
              You need to connect your Spotify account to create playlists.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              onClick={() => setShowConnectModal(false)}
              className="px-4 py-2 rounded-full transition-all duration-300 font-sans text-sm font-medium"
              style={{
                backgroundColor: "#2a2a2a",
                color: "#fff",
                border: "1px solid #444",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#333"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#2a2a2a"
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleConnect}
              className="px-4 py-2 rounded-full transition-all duration-300 font-sans text-sm font-medium"
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
              Connect Spotify
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="w-full py-4 relative z-10 flex justify-center">
        <p className="text-gray-500 text-sm">
          Powered by{" "}
          <a
            href="https://dotasolutions.agency"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#1DB954] hover:text-[#1ed760] transition-colors"
          >
            Dota Solutions
          </a>
        </p>
      </footer>
    </main>
  )
}
