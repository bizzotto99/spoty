"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Music, ExternalLink, Loader2 } from "lucide-react"
import { ParticlesBackground } from "@/components/particles-background"
import { useSpotifyAuth } from "@/hooks/use-spotify-auth"
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
}

export default function MyPlaylistsPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(true)
  const { isAuthenticated, isLoading } = useSpotifyAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/")
      return
    }

    if (isAuthenticated) {
      fetchPlaylists()
    }
  }, [isAuthenticated, isLoading, router])

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
          <a href="/" className="flex items-center cursor-pointer transition-opacity duration-300 hover:opacity-80">
            <img 
              src="/logo.png" 
              alt="Spoty" 
              className="h-10 w-auto"
            />
          </a>
        </div>
      </nav>

      <div className="flex-1 flex flex-col relative z-10 py-8 px-4">
        <div className="w-full max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-2 mb-6 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="text-sm font-medium">Back</span>
            </button>
            
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {playlists.map((playlist) => (
                <div
                  key={playlist.id}
                  className="group cursor-pointer rounded-lg p-4 transition-all duration-300"
                  style={{ backgroundColor: "#1a1a1a" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#252525"
                    e.currentTarget.style.transform = "translateY(-4px)"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#1a1a1a"
                    e.currentTarget.style.transform = "translateY(0)"
                  }}
                  onClick={() => {
                    if (playlist.external_url) {
                      window.open(playlist.external_url, "_blank")
                    }
                  }}
                >
                  {/* Playlist Image */}
                  <div className="relative mb-4 aspect-square rounded-lg overflow-hidden shadow-lg">
                    <img
                      src={playlist.image}
                      alt={playlist.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = "/icon.png"
                      }}
                    />
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
                      <ExternalLink 
                        className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{ filter: "drop-shadow(0 0 8px rgba(29, 185, 84, 0.8))" }}
                      />
                    </div>
                  </div>

                  {/* Playlist Info */}
                  <div>
                    <h3 className="text-white font-semibold mb-1 line-clamp-2 group-hover:text-[#1DB954] transition-colors">
                      {playlist.name}
                    </h3>
                    <p className="text-gray-400 text-sm line-clamp-2 mb-2">
                      {playlist.description || "No description"}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {playlist.tracks_count} {playlist.tracks_count === 1 ? 'track' : 'tracks'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

