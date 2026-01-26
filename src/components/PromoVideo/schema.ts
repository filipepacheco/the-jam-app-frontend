import { z } from "zod";
import { zColor } from "@remotion/zod-types";

export const karaokeJamSchema = z.object({
  primaryColor: zColor(),
  secondaryColor: zColor(),
  accentColor: zColor(),
  // Translatable strings
  appName: z.string(),
  tagline: z.string(),
  // Features scene
  featuresTitle: z.string(),
  hostsTitle: z.string(),
  hostsDescription: z.string(),
  musiciansTitle: z.string(),
  musiciansDescription: z.string(),
  audienceTitle: z.string(),
  audienceDescription: z.string(),
  // How it works scene
  howItWorksTitle: z.string(),
  step1Title: z.string(),
  step1Description: z.string(),
  step2Title: z.string(),
  step2Description: z.string(),
  step3Title: z.string(),
  step3Description: z.string(),
  // Dashboard scene
  dashboardTitle: z.string(),
  liveLabel: z.string(),
  nowPlaying: z.string(),
  upNext: z.string(),
  scanToJoin: z.string(),
  // CTA scene
  ctaTagline: z.string(),
  ctaButton: z.string(),
});

export type KaraokeJamProps = z.infer<typeof karaokeJamSchema>;
