import { useAudioData } from "@remotion/media-utils";
import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import {
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
  Ease,
  Move,
  Rotate,
  Scale,
} from "remotion-animated";
import normalizeAudioData from "./normalizeAudioData";

import { loadFont as loadFontNoto } from "@remotion/google-fonts/NotoSans";
import { loadFont as loadFontAR } from "@remotion/google-fonts/NotoSansArabic";
import { loadFont as loadFontJP } from "@remotion/google-fonts/NotoSansJP";
import { loadFont as loadFontKR } from "@remotion/google-fonts/NotoSansKR";
import { loadFont as loadFontSC } from "@remotion/google-fonts/NotoSansSC";
const { fontFamily: fontBase } = loadFontNoto("normal", { weights: ["400", "700"], ignoreTooManyRequestsWarning: true });
const { fontFamily: fontJP } = loadFontJP("normal", { weights: ["400", "700"], ignoreTooManyRequestsWarning: true });
const { fontFamily: fontKR } = loadFontKR("normal", { weights: ["400", "700"], ignoreTooManyRequestsWarning: true });
const { fontFamily: fontSC } = loadFontSC("normal", { weights: ["400", "700"], ignoreTooManyRequestsWarning: true });
const { fontFamily: fontArabic } = loadFontAR("normal", { weights: ["400", "700"], ignoreTooManyRequestsWarning: true });
const universalFontFamily = `${fontBase}, ${fontJP}, ${fontKR}, ${fontSC}, ${fontArabic}, sans-serif`;

export const TrackRenderer: React.FC<{
  track: any;
  trackIndex: number;
  isPortrait?: boolean;
}> = ({ track, trackIndex, isPortrait = false }) => {
  const music = staticFile(`music_${trackIndex}.mp3`);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const duration = frame / fps;

  let currentIndex = -1;
  for (let i = track.syncronizeLyrics.length - 1; i >= 0; i--) {
    if (duration >= track.syncronizeLyrics[i].start) {
      currentIndex = i;
      break;
    }
  }

  let currentLyrics = currentIndex >= 0 ? track.syncronizeLyrics[currentIndex].text : "♫";
  currentLyrics = currentLyrics.trim() === "" ? "♫" : currentLyrics;
  const previousLyrics = currentIndex > 0 ? track.syncronizeLyrics[currentIndex - 1].text : "";
  const nextLyrics = currentIndex >= 0 && currentIndex < track.syncronizeLyrics.length - 1 ? track.syncronizeLyrics[currentIndex + 1].text : "";

  let currentTranslateIndex = -1;
  if (track.translateSyncronizeLyrics) {
    for (let i = track.translateSyncronizeLyrics.length - 1; i >= 0; i--) {
      if (duration >= track.translateSyncronizeLyrics[i].start) {
        currentTranslateIndex = i;
        break;
      }
    }
  }
  const translateCurrentLyrics = currentTranslateIndex >= 0 ? track.translateSyncronizeLyrics[currentTranslateIndex].text : "";

  const thumbSrc = useMemo(() => {
    const files = getStaticFiles();
    return (
      files.find(
        (a) => a.name === `ytThumb_${trackIndex}.${track.ytmThumbnailExt}`
      )?.src ||
      files.find((a) => a.name.startsWith(`ytThumb_${trackIndex}`))?.src ||
      ""
    );
  }, [trackIndex, track.ytmThumbnailExt]);

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
    if (currentIndex < 0) return [];
    const start = track.syncronizeLyrics[currentIndex].start * fps;
    const duration = fps / 2;
    return [
      Move({ y: 0, initialY: isPortrait ? 60 : 50, start, duration }),
      Scale({ by: 1, initial: 0.85, start, duration, initialZ: 1 }),
    ];
  }, [currentIndex, isPortrait, track.syncronizeLyrics, fps]);

  const currentTranslateLyricsAnimation = useMemo(() => {
    if (currentTranslateIndex < 0) return [];
    const start = track.translateSyncronizeLyrics[currentTranslateIndex].start * fps;
    const duration = fps / 2;
    return [
      Scale({ by: 1, initial: 0.65, start, duration, initialZ: 1 }),
    ];
  }, [currentTranslateIndex, track.translateSyncronizeLyrics, fps]);

  if (!audioData) return null;
  const visualization = normalizeAudioData({
    audioData,
    fps,
    frame,
  });

  return (
    <>
      <Audio src={music} />
      
      {/* Thumbnail and Title */}
      {isPortrait ? (
        <div
          style={{
            position: "absolute",
            top: 320,
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
              src={thumbSrc}
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
              fontFamily: universalFontFamily,
              opacity: 0.9,
              width: "80%",
              lineHeight: 1.3,
            }}
          >
            {track.ytmMusicInfo}
          </div>
        </div>
      ) : (
        <div style={{ zIndex: 999, position: "absolute", top: 50, left: 50 }}>
          <Animated
            animations={[
              Move({ y: 0, initialY: -250, duration: fps * 3 }),
              Move({ y: -250, start: fps * 10, duration: fps * 2 }),
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
                src={thumbSrc}
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
                  {track.ytmMusicInfo}
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
              {track.ytmMusicInfo}
            </div>
          </Animated>
        </div>
      )}

      {/* Lyrics */}
      <div
        style={
          isPortrait
            ? {
                position: "absolute",
                bottom: 800,
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "30px",
                textAlign: "center",
                zIndex: 1,
              }
            : {
                position: "absolute",
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                gap: "20px",
                zIndex: 1,
              }
        }
      >
        <div
          style={{
            fontSize: isPortrait ? 30 : 28,
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
              fontSize: isPortrait ? 45 : 70,
              textAlign: "center",
              fontFamily: universalFontFamily,
              fontWeight: "bold",
              color: "#00d4ff",
              padding: "0 40px",
              zIndex: 999,
            }}
          >
            {currentLyrics}
          </div>
        </Animated>
        <div
          style={{
            fontSize: isPortrait ? 30 : 35,
            fontWeight: "bold",
            textAlign: "center",
            opacity: 0.7,
            color: "white",
            fontFamily: universalFontFamily,
          }}
        >
          {nextLyrics}
        </div>
      </div>

      {/* Translation */}
      <Animated
        absolute
        animations={currentTranslateLyricsAnimation}
        style={{
          fontSize: 45,
          fontWeight: "normal",
          fontStyle: "italic",
          color: "#ffaa44",
          position: "absolute",
          bottom: isPortrait ? 600 : 200,
          width: "100%",
          zIndex: 999,
          textAlign: "center",
          fontFamily: universalFontFamily,
        }}
      >
        {translateCurrentLyrics}
      </Animated>

      {/* Visualizer */}
      <div
        style={{
          height: 100,
          alignItems: "flex-end",
          justifyContent: "center",
          display: "flex",
          flexDirection: "row",
          gap: 2,
          position: "absolute",
          width: "100%",
          bottom: isPortrait ? 120 : 35,
        }}
      >
        {visualization.map((a, i) => {
          const height = interpolate(a, [0, 1], [5, 65], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const hue = interpolate(a, [0, 1], [180, 220], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          return (
            <div
              key={i}
              style={{
                height: `${height}px`,
                width: isPortrait ? 3 : 2,
                backgroundColor: `hsl(${hue}, 80%, 60%)`,
                borderRadius: "4px",
              }}
            />
          );
        })}
      </div>
    </>
  );
};
