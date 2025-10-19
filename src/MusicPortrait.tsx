import {
  AbsoluteFill,
  Audio,
  getStaticFiles,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useCurrentScale,
  useVideoConfig,
} from "remotion";
import { DefaultSchema } from "./Root";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useAudioData, visualizeAudio } from "@remotion/media-utils";
import {
  Animated,
  Animation,
  Move,
  Scale,
  Rotate,
  Ease,
} from "remotion-animated";
import { z } from "zod";
import { LoopableOffthreadVideo } from "./LoopableOffthreadVideo";
import { loadFont } from "@remotion/google-fonts/NotoSansJP";
const { fontFamily: fontFamilyJP } = loadFont();

export default function MusicPortrait(props: z.infer<typeof DefaultSchema>) {
  const music =
    process.env.REMOTION_USE_LOCAL_DIR === "yes"
      ? staticFile("music.mp3")
      : `https://sebelasempat.hitam.id/api/ytMusic/${encodeURIComponent(
          props.musicTitle,
        )}`;
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const duration = frame / fps;

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
        Move({ y: 0, initialY: 60, start, duration }),
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
      animation.push(Scale({ by: 1, initial: 0.65, start, duration }));
    });
    return animation;
  }, []);

  const currentTimeDuration = `${String(Math.floor(duration / 60)).padStart(
    2,
    "0",
  )}:${String(Math.floor(duration % 60)).padStart(2, "0")}`;
  const totalDuration = `${String(
    Math.floor(durationInFrames / fps / 60),
  ).padStart(2, "0")}:${String(
    Math.floor((durationInFrames / fps) % 60),
  ).padStart(2, "0")}`;

  if (!audioData) return null;
  const frequencyDataNext = visualizeAudio({
    fps,
    frame: frame + 1,
    audioData,
    numberOfSamples: 64,
    optimizeFor: "accuracy",
    smoothing: true,
  });
  const frequencyDataNextTwo = visualizeAudio({
    fps,
    frame: frame + 2,
    audioData,
    numberOfSamples: 64,
    optimizeFor: "accuracy",
    smoothing: true,
  });
  const frequencyData = visualizeAudio({
    fps,
    frame,
    audioData,
    numberOfSamples: 64,
    optimizeFor: "accuracy",
    smoothing: true,
  });
  const minDb = -50;
  const maxDb = -5;
  const clampNumberBetween0and1 = (num: number) =>
    Math.min(Math.max(num, 0), 1);
  const visualization = frequencyData.map((value, index) => {
    function dbToHeight(val: number) {
      const db = 20 * Math.log10(val);
      const scaled = (db - minDb) / (maxDb - minDb);

      return Math.pow(clampNumberBetween0and1(scaled), 0.85);
    }
    const height = dbToHeight(value);
    const heightNext = dbToHeight(frequencyDataNext[index]);
    const heightNextTwo = dbToHeight(frequencyDataNextTwo[index]);
    const smoothHeight = (height + heightNext + heightNextTwo) / 3;
    return smoothHeight;
  });

  return (
    <>
      <Audio src={music} />
      <AbsoluteFill
        style={{
          backgroundColor: "#111",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
        }}
      >
        {/* Background (portrait fit) */}
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
              style={{
                objectFit: "cover",
                width: "100%",
                height: "100%",
              }}
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
              style={{
                objectFit: "cover",
                width: "100%",
                height: "100%",
              }}
            />
          )}
        </AbsoluteFill>

        {/* Overlay (soft vignette) */}
        <AbsoluteFill
          style={{
            backdropFilter: "blur(3px)",
            background:
              "radial-gradient(ellipse at center, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.7) 100%)",
          }}
        />

        {/* Thumbnail & title */}
        <div
          style={{
            position: "absolute",
            top: 100,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: 20,
          }}
        >
          <Animated
            animations={[
              Rotate({ degrees: 360, duration: fps * 6, ease: Ease.Linear }),
            ]}
          >
            <Img
              src={
                process.env.REMOTION_USE_LOCAL_DIR === "yes"
                  ? getStaticFiles().find((a) => a.name.startsWith("ytThumb"))!
                      .src
                  : `https://sebelasempat.hitam.id/api/ytm/thumbnail?url=${encodeURIComponent(
                      props.ytmThumbnail,
                    )}`
              }
              style={{
                width: 180,
                height: 180,
                borderRadius: "50%",
                border: "6px solid white",
              }}
            />
          </Animated>
          <div
            ref={ytmMusicInfoRef}
            style={{
              color: "white",
              fontSize: 36,
              fontWeight: "bold",
              fontFamily: fontFamilyJP,
              opacity: 0.9,
              width: "80%",
              lineHeight: 1.3,
            }}
          >
            {props.ytmMusicInfo}
          </div>
        </div>

        {/* Lyrics Section */}
        <div
          style={{
            bottom: 420,
            width: "100%",
            textAlign: "center",
            zIndex: 1,
          }}
        >
          <div
            style={{
              fontSize: 30,
              color: "#ffffffaa",
              marginBottom: 10,
              fontFamily: fontFamilyJP,
            }}
          >
            {previousLyrics}
          </div>

          <Animated animations={currentLyricsAnimation}>
            <div
              style={{
                fontSize: 60,
                color: "white",
                fontWeight: "bold",
                fontFamily: fontFamilyJP,
                filter:
                  "drop-shadow(0 0 5px #00b7ff) drop-shadow(0 0 15px #00b7ff)",
                marginLeft: 40,
                marginRight: 40,
              }}
            >
              {currentLyrics}
            </div>
          </Animated>

          <div
            style={{
              fontSize: 35,
              color: "#ffffffaa",
              marginTop: 10,
              fontFamily: fontFamilyJP,
            }}
          >
            {nextLyrics}
          </div>
        </div>

        {/* Translation */}
        <Animated
          animations={currentTranslateLyricsAnimation}
          style={{
            position: "absolute",
            bottom: 300,
            width: "100%",
            textAlign: "center",
            fontSize: 45,
            fontStyle: "italic",
            textShadow: "0 0 3px #ff7300, 0 0 6px #ff7300, 0 0 10px #ff7300",
            color: "white",
            fontFamily: fontFamilyJP,
          }}
        >
          {translateCurrentLyrics}
        </Animated>

        {/* Audio Visualizer */}
        <div
          style={{
            position: "absolute",
            bottom: 120,
            width: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-end",
            gap: 2,
            height: 100,
          }}
        >
          {visualization.map((a, i) => {
            const height = interpolate(a, [0, 1], [5, 85], {
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
                  width: 3,
                  background: `linear-gradient(to top, ${color}, rgba(255, 255, 255, 0.8))`,
                  borderRadius: "4px",
                  boxShadow: `0 0 8px rgba(${hue}, 150, 255, 0.6)`,
                  transform: `scaleY(${interpolate(a, [0, 1], [1, 1.1])})`,
                  opacity: interpolate(a, [0, 1], [0.8, 1]),
                }}
              />
            );
          })}
        </div>

        {/* Progress Bar */}
        <div
          style={{
            position: "absolute",
            bottom: 60,
            width: "80%",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              fontSize: 28,
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
              backgroundColor: "rgba(255,255,255,0.2)",
              borderRadius: 4,
              position: "relative",
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
          </div>
          <div
            style={{
              fontSize: 28,
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
