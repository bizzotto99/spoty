"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Music, ExternalLink, Loader2, LogOut, ChevronDown, ListMusic } from "lucide-react"
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

export default function MyPlaylistsPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(true)
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
        <div className="w-full max-w-6xl mx-auto">
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
                    <h3 className="text-white font-semibold mb-2 line-clamp-2 group-hover:text-[#1DB954] transition-colors">
                      {playlist.name}
                    </h3>
                    {/* Métricas */}
                    <div className="flex items-center gap-4 text-gray-400 text-xs">
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
        </div>
      </div>
    </main>
  )
}

