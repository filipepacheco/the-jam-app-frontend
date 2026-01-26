import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { KaraokeJamProps } from "./schema";

export const CTAScene: React.FC<KaraokeJamProps> = ({
  primaryColor,
  secondaryColor,
  accentColor,
  appName,
  ctaTagline,
  ctaButton,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo animation
  const logoProgress = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });
  const logoScale = interpolate(logoProgress, [0, 1], [0.5, 1]);
  const logoOpacity = interpolate(logoProgress, [0, 1], [0, 1]);

  // Title animation
  const titleProgress = spring({
    frame: frame - 15,
    fps,
    config: { damping: 15, stiffness: 80 },
  });
  const titleOpacity = interpolate(titleProgress, [0, 1], [0, 1]);
  const titleY = interpolate(titleProgress, [0, 1], [30, 0]);

  // Button animation
  const buttonProgress = spring({
    frame: frame - 30,
    fps,
    config: { damping: 12, stiffness: 80 },
  });
  const buttonScale = interpolate(buttonProgress, [0, 1], [0.8, 1]);
  const buttonOpacity = interpolate(buttonProgress, [0, 1], [0, 1]);

  // Pulsing glow on button
  const glowIntensity = 0.3 + Math.sin(frame * 0.1) * 0.15;

  // Floating particles
  const particles = Array.from({ length: 20 }).map((_, i) => ({
    x: (i * 137) % 100,
    y: ((i * 89) % 100) + Math.sin(frame * 0.05 + i) * 10,
    size: 4 + (i % 3) * 2,
    opacity: 0.1 + (i % 5) * 0.05,
  }));

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 50%, #1e1b4b 100%)`,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Floating particles */}
      {particles.map((particle, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            borderRadius: "50%",
            backgroundColor: "white",
            opacity: particle.opacity,
          }}
        />
      ))}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 40,
        }}
      >
        {/* Logo */}
        <div
          style={{
            fontSize: 120,
            transform: `scale(${logoScale})`,
            opacity: logoOpacity,
            filter: "drop-shadow(0 10px 30px rgba(0,0,0,0.3))",
          }}
        >
          🎤
        </div>

        {/* App name */}
        <h1
          style={{
            fontFamily: "system-ui, sans-serif",
            fontSize: 100,
            fontWeight: 800,
            color: "white",
            margin: 0,
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            textShadow: "0 4px 20px rgba(0,0,0,0.3)",
            letterSpacing: -2,
          }}
        >
          {appName}
        </h1>

        {/* Tagline */}
        <p
          style={{
            fontFamily: "system-ui, sans-serif",
            fontSize: 36,
            color: "rgba(255,255,255,0.9)",
            margin: 0,
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
          }}
        >
          {ctaTagline}
        </p>

        {/* CTA Button */}
        <div
          style={{
            marginTop: 20,
            transform: `scale(${buttonScale})`,
            opacity: buttonOpacity,
          }}
        >
          <div
            style={{
              backgroundColor: accentColor,
              padding: "24px 60px",
              borderRadius: 16,
              fontFamily: "system-ui, sans-serif",
              fontSize: 32,
              fontWeight: 700,
              color: "white",
              boxShadow: `0 0 ${40 * glowIntensity}px ${accentColor}`,
              cursor: "pointer",
            }}
          >
            {ctaButton}
          </div>
        </div>

        {/* URL */}
        <p
          style={{
            fontFamily: "system-ui, sans-serif",
            fontSize: 24,
            color: "rgba(255,255,255,0.6)",
            margin: 0,
            opacity: buttonOpacity,
          }}
        >
          karaokejam.app
        </p>
      </div>
    </AbsoluteFill>
  );
};
