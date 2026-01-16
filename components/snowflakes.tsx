"use client"

import { useEffect, useState } from "react"

export default function Snowflakes() {
  const [snowflakes, setSnowflakes] = useState<Array<{ id: number; left: number; delay: number; duration: number }>>([])

  useEffect(() => {
    // Generate snowflakes
    const generateSnowflakes = () => {
      const flakes = Array.from({ length: 15 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 10 + Math.random() * 5,
      }))
      setSnowflakes(flakes)
    }

    generateSnowflakes()
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          className="absolute text-2xl opacity-70 animate-pulse"
          style={{
            left: `${flake.left}%`,
            top: "-20px",
            animation: `snowfall ${flake.duration}s linear ${flake.delay}s infinite`,
            animationTimingFunction: "cubic-bezier(0.1, 0.7, 0.3, 0.9)",
          }}
        >
          ❄️
        </div>
      ))}
    </div>
  )
}
