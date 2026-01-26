import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { KaraokeJamProps } from "./schema";

export const HeroScene: React.FC<KaraokeJamProps> = ({
  primaryColor,
  secondaryColor,
  appName,
  tagline,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo animation
  const logoScale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  // Title slide in from left
  const titleX = spring({
    frame: frame - 15,
    fps,
    config: { damping: 15, stiffness: 80 },
  });
  const titleTranslate = interpolate(titleX, [0, 1], [-100, 0]);
  const titleOpacity = interpolate(titleX, [0, 1], [0, 1]);

  // Tagline fade in
  const taglineOpacity = spring({
    frame: frame - 35,
    fps,
    config: { damping: 20, stiffness: 60 },
  });

  // Animated music notes
  const note1Y = interpolate(frame, [0, 120], [0, -30], {
    extrapolateRight: "extend",
  });
  const note2Y = interpolate(frame, [0, 120], [0, -50], {
    extrapolateRight: "extend",
  });
  const note3Y = interpolate(frame, [0, 120], [0, -40], {
    extrapolateRight: "extend",
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 50%, #1e1b4b 100%)`,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Floating music notes */}
      <div
        style={{
          position: "absolute",
          top: "15%",
          left: "10%",
          fontSize: 80,
          opacity: 0.3,
          transform: `translateY(${note1Y}px) rotate(${frame * 0.5}deg)`,
        }}
      >
        ♪
      </div>
      <div
        style={{
          position: "absolute",
          top: "25%",
          right: "15%",
          fontSize: 100,
          opacity: 0.25,
          transform: `translateY(${note2Y}px) rotate(${-frame * 0.3}deg)`,
        }}
      >
        ♫
      </div>
      <div
        style={{
          position: "absolute",
          bottom: "20%",
          left: "20%",
          fontSize: 70,
          opacity: 0.35,
          transform: `translateY(${note3Y}px) rotate(${frame * 0.4}deg)`,
        }}
      >
        ♩
      </div>

      {/* Main content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 40,
        }}
      >
        {/* Logo/Icon */}
        <div
          style={{
            transform: `scale(${logoScale})`,
            fontSize: 150,
            filter: "drop-shadow(0 10px 30px rgba(0,0,0,0.3))",
          }}
        >
          🎤
        </div>

        {/* App name */}
        <h1
          style={{
            fontFamily: "system-ui, sans-serif",
            fontSize: 120,
            fontWeight: 800,
            color: "white",
            margin: 0,
            textShadow: "0 4px 20px rgba(0,0,0,0.3)",
            transform: `translateX(${titleTranslate}px)`,
            opacity: titleOpacity,
            letterSpacing: -2,
          }}
        >
          {appName}
        </h1>

        {/* Tagline */}
        <p
          style={{
            fontFamily: "system-ui, sans-serif",
            fontSize: 40,
            color: "rgba(255,255,255,0.9)",
            margin: 0,
            opacity: taglineOpacity,
            textShadow: "0 2px 10px rgba(0,0,0,0.2)",
          }}
        >
          {tagline}
        </p>
      </div>
    </AbsoluteFill>
  );
};
