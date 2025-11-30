"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Music, ExternalLink, Loader2, LogOut, ChevronDown, ListMusic, Eye, Bookmark, Users, Clock, Calendar, GripVertical, Trash2, Play, Send } from "lucide-react"
import { ParticlesBackground } from "@/components/particles-background"
import { useSpotifyAuth } from "@/hooks/use-spotify-auth"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

interface Playlist {
  id: string
  spotify_playlist_id: string
  name: string
  description: string
  image: string
  tracks_count: number
  external_url: string
  created_at: string
  followers?: number
  views?: number
  saves?: number
}

interface Track {
  id: string
  name: string
  artist: string
  album: string
  image: string
  duration_ms: number
  preview_url: string | null
  uri: string
  added_at?: string
  position: number
}

export default function MyPlaylistsPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null)
  const [playlistTracks, setPlaylistTracks] = useState<Track[]>([])
  const [loadingTracks, setLoadingTracks] = useState(false)
  const [draggedTrackIndex, setDraggedTrackIndex] = useState<number | null>(null)
  const [editPrompt, setEditPrompt] = useState("")
  const [editingWithAI, setEditingWithAI] = useState(false)
  const { isAuthenticated, isLoading, user, logout } = useSpotifyAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/")
      return
    }

    if (isAuthenticated && playlists.length === 0) {
      fetchPlaylists()
    }
  }, [isAuthenticated, isLoading])

  const fetchPlaylists = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/my-playlists", {
        credentials: "include",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error obteniendo playlists")
      }

      const data = await response.json()
      setPlaylists(data.playlists || [])
    } catch (error) {
      console.error("Error fetching playlists:", error)
      toast.error("Error loading playlists", {
        description: error instanceof Error ? error.message : "Please try again",
        duration: 5000,
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchPlaylistTracks = async (playlistId: string) => {
    try {
      setLoadingTracks(true)
      const response = await fetch(`/api/playlist/${playlistId}/tracks`, {
        credentials: "include",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error obteniendo tracks")
      }

      const data = await response.json()
      setPlaylistTracks(data.tracks || [])
    } catch (error) {
      console.error("Error fetching tracks:", error)
      toast.error("Error loading tracks", {
        description: error instanceof Error ? error.message : "Please try again",
        duration: 5000,
      })
    } finally {
      setLoadingTracks(false)
    }
  }

  const handlePlaylistClick = (playlist: Playlist) => {
    setSelectedPlaylist(playlist)
    fetchPlaylistTracks(playlist.spotify_playlist_id)
  }

  const handleBackToGrid = () => {
    setSelectedPlaylist(null)
    setPlaylistTracks([])
  }

  const handleDeleteTrack = async (trackId: string, trackName: string, trackUri: string) => {
    if (!confirm(`Remove "${trackName}" from this playlist?`)) {
      return
    }

    if (!selectedPlaylist) return

    try {
      const response = await fetch(`/api/playlist/${selectedPlaylist.spotify_playlist_id}/tracks/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          trackUris: [trackUri],
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error eliminando track")
      }

      // Actualizar UI
      setPlaylistTracks(playlistTracks.filter(track => track.id !== trackId))
      toast.success("Track removed", {
        description: "The track has been removed from Spotify",
        duration: 2000,
      })
    } catch (error) {
      console.error("Error deleting track:", error)
      toast.error("Couldn't remove track", {
        description: error instanceof Error ? error.message : "Please try again",
        duration: 4000,
      })
    }
  }

  const handleDragStart = (index: number) => {
    setDraggedTrackIndex(index)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (draggedTrackIndex === null || !selectedPlaylist) return

    const rangeStart = draggedTrackIndex
    const insertBefore = dropIndex > draggedTrackIndex ? dropIndex + 1 : dropIndex

    // Optimistic update
    const newTracks = [...playlistTracks]
    const draggedItem = newTracks[draggedTrackIndex]
    newTracks.splice(draggedTrackIndex, 1)
    newTracks.splice(dropIndex, 0, draggedItem)
    
    // Actualizar posiciones
    newTracks.forEach((track, index) => {
      track.position = index
    })
    
    setPlaylistTracks(newTracks)
    setDraggedTrackIndex(null)

    try {
      const response = await fetch(`/api/playlist/${selectedPlaylist.spotify_playlist_id}/tracks/reorder`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          rangeStart,
          insertBefore,
          rangeLength: 1,
        }),
      })

      if (!response.ok) {
        // Revertir cambios si falla
        setPlaylistTracks(playlistTracks)
        const errorData = await response.json()
        throw new Error(errorData.error || "Error reordenando track")
      }

      toast.success("Track reordered", {
        description: "The track order has been updated in Spotify",
        duration: 2000,
      })
    } catch (error) {
      console.error("Error reordering track:", error)
      toast.error("Couldn't reorder track", {
        description: error instanceof Error ? error.message : "Please try again",
        duration: 4000,
      })
    }
  }

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const calculateTotalDuration = () => {
    return playlistTracks.reduce((total, track) => total + track.duration_ms, 0)
  }

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

  const handleEditWithAI = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editPrompt.trim()) {
      toast.error("What should we change?", {
        description: "Tell us how to modify the playlist",
        duration: 3000,
      })
      return
    }

    setEditingWithAI(true)
    
    try {
      const result = await generateTracks(editPrompt)
      // Convertir los tracks al formato que esperamos
      const formattedTracks: Track[] = result.tracks.map((track, index) => ({
        id: track.id,
        name: track.name,
        artist: track.artist,
        album: track.album,
        image: track.image,
        duration_ms: track.duration_ms,
        preview_url: track.preview_url || null,
        uri: track.uri || `spotify:track:${track.id}`,
        position: index,
      }))
      
      setPlaylistTracks(formattedTracks)
      setEditPrompt("")
      toast.success("Playlist updated!", {
        description: "Your playlist has been modified with AI",
        duration: 2000,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Try again"
      toast.error("Couldn't update playlist", {
        description: errorMessage,
        duration: 4000,
      })
    } finally {
      setEditingWithAI(false)
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen w-full flex flex-col relative" style={{ backgroundColor: "#000" }}>
        <ParticlesBackground />
        <div className="flex-1 flex items-center justify-center relative z-10">
          <Loader2 className="w-8 h-8 text-[#1DB954] animate-spin" />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen w-full flex flex-col relative" style={{ backgroundColor: "#000" }}>
      <ParticlesBackground />
      
      {/* Navbar */}
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
                  className="flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 font-sans text-sm font-medium hover:opacity-90 min-w-[180px] justify-between"
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
                  <div className="flex items-center gap-2">
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
                    <span className="text-sm font-medium truncate max-w-[60px]" style={{ color: "#1DB954" }}>
                      Hi, {(() => {
                        const name = user.display_name?.split(" ")[0] || user.email?.split("@")[0] || "User"
                        return name.length > 4 ? name.substring(0, 4) + "..." : name
                      })()}
                    </span>
                  </div>
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
                  onClick={() => router.push("/my-playlists")}
                  className="cursor-pointer focus:bg-[#1DB954] focus:text-black"
                  style={{ color: "#fff" }}
                >
                  <ListMusic className="mr-2 h-4 w-4" />
                  <span className="font-normal">My Playlists</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer focus:bg-[#1DB954] focus:text-black"
                  style={{ color: "#fff" }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
                
                {/* Plaquita Dale Play */}
                <div className="pl-2 pr-3 py-2 flex items-center gap-1 cursor-default border-t border-[#333]" style={{ backgroundColor: "#1a1a1a" }}>
                  <img 
                    src="/dp.png" 
                    alt="Dale Play" 
                    className="h-4 w-auto opacity-80"
                  />
                  <p className="font-semibold text-xs opacity-50" style={{ fontFamily: "system-ui, -apple-system, sans-serif", color: "#fff" }}>
                    Dale Play
                  </p>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <button
              onClick={() => router.push("/")}
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

      <div className="flex-1 flex flex-col relative z-10 py-8 px-4">
        <div className="w-full max-w-7xl mx-auto">
          {selectedPlaylist ? (
            /* Vista Detallada de Playlist */
            <div className="flex flex-col gap-6">
              {/* Header */}
              <div className="flex items-center gap-4 mb-4">
                <button
                  onClick={handleBackToGrid}
                  className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                  <ArrowLeft size={20} />
                  <span className="text-sm font-medium">Back</span>
                </button>
              </div>

              {/* Layout: Métricas a la izquierda, Tracks a la derecha */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Panel de Métricas (Izquierda) */}
                <div className="lg:col-span-1">
                  <div className="rounded-lg p-6" style={{ backgroundColor: "#1a1a1a" }}>
                    {/* Playlist Name */}
                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-4" style={{ fontFamily: "system-ui, -apple-system, sans-serif", letterSpacing: "0.02em" }}>
                      {selectedPlaylist.name}
                    </h1>
                    
                    {/* Playlist Image */}
                    <div className="mb-6 aspect-square rounded-lg overflow-hidden shadow-lg">
                      <img
                        src={selectedPlaylist.image || "/playlist.png"}
                        alt={selectedPlaylist.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = "/playlist.png"
                        }}
                      />
                    </div>

                    {/* Métricas */}
                    <div className="space-y-3">
                      {/* Primera fila: Views y Saves */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2 text-white">
                          <Eye className="w-4 h-4 text-[#1DB954] shrink-0" />
                          <div>
                            <p className="text-xs text-gray-400">Views</p>
                            <p className="text-sm font-semibold">{selectedPlaylist.views || 0}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-white">
                          <Bookmark className="w-4 h-4 text-[#1DB954] shrink-0" />
                          <div>
                            <p className="text-xs text-gray-400">Saves</p>
                            <p className="text-sm font-semibold">{selectedPlaylist.saves || 0}</p>
                          </div>
                        </div>
                      </div>
                      {/* Segunda fila: Followers y Songs */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2 text-white">
                          <Users className="w-4 h-4 text-[#1DB954] shrink-0" />
                          <div>
                            <p className="text-xs text-gray-400">Followers</p>
                            <p className="text-sm font-semibold">{selectedPlaylist.followers || 0}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-white">
                          <Music className="w-4 h-4 text-[#1DB954] shrink-0" />
                          <div>
                            <p className="text-xs text-gray-400">Songs</p>
                            <p className="text-sm font-semibold">{playlistTracks.length}</p>
                          </div>
                        </div>
                      </div>
                      {/* Tercera fila: Duration y Created en la misma línea */}
                      <div className="flex items-center gap-2 text-white">
                        <Clock className="w-4 h-4 text-[#1DB954] shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-400">Duration</p>
                          <p className="text-sm font-semibold">{formatDuration(calculateTotalDuration())}</p>
                        </div>
                        <Calendar className="w-4 h-4 text-[#1DB954] shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-400">Created</p>
                          <p className="text-sm font-semibold">
                            {new Date(selectedPlaylist.created_at).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Botón para abrir en Spotify */}
                    <button
                      onClick={() => window.open(selectedPlaylist.external_url, "_blank")}
                      className="w-full mt-6 px-4 py-3 rounded-full font-medium transition-all duration-300 flex items-center justify-center gap-2"
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
                      Open in Spotify
                    </button>
                  </div>
                </div>

                {/* Panel de Tracks (Derecha) */}
                <div className="lg:col-span-2">
                  <div className="rounded-lg p-6" style={{ backgroundColor: "#1a1a1a" }}>
                    <h2 className="text-xl font-semibold text-white mb-4">Tracks</h2>
                    
                    {/* Input de edición con IA */}
                    <div className="mb-4">
                      <form onSubmit={handleEditWithAI} className="w-full">
                        <div
                          className="flex items-center gap-0 rounded-full transition-all duration-300 w-full"
                          style={{ backgroundColor: "#0a0a0a" }}
                        >
                          <input
                            type="text"
                            value={editPrompt}
                            onChange={(e) => setEditPrompt(e.target.value)}
                            placeholder="Edit playlist with AI... (e.g., 'add more energetic songs', 'remove slow songs')"
                            className="flex-1 px-6 py-4 bg-transparent text-white placeholder-gray-500 outline-none font-sans text-base"
                            style={{ color: "#ffffff" }}
                            disabled={editingWithAI}
                          />
                          <button
                            type="submit"
                            disabled={editingWithAI}
                            className="mr-3 p-2 rounded-full transition-all duration-300 hover:scale-110 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                              backgroundColor: "#1DB954",
                              color: "#000",
                            }}
                            onMouseEnter={(e) => {
                              if (!editingWithAI) {
                                e.currentTarget.style.boxShadow = "0 0 16px rgba(29, 185, 84, 0.4)"
                                e.currentTarget.style.backgroundColor = "#1ed760"
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!editingWithAI) {
                                e.currentTarget.style.boxShadow = "none"
                                e.currentTarget.style.backgroundColor = "#1DB954"
                              }
                            }}
                            aria-label="Edit with AI"
                          >
                            {editingWithAI ? (
                              <Loader2 size={20} strokeWidth={2.5} className="animate-spin" />
                            ) : (
                              <Send size={20} strokeWidth={2.5} />
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                    
                    {loadingTracks ? (
                      <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-[#1DB954] animate-spin" />
                      </div>
                    ) : playlistTracks.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <Music className="w-16 h-16 text-gray-600 mb-4" />
                        <p className="text-gray-400">No tracks in this playlist</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {playlistTracks.map((track, index) => (
                          <div
                            key={track.id}
                            draggable
                            onDragStart={() => handleDragStart(index)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, index)}
                            className="group flex items-center gap-4 p-3 rounded-lg transition-all duration-300 hover:bg-[#252525] cursor-move"
                            style={{ backgroundColor: draggedTrackIndex === index ? "#252525" : "transparent" }}
                          >
                            <GripVertical 
                              className="w-5 h-5 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing shrink-0"
                            />
                            <span className="text-gray-500 text-sm w-8 text-right shrink-0">{index + 1}</span>
                            <img
                              src={track.image}
                              alt={track.album}
                              className="w-12 h-12 rounded object-cover shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-medium text-sm truncate">{track.name}</p>
                              <p className="text-gray-400 text-xs truncate">{track.artist}</p>
                            </div>
                            {track.preview_url && (
                              <audio
                                controls
                                className="h-8 max-w-[200px] shrink-0"
                                preload="none"
                                onPlay={(e) => {
                                  document.querySelectorAll('audio').forEach((audio) => {
                                    if (audio !== e.currentTarget) {
                                      audio.pause()
                                    }
                                  })
                                }}
                              >
                                <source src={track.preview_url} type="audio/mpeg" />
                              </audio>
                            )}
                            <div className="text-gray-500 text-xs shrink-0">
                              {formatDuration(track.duration_ms)}
                            </div>
                            <button
                              onClick={() => handleDeleteTrack(track.id, track.name, track.uri)}
                              className="p-2 rounded-lg transition-all duration-300 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 shrink-0"
                              style={{ color: "#ef4444" }}
                              aria-label="Delete track"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Vista de Grid de Playlists */
            <>
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 mb-6 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="text-sm font-medium">Back</span>
            </button>
            
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-2" style={{ fontFamily: "system-ui, -apple-system, sans-serif", letterSpacing: "0.02em" }}>
              My Playlists
            </h1>
            <p className="text-gray-400 text-sm">
              {playlists.length === 0 
                ? "You haven't created any playlists yet" 
                : `${playlists.length} ${playlists.length === 1 ? 'playlist' : 'playlists'} created`}
            </p>
          </div>

          {/* Playlists Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-[#1DB954] animate-spin" />
            </div>
          ) : playlists.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: "#1a1a1a" }}>
                <Music className="w-12 h-12 text-gray-600" />
              </div>
              <h2 className="text-2xl font-semibold text-white mb-2">No playlists yet</h2>
              <p className="text-gray-400 mb-6">Create your first playlist to get started</p>
              <button
                onClick={() => router.push("/")}
                className="px-6 py-3 rounded-full font-medium transition-all duration-300"
                style={{
                  backgroundColor: "#1DB954",
                  color: "#000",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#1ed760"
                  e.currentTarget.style.transform = "scale(1.05)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#1DB954"
                  e.currentTarget.style.transform = "scale(1)"
                }}
              >
                Create Playlist
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {playlists.map((playlist) => (
                <div
                  key={playlist.id}
                  className="group cursor-pointer rounded-lg p-3 transition-all duration-300"
                  style={{ backgroundColor: "#1a1a1a" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#252525"
                    e.currentTarget.style.transform = "translateY(-4px)"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#1a1a1a"
                    e.currentTarget.style.transform = "translateY(0)"
                  }}
                  onClick={() => handlePlaylistClick(playlist)}
                >
                  {/* Playlist Image */}
                  <div className="relative mb-3 aspect-square rounded-lg overflow-hidden shadow-lg">
                    <img
                      src={playlist.image || "/playlist.png"}
                      alt={playlist.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = "/playlist.png"
                      }}
                    />
                  </div>

                  {/* Playlist Info */}
                  <div>
                    <h3 className="text-white font-semibold mb-1.5 line-clamp-2 group-hover:text-[#1DB954] transition-colors text-sm">
                      {playlist.name}
                    </h3>
                    {/* Métricas */}
                    <div className="flex items-center gap-3 text-gray-400 text-xs">
                      <div className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>{playlist.views || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                        <span>{playlist.saves || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span>{playlist.followers || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
            </>
          )}
        </div>
      </div>
    </main>
  )
}

