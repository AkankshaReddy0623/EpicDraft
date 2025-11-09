import { useEffect, useState } from 'react'

interface ConfettiProps {
  trigger: boolean
  count?: number
}

export default function Confetti({ trigger, count = 50 }: ConfettiProps) {
  const [particles, setParticles] = useState<Array<{
    id: number
    left: number
    delay: number
    duration: number
    color: string
  }>>([])

  useEffect(() => {
    if (trigger) {
      const colors = ['#D4AF37', '#E6C96B', '#B8941F', '#FFD700', '#FFA500']
      const newParticles = Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 1 + Math.random() * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
      }))
      setParticles(newParticles)
      
      setTimeout(() => {
        setParticles([])
      }, 3000)
    }
  }, [trigger, count])

  if (!trigger || particles.length === 0) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute top-0 w-2 h-2 rounded-full"
          style={{
            left: `${particle.left}%`,
            backgroundColor: particle.color,
            animation: `confetti-fall ${particle.duration}s ease-out ${particle.delay}s forwards`,
          }}
        />
      ))}
    </div>
  )
}

