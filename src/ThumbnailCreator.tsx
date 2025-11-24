import { loadFont } from "@remotion/google-fonts/Montserrat";
import { loadFont as loadJP } from "@remotion/google-fonts/NotoSansJP";
import { AbsoluteFill, getStaticFiles, Img, random } from "remotion";
import { z } from "zod";
import { LoopableOffthreadVideo } from "./LoopableOffthreadVideo";
import { defaultThumbnailSchema } from "./Root";

const { fontFamily } = loadFont();
const { fontFamily: fontFamilyJP } = loadJP();

// Helper for the CSS Audio Bars
const AudioBar = ({ delay, height }: { delay: number; height: number }) => (
  <div
    style={{
      width: "12px",
      height: `${height}px`,
      backgroundColor: "#fff",
      borderRadius: "6px",
      boxShadow: "0 0 10px rgba(255,255,255,0.8)",
      margin: "0 6px",
      opacity: 0.9,
    }}
  />
);

export default function ThumbnailCreator(
  props: z.infer<typeof defaultThumbnailSchema>,
) {
  // Generate a few random heights for the fake visualizer bars based on the title length
  const seed = props.musicTitle.length;
  const bars = new Array(5).fill(0).map((_, i) => ({
    height: 40 + Math.floor(random(seed + i) * 60),
  }));

  const bgSrc =
    process.env.REMOTION_USE_LOCAL_DIR === "yes"
      ? getStaticFiles().find((a) => a.name.startsWith("background"))!.src
      : typeof props.background === "string"
        ? props.background
        : props.background.video;

  return (
    <AbsoluteFill>
      {/* 1. Background Layer */}
      <AbsoluteFill>
        {typeof props.background === "string" ? (
          <Img
            src={bgSrc}
            style={{
              objectFit: "cover",
              width: "100%",
              height: "100%",
              transform: "scale(1.05)", // Slight zoom to avoid edges
              filter: "blur(4px) brightness(0.7) saturate(140%)",
            }}
          />
        ) : (
          <LoopableOffthreadVideo
            src={bgSrc}
            style={{
              objectFit: "cover",
              width: "100%",
              height: "100%",
              transform: "scale(1.05)",
              filter: "blur(4px) brightness(0.7) saturate(140%)",
            }}
            muted
          />
        )}

        {/* Cinematic Vignette Overlay - Draws focus to center */}
        <div
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            background: `radial-gradient(circle at center, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.8) 100%)`,
          }}
        />
      </AbsoluteFill>

      {/* 2. Content Container */}
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "4rem",
        }}
      >
        {/* Top Decoration: Fake Audio Visualizer */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            height: "100px",
            marginBottom: "2rem",
          }}
        >
          {bars.map((bar, i) => (
            <AudioBar key={i} delay={i} height={bar.height} />
          ))}
        </div>

        {/* Main Title */}
        <div
          style={{
            position: "relative",
            zIndex: 10,
            textAlign: "center",
            maxWidth: "90%",
          }}
        >
          <h1
            style={{
              color: "white",
              fontSize: props.musicTitle.length > 20 ? "6rem" : "8rem", // Auto-scale font
              fontWeight: 900,
              lineHeight: 0.95,
              textTransform: "uppercase",
              margin: 0,
              fontFamily: `${fontFamily}, ${fontFamilyJP}, sans-serif`,
              // CSS Text Stroke and Shadow for maximum readability
              textShadow: `
              0px 10px 30px rgba(0,0,0,0.5),
              0px 0px 50px rgba(255,255,255,0.2)
            `,
              WebkitTextStroke: "2px rgba(0,0,0,0.1)",
              letterSpacing: "-0.04em",
              wordWrap: "break-word",
            }}
          >
            {props.musicTitle}
          </h1>
        </div>

        {/* "LYRICS" Badge */}
        <div
          style={{
            marginTop: "3rem",
            background: "rgba(255, 255, 255, 0.95)",
            padding: "0.8rem 3rem",
            borderRadius: "50px",
            boxShadow:
              "0 10px 20px rgba(0,0,0,0.3), 0 0 20px rgba(255,255,255,0.4)",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <div
            style={{
              width: "10px",
              height: "10px",
              background: "#ff3b3b", // "Recording" red dot
              borderRadius: "50%",
            }}
          />
          <span
            style={{
              color: "black",
              fontSize: "2rem",
              fontWeight: 800,
              letterSpacing: "0.2em",
              fontFamily: fontFamily,
              textTransform: "uppercase",
            }}
          >
            Lyrics
          </span>
        </div>
      </AbsoluteFill>

      {/* 3. Frame Border (Optional aesthetic touch) */}
      <AbsoluteFill
        style={{
          border: "20px solid rgba(255,255,255,0.05)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
}
