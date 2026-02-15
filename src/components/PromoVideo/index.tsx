/**
 * @deprecated This Remotion-based promo video has been replaced by the lightweight
 * HeroDashboardMockup component in src/components/hero/HeroDashboardMockup.tsx.
 * This directory and its remotion dependencies are scheduled for removal in a follow-up cleanup.
 */
import React from "react";
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame } from "remotion";
import { karaokeJamSchema } from "./schema";
import type { KaraokeJamProps } from "./schema";
import { HeroScene } from "./HeroScene";
import { FeaturesScene } from "./FeaturesScene";
import { HowItWorksScene } from "./HowItWorksScene";
import { DashboardScene } from "./DashboardScene";
import { CTAScene } from "./CTAScene";

// Scene durations in frames (at 30fps)
const SCENE_DURATIONS = {
  hero: 120,        // 4 seconds
  features: 150,    // 5 seconds
  howItWorks: 150,  // 5 seconds
  dashboard: 180,   // 6 seconds
  cta: 90,          // 3 seconds
};

// Transition duration in frames
const TRANSITION_FRAMES = 15;

interface TransitionWrapperProps {
  children: React.ReactNode;
  durationInFrames: number;
}

const TransitionWrapper: React.FC<TransitionWrapperProps> = ({
  children,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();

  // Fade in at start
  const fadeIn = interpolate(frame, [0, TRANSITION_FRAMES], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Fade out at end
  const fadeOut = interpolate(
    frame,
    [durationInFrames - TRANSITION_FRAMES, durationInFrames],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  const opacity = Math.min(fadeIn, fadeOut);

  return (
    <AbsoluteFill style={{ opacity }}>
      {children}
    </AbsoluteFill>
  );
};

export const KaraokeJamPromo: React.FC<KaraokeJamProps> = (props) => {
  // Calculate start frames for each scene
  const startFrames = {
    hero: 0,
    features: SCENE_DURATIONS.hero - TRANSITION_FRAMES,
    howItWorks:
      SCENE_DURATIONS.hero +
      SCENE_DURATIONS.features -
      TRANSITION_FRAMES * 2,
    dashboard:
      SCENE_DURATIONS.hero +
      SCENE_DURATIONS.features +
      SCENE_DURATIONS.howItWorks -
      TRANSITION_FRAMES * 3,
    cta:
      SCENE_DURATIONS.hero +
      SCENE_DURATIONS.features +
      SCENE_DURATIONS.howItWorks +
      SCENE_DURATIONS.dashboard -
      TRANSITION_FRAMES * 4,
  };

  return (
    <AbsoluteFill style={{ backgroundColor: "#1e1b4b" }}>
      {/* Hero Scene */}
      <Sequence from={startFrames.hero} durationInFrames={SCENE_DURATIONS.hero}>
        <TransitionWrapper durationInFrames={SCENE_DURATIONS.hero}>
          <HeroScene {...props} />
        </TransitionWrapper>
      </Sequence>

      {/* Features Scene */}
      <Sequence from={startFrames.features} durationInFrames={SCENE_DURATIONS.features}>
        <TransitionWrapper durationInFrames={SCENE_DURATIONS.features}>
          <FeaturesScene {...props} />
        </TransitionWrapper>
      </Sequence>

      {/* How It Works Scene */}
      <Sequence from={startFrames.howItWorks} durationInFrames={SCENE_DURATIONS.howItWorks}>
        <TransitionWrapper durationInFrames={SCENE_DURATIONS.howItWorks}>
          <HowItWorksScene {...props} />
        </TransitionWrapper>
      </Sequence>

      {/* Dashboard Scene */}
      <Sequence from={startFrames.dashboard} durationInFrames={SCENE_DURATIONS.dashboard}>
        <TransitionWrapper durationInFrames={SCENE_DURATIONS.dashboard}>
          <DashboardScene {...props} />
        </TransitionWrapper>
      </Sequence>

      {/* CTA Scene */}
      <Sequence from={startFrames.cta} durationInFrames={SCENE_DURATIONS.cta}>
        <TransitionWrapper durationInFrames={SCENE_DURATIONS.cta}>
          <CTAScene {...props} />
        </TransitionWrapper>
      </Sequence>
    </AbsoluteFill>
  );
};

export { karaokeJamSchema };
