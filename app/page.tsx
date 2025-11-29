"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Send, LogOut, ChevronDown, Music, Loader2, CheckCircle2, ExternalLink, RefreshCw, Edit2, Save, HelpCircle } from "lucide-react"
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
import { validatePrompt } from "@/lib/prompt-validator"

interface Track {
  id: string
  name: string
  artist: string
  album: string
  image: string
  duration_ms: number
  preview_url?: string
  uri?: string
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
  const [showOptionalModal, setShowOptionalModal] = useState(false)
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

  // Generate tracks using Gemini and Spotify API
  const generateTracks = async (promptText: string): Promise<{ tracks: Track[]; playlistName: string; description: string }> => {
    const response = await fetch("/api/generate-playlist", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ prompt: promptText }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Error generating playlist")
    }

    const data = await response.json()
    
    return {
      tracks: data.tracks,
      playlistName: data.playlistName,
      description: data.description || "",
    }
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

    // Validar campos obligatorios
    const validation = validatePrompt(prompt.trim())
    
    if (!validation.isValid) {
      const errorMessage = validation.errors.length === 1 
        ? validation.errors[0]
        : "Faltan campos obligatorios"
      const errorDescription = validation.errors.join(". ")
      
      toast.error(errorMessage, {
        description: errorDescription,
        duration: 5000,
      })
      return
    }

    // Mostrar warnings si existen (pero no bloquear)
    if (validation.warnings.length > 0) {
      // Los warnings se pueden mostrar pero no bloquean el submit
      console.log("Warnings:", validation.warnings)
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
      // Generar canciones usando Gemini y Spotify
      const result = await generateTracks(prompt)
      clearInterval(messageInterval)
      
      setTracks(result.tracks)
      setPlaylistName(result.playlistName)
      
      // Paso 2: Preview
      setFlowState('preview')
    } catch (error) {
      clearInterval(messageInterval)
      const errorMessage = error instanceof Error ? error.message : "Please try again"
      toast.error("Error generating playlist", {
        description: errorMessage,
        duration: 5000,
      })
      setFlowState('idle')
    }
  }

  const handleCreatePlaylist = async () => {
    // Paso 3: Creando playlist
    setFlowState('creating')
    
    try {
      // Crear playlist en Spotify
      const response = await fetch("/api/create-playlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: playlistName || "My Playlist",
          description: "",
          tracks: tracks.map(track => ({
            uri: track.uri || `spotify:track:${track.id}`,
          })),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error creating playlist")
      }

      const data = await response.json()
      setPlaylistUrl(data.playlistUrl)
      
      // Paso 4: Éxito
      setFlowState('success')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Please try again"
      toast.error("Error creating playlist", {
        description: errorMessage,
        duration: 5000,
      })
      setFlowState('preview')
    }
  }

  const handleRegenerate = () => {
    setFlowState('loading')
    setLoadingMessage("Regenerating playlist...")
    generateTracks(prompt).then((result) => {
      setTracks(result.tracks)
      setPlaylistName(result.playlistName)
      setFlowState('preview')
    }).catch((error) => {
      const errorMessage = error instanceof Error ? error.message : "Please try again"
      toast.error("Error regenerating playlist", {
        description: errorMessage,
        duration: 5000,
      })
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
          <a href="/" className="flex items-center cursor-pointer transition-opacity duration-300 hover:opacity-80">
            <img 
              src="/logo.png" 
              alt="Spoty" 
              className="h-10 w-auto"
            />
          </a>

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

        {isAuthenticated && flowState === 'idle' && (
          <div className="w-full max-w-2xl mx-auto px-4 mt-8">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4" style={{ color: "#1DB954" }} />
                <p className="text-gray-400 text-sm">Tips para mejores resultados</p>
              </div>
              <button
                type="button"
                onClick={() => setShowOptionalModal(true)}
                className="text-xs text-gray-400 hover:text-[#1DB954] transition-colors"
              >
                Ver opciones avanzadas →
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl" style={{ backgroundColor: "#0a0a0a", border: "1px solid #1a1a1a" }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(29, 185, 84, 0.1)" }}>
                    <Music className="w-4 h-4" style={{ color: "#1DB954" }} />
                  </div>
                  <p className="text-white text-sm font-medium">Actividad <span className="text-red-400">*</span></p>
                </div>
                <p className="text-gray-400 text-xs">correr, estudiar, trabajar, relajarte...</p>
              </div>
              
              <div className="p-3 rounded-xl" style={{ backgroundColor: "#0a0a0a", border: "1px solid #1a1a1a" }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(29, 185, 84, 0.1)" }}>
                    <div className="w-4 h-4 border-2 rounded" style={{ borderColor: "#1DB954" }} />
                  </div>
                  <p className="text-white text-sm font-medium">Tiempo <span className="text-red-400">*</span></p>
                </div>
                <p className="text-gray-400 text-xs">45 minutos, 1 hora, 2 horas...</p>
              </div>
            </div>
            
            <div className="mt-3 p-3 rounded-xl" style={{ backgroundColor: "rgba(29, 185, 84, 0.05)", border: "1px solid rgba(29, 185, 84, 0.2)" }}>
              <p className="text-gray-400 text-xs mb-1.5">💡 Ejemplo:</p>
              <p className="text-white text-sm italic" style={{ color: "#1DB954" }}>
                "Una playlist para ir a jugar al fútbol de aprox 45 minutos, con canciones de mundiales"
              </p>
            </div>
          </div>
        )}

        {/* Modal de opciones opcionales */}
        <Dialog open={showOptionalModal} onOpenChange={setShowOptionalModal}>
          <DialogContent
            className="sm:max-w-lg rounded-2xl"
            showCloseButton={false}
            style={{
              backgroundColor: "#1a1a1a",
              border: "1px solid #333",
              borderRadius: "1.5rem",
            }}
          >
            <DialogHeader>
              <DialogTitle className="text-white text-xl font-semibold">
                Opciones Avanzadas (Opcional)
              </DialogTitle>
              <DialogDescription className="text-gray-400 pt-2">
                Puedes especificar estos detalles para personalizar aún más tu playlist
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex flex-col gap-4 py-4">
              <div className="p-3 rounded-xl" style={{ backgroundColor: "#0a0a0a", border: "1px solid #1a1a1a" }}>
                <p className="text-white text-sm font-medium mb-1">Intensidad</p>
                <p className="text-gray-400 text-xs">más chill, entrenamiento fuerte, media, alta...</p>
              </div>
              
              <div className="p-3 rounded-xl" style={{ backgroundColor: "#0a0a0a", border: "1px solid #1a1a1a" }}>
                <p className="text-white text-sm font-medium mb-1">Género</p>
                <p className="text-gray-400 text-xs">rock, pop, reggaeton, electrónica, jazz...</p>
              </div>
              
              <div className="p-3 rounded-xl" style={{ backgroundColor: "#0a0a0a", border: "1px solid #1a1a1a" }}>
                <p className="text-white text-sm font-medium mb-1">Artista</p>
                <p className="text-gray-400 text-xs">artista específico que quieras incluir</p>
              </div>
              
              <div className="p-3 rounded-xl" style={{ backgroundColor: "#0a0a0a", border: "1px solid #1a1a1a" }}>
                <p className="text-white text-sm font-medium mb-1">Canciones en particular</p>
                <p className="text-gray-400 text-xs">canciones específicas que quieras incluir</p>
              </div>
              
              <div className="p-3 rounded-xl" style={{ backgroundColor: "#0a0a0a", border: "1px solid #1a1a1a" }}>
                <p className="text-white text-sm font-medium mb-1">Restricciones</p>
                <p className="text-gray-400 text-xs">ej: "no quiero Duki", "sin reggaeton"</p>
              </div>
              
              <div className="p-3 rounded-xl" style={{ backgroundColor: "#0a0a0a", border: "1px solid #1a1a1a" }}>
                <p className="text-white text-sm font-medium mb-1">Estado de ánimo</p>
                <p className="text-gray-400 text-xs">feliz, triste, motivado, nostálgico...</p>
              </div>
              
              <div className="p-3 rounded-xl" style={{ backgroundColor: "#0a0a0a", border: "1px solid #1a1a1a" }}>
                <p className="text-white text-sm font-medium mb-1">Idioma</p>
                <p className="text-gray-400 text-xs">español, inglés, o ambos</p>
              </div>
            </div>

            <DialogFooter>
              <button
                onClick={() => setShowOptionalModal(false)}
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
                Entendido
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
              <div className="w-full sm:w-72 h-72 rounded-lg flex-shrink-0 shadow-2xl overflow-hidden">
                <img
                  src="/icon.png"
                  alt="Playlist"
                  className="w-full h-full object-cover brightness-110"
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
                    {track.preview_url && (
                      <audio
                        controls
                        className="h-8 max-w-[200px]"
                        preload="none"
                        onPlay={(e) => {
                          // Pausar otros audios cuando se reproduce uno
                          document.querySelectorAll('audio').forEach((audio) => {
                            if (audio !== e.currentTarget) {
                              audio.pause()
                            }
                          })
                        }}
                      >
                        <source src={track.preview_url} type="audio/mpeg" />
                        Your browser does not support the audio element.
                      </audio>
                    )}
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
