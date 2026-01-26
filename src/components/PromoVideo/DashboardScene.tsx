import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { KaraokeJamProps } from "./schema";

interface WaveformBarProps {
  index: number;
  primaryColor: string;
  secondaryColor: string;
}

const WaveformBar: React.FC<WaveformBarProps> = ({
  index,
  primaryColor,
  secondaryColor,
}) => {
  const frame = useCurrentFrame();

  // Create pulsing effect with different phases for each bar
  const phase = index * 0.5;
  const baseHeight = 40;
  const amplitude = 60;
  const speed = 0.15;

  const height =
    baseHeight +
    Math.abs(Math.sin(frame * speed + phase)) * amplitude +
    Math.abs(Math.sin(frame * speed * 1.5 + phase * 2)) * 20;

  return (
    <div
      style={{
        width: 12,
        height,
        background: `linear-gradient(180deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
        borderRadius: 6,
        boxShadow: `0 0 20px ${primaryColor}50`,
      }}
    />
  );
};

interface SongCardProps {
  title: string;
  artist: string;
  musicians: { name: string; instrument: string }[];
  isNowPlaying: boolean;
  delay: number;
  primaryColor: string;
  secondaryColor: string;
  nowPlayingLabel: string;
  upNextLabel: string;
}

const SongCard: React.FC<SongCardProps> = ({
  title,
  artist,
  musicians,
  isNowPlaying,
  delay,
  primaryColor,
  secondaryColor,
  nowPlayingLabel,
  upNextLabel,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 12, stiffness: 80 },
  });

  const scale = interpolate(progress, [0, 1], [0.9, 1]);
  const opacity = interpolate(progress, [0, 1], [0, 1]);
  const translateX = interpolate(progress, [0, 1], [50, 0]);

  // Subtle pulse animation for "Now Playing"
  const pulseScale = isNowPlaying
    ? 1 + Math.sin(frame * 0.1) * 0.01
    : 1;

  return (
    <div
      style={{
        backgroundColor: isNowPlaying
          ? "rgba(255,255,255,0.15)"
          : "rgba(255,255,255,0.08)",
        backdropFilter: "blur(20px)",
        borderRadius: 24,
        padding: isNowPlaying ? "40px 50px" : "30px 40px",
        width: isNowPlaying ? 700 : 500,
        display: "flex",
        flexDirection: "column",
        gap: isNowPlaying ? 30 : 20,
        transform: `scale(${scale * pulseScale}) translateX(${translateX}px)`,
        opacity,
        border: isNowPlaying
          ? `2px solid rgba(255,255,255,0.2)`
          : "1px solid rgba(255,255,255,0.1)",
        boxShadow: isNowPlaying
          ? "0 25px 80px rgba(0,0,0,0.3)"
          : "0 15px 40px rgba(0,0,0,0.2)",
      }}
    >
      {/* Badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            backgroundColor: isNowPlaying ? primaryColor : "rgba(255,255,255,0.2)",
            padding: "8px 16px",
            borderRadius: 20,
            fontFamily: "system-ui, sans-serif",
            fontSize: isNowPlaying ? 16 : 14,
            fontWeight: 600,
            color: "white",
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          {isNowPlaying ? nowPlayingLabel : upNextLabel}
        </div>
        {isNowPlaying && (
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              backgroundColor: "#22c55e",
              animation: "pulse 2s infinite",
              boxShadow: "0 0 10px #22c55e",
            }}
          />
        )}
      </div>

      {/* Song info */}
      <div>
        <h3
          style={{
            fontFamily: "system-ui, sans-serif",
            fontSize: isNowPlaying ? 48 : 32,
            fontWeight: 700,
            color: "white",
            margin: 0,
          }}
        >
          {title}
        </h3>
        <p
          style={{
            fontFamily: "system-ui, sans-serif",
            fontSize: isNowPlaying ? 28 : 22,
            color: "rgba(255,255,255,0.7)",
            margin: "8px 0 0 0",
          }}
        >
          {artist}
        </p>
      </div>

      {/* Waveform for now playing */}
      {isNowPlaying && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            height: 120,
            marginTop: 10,
          }}
        >
          {Array.from({ length: 24 }).map((_, i) => (
            <WaveformBar
              key={i}
              index={i}
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
            />
          ))}
        </div>
      )}

      {/* Musicians */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        {musicians.map((musician, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              backgroundColor: "rgba(255,255,255,0.1)",
              padding: "8px 16px",
              borderRadius: 20,
            }}
          >
            <span style={{ fontSize: 18 }}>
              {musician.instrument === "vocals"
                ? "🎤"
                : musician.instrument === "guitar"
                  ? "🎸"
                  : musician.instrument === "drums"
                    ? "🥁"
                    : musician.instrument === "bass"
                      ? "🎸"
                      : "🎹"}
            </span>
            <span
              style={{
                fontFamily: "system-ui, sans-serif",
                fontSize: 16,
                color: "white",
              }}
            >
              {musician.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const DashboardScene: React.FC<KaraokeJamProps> = ({
  primaryColor,
  secondaryColor,
  dashboardTitle,
  liveLabel,
  nowPlaying,
  upNext,
  scanToJoin,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleProgress = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 100 },
  });
  const titleOpacity = interpolate(titleProgress, [0, 1], [0, 1]);
  const titleY = interpolate(titleProgress, [0, 1], [-30, 0]);

  const nowPlayingData = {
    title: "Don't Stop Believin'",
    artist: "Journey",
    musicians: [
      { name: "Alex", instrument: "vocals" },
      { name: "Maria", instrument: "guitar" },
      { name: "James", instrument: "drums" },
      { name: "Sophie", instrument: "bass" },
    ],
  };

  const upNextData = {
    title: "Bohemian Rhapsody",
    artist: "Queen",
    musicians: [
      { name: "Carlos", instrument: "vocals" },
      { name: "Emma", instrument: "keys" },
    ],
  };

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, #1e1b4b 0%, ${primaryColor} 50%, ${secondaryColor} 100%)`,
        padding: 60,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 40,
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
        }}
      >
        <h2
          style={{
            fontFamily: "system-ui, sans-serif",
            fontSize: 48,
            fontWeight: 700,
            color: "white",
            margin: 0,
          }}
        >
          {dashboardTitle}
        </h2>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            backgroundColor: "rgba(255,255,255,0.1)",
            padding: "12px 24px",
            borderRadius: 12,
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              backgroundColor: "#22c55e",
            }}
          />
          <span
            style={{
              fontFamily: "system-ui, sans-serif",
              fontSize: 18,
              color: "white",
            }}
          >
            {liveLabel}
          </span>
        </div>
      </div>

      {/* Cards */}
      <div
        style={{
          display: "flex",
          gap: 40,
          alignItems: "flex-start",
        }}
      >
        <SongCard
          {...nowPlayingData}
          isNowPlaying
          delay={20}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          nowPlayingLabel={nowPlaying}
          upNextLabel={upNext}
        />
        <SongCard
          {...upNextData}
          isNowPlaying={false}
          delay={40}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          nowPlayingLabel={nowPlaying}
          upNextLabel={upNext}
        />
      </div>

      {/* QR Code hint */}
      <div
        style={{
          position: "absolute",
          bottom: 60,
          right: 60,
          display: "flex",
          alignItems: "center",
          gap: 20,
          opacity: interpolate(
            spring({ frame: frame - 60, fps, config: { damping: 20 } }),
            [0, 1],
            [0, 1]
          ),
        }}
      >
        <div
          style={{
            width: 100,
            height: 100,
            backgroundColor: "white",
            borderRadius: 12,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontSize: 14,
            fontFamily: "system-ui, sans-serif",
            color: "#64748b",
          }}
        >
          QR Code
        </div>
        <span
          style={{
            fontFamily: "system-ui, sans-serif",
            fontSize: 18,
            color: "rgba(255,255,255,0.7)",
          }}
        >
          {scanToJoin}
        </span>
      </div>
    </AbsoluteFill>
  );
};
