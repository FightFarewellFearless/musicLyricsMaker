import { useAudioData } from "@remotion/media-utils";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  AbsoluteFill,
  Audio,
  getStaticFiles,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useCurrentScale,
  useVideoConfig
} from "remotion";
import {
  Animated,
  Animation,
  Ease,
  Move,
  Rotate,
  Scale,
} from "remotion-animated";
import { z } from "zod";
import { LoopableOffthreadVideo } from "./LoopableOffthreadVideo";
import { DefaultSchema } from "./Root";
import normalizeAudioData from "./normalizeAudioData";

import { loadFont as loadFontNoto } from "@remotion/google-fonts/NotoSans";
import { loadFont as loadFontAR } from "@remotion/google-fonts/NotoSansArabic";
import { loadFont as loadFontJP } from "@remotion/google-fonts/NotoSansJP";
import { loadFont as loadFontKR } from "@remotion/google-fonts/NotoSansKR";
import { loadFont as loadFontSC } from "@remotion/google-fonts/NotoSansSC";
const { fontFamily: fontBase } = loadFontNoto();
const { fontFamily: fontJP } = loadFontJP();
const { fontFamily: fontKR } = loadFontKR();
const { fontFamily: fontSC } = loadFontSC();
const { fontFamily: fontArabic } = loadFontAR();
const universalFontFamily = `${fontBase}, ${fontJP}, ${fontKR}, ${fontSC}, ${fontArabic}, sans-serif`;

export default function Music(props: z.infer<typeof DefaultSchema>) {
  const music =
    process.env.REMOTION_USE_LOCAL_DIR === "yes"
      ? staticFile("music.mp3")
      : `https://sebelasempat.hitam.id/api/ytMusic/${encodeURIComponent(props.musicTitle)}`;
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const duration = frame / fps;
  // console.log(props.syncronizeLyrics.filter((a) => duration >= a.start), duration)
  const lyricsOnCurrentDuration = props.syncronizeLyrics.filter(
    (a) => duration >= a.start,
  );
  let currentLyrics = lyricsOnCurrentDuration.slice(-1)[0]?.text || "♫";
  currentLyrics =
    currentLyrics === "" || currentLyrics === " " ? "♫" : currentLyrics;
  const previousLyrics = lyricsOnCurrentDuration.slice(-2)[0]?.text || "";
  const nextLyrics =
    props.syncronizeLyrics[
      lyricsOnCurrentDuration.lastIndexOf(
        lyricsOnCurrentDuration[lyricsOnCurrentDuration.length - 1],
      ) + 1
    ]?.text || "";

  const translateLyricsOnCurrentDuration =
    props.translateSyncronizeLyrics.filter((a) => duration >= a.start);
  let translateCurrentLyrics =
    translateLyricsOnCurrentDuration.slice(-1)[0]?.text || "";

  const audioData = useAudioData(music);

  const ytmMusicInfoRef = useRef<HTMLDivElement>(null);
  const [ytmMusicInfoWidth, setYtmMusicInfoWidth] = useState(0);
  const scale = useCurrentScale();

  useLayoutEffect(() => {
    if (!ytmMusicInfoRef.current) return;
    setYtmMusicInfoWidth(
      ytmMusicInfoRef.current.getBoundingClientRect().width / scale,
    );
  }, [scale, audioData]);

  const currentLyricsAnimation = useMemo(() => {
    const animation: Animation[] = [];
    props.syncronizeLyrics.forEach((a) => {
      const start = a.start * fps;
      const duration = fps / 2;
      animation.push(
        Move({ y: 0, initialY: 50, start, duration }),
        Scale({ by: 1, initial: 0.85, start, duration, initialZ: 1 }),
      );
    });
    return animation;
  }, []);

  const currentTranslateLyricsAnimation = useMemo(() => {
    const animation: Animation[] = [];
    props.translateSyncronizeLyrics.forEach((a) => {
      const start = a.start * fps;
      const duration = fps / 2;
      animation.push(
        Scale({ by: 1, initial: 0.65, start, duration, initialZ: 1 }),
      );
    });
    return animation;
  }, []);

  const currentTimeDuration = `${String(Math.floor(duration / 60)).padStart(2, "0")}:${String(Math.floor(duration % 60)).padStart(2, "0")}`;
  const totalDuration = `${String(Math.floor(durationInFrames / fps / 60)).padStart(2, "0")}:${String(Math.floor((durationInFrames / fps) % 60)).padStart(2, "0")}`;

  if (!audioData) return null;
  const visualization = normalizeAudioData({
    audioData,
    fps,
    frame,
  });
  return (
    <>
      <Audio src={music} />
      <AbsoluteFill
        style={{
          backgroundColor: "#111",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {/* Background Media */}
        <AbsoluteFill style={{ opacity: 0.5 }}>
          {typeof props.background === "string" ? (
            <Img
              src={
                process.env.REMOTION_USE_LOCAL_DIR === "yes"
                  ? getStaticFiles().find((a) =>
                      a.name.startsWith("background"),
                    )!.src
                  : props.background
              }
              style={{ objectFit: "cover", width: "100%", height: "100%" }}
            />
          ) : (
            <LoopableOffthreadVideo
              muted
              loop
              src={
                process.env.REMOTION_USE_LOCAL_DIR === "yes"
                  ? getStaticFiles().find((a) =>
                      a.name.startsWith("background"),
                    )!.src
                  : props.background.video
              }
              style={{ objectFit: "cover", width: "100%", height: "100%" }}
            />
          )}
        </AbsoluteFill>

        {/* Modern Overlay: Glassmorphism + Vignette */}
        <AbsoluteFill
          style={{
            backdropFilter: "blur(3px)",
            background:
              "radial-gradient(ellipse at center, rgba(0,0,0,0) 0%, rgba(0,0,0,0.5) 100%)",
          }}
        />

        <div style={{ zIndex: 999, position: "absolute", top: 50, left: 50 }}>
          <Animated
            animations={[
              Move({ y: 0, initialY: -250, duration: fps * 3 }),
              Move({ y: -250, start: fps * 10, duration: fps * 2 }),
              // Scale({ by: 0.5, start: fps * 7, duration: fps * 2 }),
            ]}
          >
            <Animated
              absolute
              out={fps * 12}
              animations={[
                Rotate({ degrees: 360, duration: fps * 6, ease: Ease.Linear }),
              ]}
            >
              <Img
                src={
                  process.env.REMOTION_USE_LOCAL_DIR === "yes"
                    ? getStaticFiles().find((a) =>
                        a.name.startsWith("ytThumb"),
                      )!.src
                    : `https://sebelasempat.hitam.id/api/ytm/thumbnail?url=${encodeURIComponent(props.ytmThumbnail)}`
                }
                style={{
                  width: 140,
                  height: 140,
                  borderRadius: 100,
                  border: "5px solid white",
                }}
              />
            </Animated>
            <div
              style={{
                left: 180,
                top: 140 / 2,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <Animated
                out={fps * 11}
                animations={[
                  Move({ x: -(ytmMusicInfoWidth + 100), duration: 1 }),
                  Move({
                    x: ytmMusicInfoWidth + 100,
                    duration: fps * 3,
                    start: fps * 2,
                  }),
                  Move({
                    x: -(ytmMusicInfoWidth + 100),
                    duration: fps * 3,
                    start: fps * 7,
                  }),
                ]}
              >
                <div
                  ref={ytmMusicInfoRef}
                  style={{
                    color: "#ffffffc7",
                    fontSize: 30,
                    textAlign: "center",
                    fontFamily: universalFontFamily,
                    fontWeight: "bold",
                  }}
                >
                  {props.ytmMusicInfo}
                </div>
              </Animated>
            </div>
          </Animated>
          <Animated
            in={fps * 15}
            animations={[
              Move({
                y: 0,
                initialY: -100,
                start: fps * 15,
                duration: fps * 3,
              }),
            ]}
          >
            <div
              style={{
                color: "#ffffffc7",
                fontSize: 30,
                textAlign: "center",
                fontFamily: universalFontFamily,
                fontWeight: "bold",
              }}
            >
              {props.ytmMusicInfo}
            </div>
          </Animated>
        </div>
        <div
          style={{
            fontSize: 28,
            fontWeight: "bold",
            textAlign: "center",
            opacity: 0.7,
            color: "white",
            fontFamily: universalFontFamily,
          }}
        >
          {previousLyrics}
        </div>
        <Animated animations={currentLyricsAnimation} style={{ zIndex: 999 }}>
          <div
            style={{
              fontSize: 70,
              textAlign: "center",
              fontFamily: universalFontFamily,
              fontWeight: "bold",
              color: "white",
              filter:
                "drop-shadow(0 0 5px #00b7ff) drop-shadow(0 0 15px #00b7ff)",
              marginRight: 40,
              marginLeft: 40,
              zIndex: 999,
            }}
          >
            {currentLyrics}
          </div>
        </Animated>
        <div
          style={{
            fontSize: 35,
            fontWeight: "bold",
            textAlign: "center",
            opacity: 0.7,
            color: "white",
            fontFamily: universalFontFamily,
          }}
        >
          {nextLyrics}
        </div>

        <Animated
          absolute
          animations={currentTranslateLyricsAnimation}
          style={{
            fontSize: 45,
            fontWeight: "normal",
            fontStyle: "italic",
            textShadow:
              "0 0 2px #ff7300, 0 0 5px #ff7300, 0 0 7px #ff7300, 0 0 10px #ff7300, 0 0 12px #ff7300",
            color: "white",
            position: "absolute",
            bottom: 200,
            zIndex: 999,
            textAlign: "center",
            fontFamily: universalFontFamily,
          }}
        >
          {translateCurrentLyrics}
        </Animated>

        <div
          style={{
            height: 100,
            alignItems: "flex-end",
            display: "flex",
            flexDirection: "row",
            gap: 2,
            position: "absolute",
            bottom: 35,
          }}
        >
          {visualization.map((a, i) => {
            const height = interpolate(a, [0, 1], [5, 75], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });

            const hue = interpolate(a, [0, 1], [180, 220], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const color = `hsl(${hue}, 80%, 60%)`;

            return (
              <div
                key={i}
                style={{
                  height: `${height}px`,
                  width: 2,
                  background: `linear-gradient(to top, ${color}, rgba(255, 255, 255, 0.8))`,
                  borderRadius: "4px",
                  boxShadow: `0 0 8px rgba(${hue}, 150, 255, 0.6)`,
                }}
              />
            );
          })}
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 12,
            width: "70%",
            maxWidth: 1000,
            display: "flex",
            alignItems: "center",
            gap: 15,
          }}
        >
          <div
            style={{
              fontSize: 30,
              fontWeight: "bold",
              opacity: 0.8,
              color: "white",
            }}
          >
            {currentTimeDuration}
          </div>
          <div
            style={{
              flex: 1,
              height: 8,
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              borderRadius: 4,
              position: "relative",
              boxShadow: "inset 0 1px 3px rgba(0,0,0,0.2)",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${(frame / durationInFrames) * 100}%`,
                backgroundColor: "#00b7ff",
                borderRadius: 4,
                position: "absolute",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: `${(frame / durationInFrames) * 100}%`,
                top: "50%",
                transform: "translate(-50%, -50%)",
                height: 20,
                width: 20,
                borderRadius: "50%",
                backgroundColor: "white",
                boxShadow: "0 0 10px #00b7ff",
              }}
            />
          </div>
          <div
            style={{
              fontSize: 30,
              fontWeight: "bold",
              opacity: 0.8,
              color: "white",
            }}
          >
            {totalDuration}
          </div>
        </div>
      </AbsoluteFill>
    </>
  );
}
