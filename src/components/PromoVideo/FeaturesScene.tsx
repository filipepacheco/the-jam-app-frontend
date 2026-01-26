import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { KaraokeJamProps } from "./schema";

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  delay: number;
  accentColor: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  delay,
  accentColor,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 12, stiffness: 80 },
  });

  const scale = interpolate(progress, [0, 1], [0.8, 1]);
  const opacity = interpolate(progress, [0, 1], [0, 1]);
  const translateY = interpolate(progress, [0, 1], [50, 0]);

  return (
    <div
      style={{
        backgroundColor: "rgba(255,255,255,0.95)",
        borderRadius: 24,
        padding: "50px 40px",
        width: 380,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 24,
        transform: `scale(${scale}) translateY(${translateY}px)`,
        opacity,
        boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
      }}
    >
      <div
        style={{
          width: 100,
          height: 100,
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${accentColor}20 0%, ${accentColor}40 100%)`,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: 50,
        }}
      >
        {icon}
      </div>
      <h3
        style={{
          fontFamily: "system-ui, sans-serif",
          fontSize: 36,
          fontWeight: 700,
          color: "#1e1b4b",
          margin: 0,
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontFamily: "system-ui, sans-serif",
          fontSize: 22,
          color: "#64748b",
          margin: 0,
          textAlign: "center",
          lineHeight: 1.5,
        }}
      >
        {description}
      </p>
    </div>
  );
};

export const FeaturesScene: React.FC<KaraokeJamProps> = ({
  primaryColor,
  accentColor,
  featuresTitle,
  hostsTitle,
  hostsDescription,
  musiciansTitle,
  musiciansDescription,
  audienceTitle,
  audienceDescription,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title animation
  const titleProgress = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 100 },
  });
  const titleOpacity = interpolate(titleProgress, [0, 1], [0, 1]);
  const titleY = interpolate(titleProgress, [0, 1], [-30, 0]);

  const features = [
    {
      icon: "🎛️",
      title: hostsTitle,
      description: hostsDescription,
      delay: 15,
    },
    {
      icon: "🎸",
      title: musiciansTitle,
      description: musiciansDescription,
      delay: 30,
    },
    {
      icon: "👥",
      title: audienceTitle,
      description: audienceDescription,
      delay: 45,
    },
  ];

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, #1e1b4b 0%, ${primaryColor} 100%)`,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 60,
        }}
      >
        {/* Section title */}
        <h2
          style={{
            fontFamily: "system-ui, sans-serif",
            fontSize: 64,
            fontWeight: 700,
            color: "white",
            margin: 0,
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
          }}
        >
          {featuresTitle}
        </h2>

        {/* Feature cards */}
        <div
          style={{
            display: "flex",
            gap: 40,
          }}
        >
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              delay={feature.delay}
              accentColor={accentColor}
            />
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
