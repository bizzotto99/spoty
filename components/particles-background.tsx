"use client"

import { useEffect, useRef } from "react"

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  opacity: number
  r: number
  g: number
  b: number
}

export function ParticlesBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number>()
  const particlesRef = useRef<Particle[]>([])
  const mousePosRef = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Configurar tamaño del canvas
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Tracking del cursor
    const handleMouseMove = (e: MouseEvent) => {
      mousePosRef.current = {
        x: e.clientX,
        y: e.clientY,
      }
    }

    const handleMouseLeave = () => {
      mousePosRef.current = null
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseleave", handleMouseLeave)

    // Colores tipo Spotify (verdes sutiles)
    const colorSets = [
      { r: 29, g: 185, b: 84 }, // Verde Spotify
      { r: 30, g: 215, b: 96 }, // Verde claro
      { r: 25, g: 230, b: 108 }, // Verde brillante
    ]

    // Crear partículas (más partículas para un efecto más denso)
    const particleCount = Math.floor((canvas.width * canvas.height) / 8000)
    particlesRef.current = Array.from({ length: particleCount }, () => {
      const colorSet = colorSets[Math.floor(Math.random() * colorSets.length)]
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.5 + 0.2,
        r: colorSet.r,
        g: colorSet.g,
        b: colorSet.b,
      }
    })

    // Función de animación
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const particles = particlesRef.current

      // Primero, actualizar posiciones de todas las partículas
      const mousePos = mousePosRef.current
      
      particles.forEach((particle) => {
        // Reacción al cursor: las partículas se alejan cuando el cursor está cerca
        if (mousePos) {
          const dx = mousePos.x - particle.x
          const dy = mousePos.y - particle.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          // Radio de influencia del cursor (más grande para mayor área de efecto)
          const influenceRadius = 250
          
          if (distance < influenceRadius && distance > 0) {
            // Fuerza de repulsión que aumenta cuanto más cerca está el cursor
            const force = (influenceRadius - distance) / influenceRadius
            const angle = Math.atan2(dy, dx)
            
            // Aplicar fuerza de repulsión (alejándose del cursor)
            particle.vx -= Math.cos(angle) * force * 0.15
            particle.vy -= Math.sin(angle) * force * 0.15
          }
        }

        // Aplicar movimiento normal
        particle.x += particle.vx
        particle.y += particle.vy

        // Aplicar fricción suave para que el movimiento sea más natural
        particle.vx *= 0.98
        particle.vy *= 0.98

        // Rebotar en los bordes
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1

        // Mantener partículas dentro del canvas
        particle.x = Math.max(0, Math.min(canvas.width, particle.x))
        particle.y = Math.max(0, Math.min(canvas.height, particle.y))
      })

      // Dibujar conexiones entre partículas cercanas
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const particle = particles[i]
          const otherParticle = particles[j]
          const dx = particle.x - otherParticle.x
          const dy = particle.y - otherParticle.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 120) {
            ctx.beginPath()
            ctx.strokeStyle = `rgba(29, 185, 84, ${(1 - distance / 120) * 0.1})`
            ctx.lineWidth = 0.5
            ctx.moveTo(particle.x, particle.y)
            ctx.lineTo(otherParticle.x, otherParticle.y)
            ctx.stroke()
          }
        }
      }

      // Dibujar todas las partículas
      particles.forEach((particle) => {
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${particle.r}, ${particle.g}, ${particle.b}, ${particle.opacity})`
        ctx.fill()
      })

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseleave", handleMouseLeave)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ backgroundColor: "transparent" }}
    />
  )
}
