import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { KaraokeJamProps } from "./schema";

interface StepProps {
  number: number;
  icon: string;
  title: string;
  description: string;
  delay: number;
  primaryColor: string;
}

const Step: React.FC<StepProps> = ({
  number,
  icon,
  title,
  description,
  delay,
  primaryColor,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 12, stiffness: 80 },
  });

  const scale = interpolate(progress, [0, 1], [0.5, 1]);
  const opacity = interpolate(progress, [0, 1], [0, 1]);

  // Connector line animation
  const lineProgress = spring({
    frame: frame - delay - 10,
    fps,
    config: { damping: 20, stiffness: 60 },
  });
  const lineWidth = interpolate(lineProgress, [0, 1], [0, 100]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 30,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
          transform: `scale(${scale})`,
          opacity,
        }}
      >
        {/* Step number badge */}
        <div
          style={{
            width: 50,
            height: 50,
            borderRadius: "50%",
            backgroundColor: primaryColor,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontFamily: "system-ui, sans-serif",
            fontSize: 24,
            fontWeight: 700,
            color: "white",
          }}
        >
          {number}
        </div>

        {/* Icon card */}
        <div
          style={{
            width: 200,
            height: 200,
            backgroundColor: "white",
            borderRadius: 24,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            gap: 16,
            boxShadow: "0 15px 40px rgba(0,0,0,0.15)",
          }}
        >
          <span style={{ fontSize: 70 }}>{icon}</span>
        </div>

        {/* Title and description */}
        <div style={{ textAlign: "center", maxWidth: 200 }}>
          <h3
            style={{
              fontFamily: "system-ui, sans-serif",
              fontSize: 28,
              fontWeight: 700,
              color: "white",
              margin: "0 0 8px 0",
            }}
          >
            {title}
          </h3>
          <p
            style={{
              fontFamily: "system-ui, sans-serif",
              fontSize: 18,
              color: "rgba(255,255,255,0.8)",
              margin: 0,
              lineHeight: 1.4,
            }}
          >
            {description}
          </p>
        </div>
      </div>

      {/* Connector arrow (not for last item) */}
      {number < 3 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginTop: -120,
          }}
        >
          <div
            style={{
              width: lineWidth,
              height: 4,
              backgroundColor: "rgba(255,255,255,0.5)",
              borderRadius: 2,
            }}
          />
          <div
            style={{
              width: 0,
              height: 0,
              borderTop: "10px solid transparent",
              borderBottom: "10px solid transparent",
              borderLeft: "15px solid rgba(255,255,255,0.5)",
              opacity: lineProgress,
            }}
          />
        </div>
      )}
    </div>
  );
};

export const HowItWorksScene: React.FC<KaraokeJamProps> = ({
  primaryColor,
  secondaryColor,
  howItWorksTitle,
  step1Title,
  step1Description,
  step2Title,
  step2Description,
  step3Title,
  step3Description,
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

  const steps = [
    {
      icon: "📋",
      title: step1Title,
      description: step1Description,
    },
    {
      icon: "🎵",
      title: step2Title,
      description: step2Description,
    },
    {
      icon: "🎤",
      title: step3Title,
      description: step3Description,
    },
  ];

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 50,
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
            textShadow: "0 4px 20px rgba(0,0,0,0.2)",
          }}
        >
          {howItWorksTitle}
        </h2>

        {/* Steps */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 20,
          }}
        >
          {steps.map((step, index) => (
            <Step
              key={index}
              number={index + 1}
              icon={step.icon}
              title={step.title}
              description={step.description}
              delay={15 + index * 25}
              primaryColor={primaryColor}
            />
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
