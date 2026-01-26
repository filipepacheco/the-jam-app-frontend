import { Player } from "@remotion/player";
import { useTranslation } from "react-i18next";
import { KaraokeJamPromo } from "./index";
import type { KaraokeJamProps } from "./schema";

interface PromoVideoPlayerProps {
  autoPlay?: boolean;
  loop?: boolean;
  controls?: boolean;
  className?: string;
}

export const PromoVideoPlayer: React.FC<PromoVideoPlayerProps> = ({
  autoPlay = true,
  loop = true,
  controls = false,
  className = "",
}) => {
  const { t } = useTranslation();

  const inputProps: KaraokeJamProps = {
    // Colors
    primaryColor: "#7c3aed",
    secondaryColor: "#ec4899",
    accentColor: "#06b6d4",
    // Hero scene
    appName: t("promoVideo.appName"),
    tagline: t("promoVideo.tagline"),
    // Features scene
    featuresTitle: t("promoVideo.features.title"),
    hostsTitle: t("promoVideo.features.hosts.title"),
    hostsDescription: t("promoVideo.features.hosts.description"),
    musiciansTitle: t("promoVideo.features.musicians.title"),
    musiciansDescription: t("promoVideo.features.musicians.description"),
    audienceTitle: t("promoVideo.features.audience.title"),
    audienceDescription: t("promoVideo.features.audience.description"),
    // How it works scene
    howItWorksTitle: t("promoVideo.howItWorks.title"),
    step1Title: t("promoVideo.howItWorks.step1.title"),
    step1Description: t("promoVideo.howItWorks.step1.description"),
    step2Title: t("promoVideo.howItWorks.step2.title"),
    step2Description: t("promoVideo.howItWorks.step2.description"),
    step3Title: t("promoVideo.howItWorks.step3.title"),
    step3Description: t("promoVideo.howItWorks.step3.description"),
    // Dashboard scene
    dashboardTitle: t("promoVideo.dashboard.title"),
    liveLabel: t("promoVideo.dashboard.liveLabel"),
    nowPlaying: t("promoVideo.dashboard.nowPlaying"),
    upNext: t("promoVideo.dashboard.upNext"),
    scanToJoin: t("promoVideo.dashboard.scanToJoin"),
    // CTA scene
    ctaTagline: t("promoVideo.cta.tagline"),
    ctaButton: t("promoVideo.cta.button"),
  };

  return (
    <div className={`w-full aspect-video overflow-hidden rounded-2xl shadow-2xl ${className}`}>
      <Player
        component={KaraokeJamPromo}
        inputProps={inputProps}
        durationInFrames={630}
        fps={30}
        compositionWidth={1920}
        compositionHeight={1080}
        style={{
          width: "100%",
          height: "100%",
        }}
        autoPlay={autoPlay}
        loop={loop}
        controls={controls}
      />
    </div>
  );
};
