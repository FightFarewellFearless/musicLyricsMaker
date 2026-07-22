import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Animated, Ease, Fade, Move, Scale } from "remotion-animated";

export const TrackList: React.FC<{
  tracksData: any[];
  isPortrait?: boolean;
}> = ({ tracksData, isPortrait = false }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  if (!tracksData || tracksData.length === 0) return null;

  // Find the currently playing track
  let currentIndex = tracksData.findIndex(
    (t) => frame >= t.startFrame && frame < t.startFrame + t.durationInFrames,
  );
  if (currentIndex === -1) {
    if (frame >= tracksData[tracksData.length - 1].startFrame) {
      currentIndex = tracksData.length - 1;
    } else {
      currentIndex = 0;
    }
  }

  // Helper to format time as HH:MM:SS or MM:SS
  const formatTime = (totalSeconds: number, forceHours: boolean = false) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);

    if (h > 0 || forceHours) {
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const totalSeconds = durationInFrames / fps;
  const currentSeconds = frame / fps;
  const showHours = totalSeconds >= 3600;

  // Calculate overall progress
  const currentTimeDuration = formatTime(currentSeconds, showHours);
  const totalDuration = formatTime(totalSeconds, showHours);

  const transDuration = Math.max(1, Math.round(fps * 0.4));

  return (
    <>
      {/* Track List Overlay */}
      <div
        style={{
          position: "absolute",
          top: isPortrait ? 50 : 50,
          right: isPortrait ? "50%" : 50,
          transform: isPortrait ? "translateX(50%)" : "none",
          width: isPortrait ? "90%" : 550,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          zIndex: 1000,
          alignItems: isPortrait ? "center" : "flex-end",
        }}
      >
        {tracksData.map((track, i) => {
          const diff = i - currentIndex;

          // Only show 1 previous and 2 next tracks to prevent clutter
          if (diff < -1 || diff > 2) return null;

          const startFrame = track.startFrame;
          const nextTrackStart = tracksData[i + 1]?.startFrame;
          const prevTrackStart = tracksData[i - 1]?.startFrame;
          const next2TrackStart = tracksData[i + 2]?.startFrame;

          // Build remotion-animated animations array for track item `i`
          const trackAnimations = [];

          if (i === 0) {
            // Track 0 starts active
            trackAnimations.push(
              Scale({ start: 0, duration: 1, initial: 1.0, by: 1.0 }),
              Fade({ start: 0, duration: 1, initial: 1.0, to: 1.0 }),
            );
            if (nextTrackStart !== undefined) {
              trackAnimations.push(
                Scale({
                  start: nextTrackStart,
                  duration: transDuration,
                  initial: 1.0,
                  by: 0.9,
                  ease: Ease.QuadraticOut,
                }),
                Fade({
                  start: nextTrackStart,
                  duration: transDuration,
                  initial: 1.0,
                  to: 0.5,
                  ease: Ease.QuadraticOut,
                }),
              );
            }
            if (next2TrackStart !== undefined) {
              trackAnimations.push(
                Fade({
                  start: next2TrackStart,
                  duration: transDuration,
                  initial: 0.5,
                  to: 0.0,
                  ease: Ease.QuadraticOut,
                }),
              );
            }
          } else {
            // Track i > 0 starts as upcoming
            trackAnimations.push(
              Scale({ start: 0, duration: 1, initial: 0.9, by: 0.9 }),
              Fade({ start: 0, duration: 1, initial: 0.2, to: 0.5 }),
            );
            if (prevTrackStart !== undefined) {
              trackAnimations.push(
                Fade({
                  start: prevTrackStart,
                  duration: transDuration,
                  initial: 0.2,
                  to: 0.5,
                  ease: Ease.QuadraticOut,
                }),
              );
            }
            trackAnimations.push(
              Scale({
                start: startFrame,
                duration: transDuration,
                initial: 0.9,
                by: 1.111111,
                ease: Ease.QuadraticOut,
              }),
              Fade({
                start: startFrame,
                duration: transDuration,
                initial: 0.5,
                to: 1.0,
                ease: Ease.QuadraticOut,
              }),
              Move({
                start: startFrame,
                duration: transDuration,
                initialY: 8,
                y: 0,
                ease: Ease.QuadraticOut,
              }),
            );
            if (nextTrackStart !== undefined) {
              trackAnimations.push(
                Scale({
                  start: nextTrackStart,
                  duration: transDuration,
                  initial: 1.0,
                  by: 0.9,
                  ease: Ease.QuadraticOut,
                }),
                Fade({
                  start: nextTrackStart,
                  duration: transDuration,
                  initial: 1.0,
                  to: 0.5,
                  ease: Ease.QuadraticOut,
                }),
              );
            }
            if (next2TrackStart !== undefined) {
              trackAnimations.push(
                Fade({
                  start: next2TrackStart,
                  duration: transDuration,
                  initial: 0.5,
                  to: 0.0,
                  ease: Ease.QuadraticOut,
                }),
              );
            }
          }

          // Calculate continuous activeProgress (0 to 1) for visual styling
          let activeProgress = 0;
          if (i === 0) {
            if (nextTrackStart !== undefined && frame >= nextTrackStart) {
              activeProgress = interpolate(
                frame,
                [nextTrackStart, nextTrackStart + transDuration],
                [1, 0],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
              );
            } else {
              activeProgress = 1;
            }
          } else {
            if (nextTrackStart !== undefined && frame >= nextTrackStart) {
              activeProgress = interpolate(
                frame,
                [nextTrackStart, nextTrackStart + transDuration],
                [1, 0],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
              );
            } else if (frame >= startFrame) {
              activeProgress = interpolate(
                frame,
                [startFrame, startFrame + transDuration],
                [0, 1],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
              );
            } else {
              activeProgress = 0;
            }
          }

          // Dynamic colors based on activeProgress
          const bgR = Math.round(interpolate(activeProgress, [0, 1], [0, 255]));
          const bgG = Math.round(interpolate(activeProgress, [0, 1], [0, 255]));
          const bgB = Math.round(interpolate(activeProgress, [0, 1], [0, 255]));
          const bgA = interpolate(activeProgress, [0, 1], [0.3, 0.15]);
          const background = `rgba(${bgR}, ${bgG}, ${bgB}, ${bgA.toFixed(2)})`;

          const borderAlpha = interpolate(activeProgress, [0, 1], [0.05, 0.4]);
          const border = `1px solid rgba(255, 255, 255, ${borderAlpha.toFixed(2)})`;

          const shadowAlpha = interpolate(activeProgress, [0, 1], [0, 0.2]);
          const boxShadow =
            shadowAlpha > 0.01
              ? `0 8px 32px rgba(0, 183, 255, ${shadowAlpha.toFixed(2)})`
              : "none";

          const tsR = Math.round(interpolate(activeProgress, [0, 1], [255, 0]));
          const tsG = Math.round(interpolate(activeProgress, [0, 1], [255, 183]));
          const tsB = Math.round(interpolate(activeProgress, [0, 1], [255, 255]));
          const tsA = interpolate(activeProgress, [0, 1], [0.6, 1.0]);
          const timestampColor = `rgba(${tsR}, ${tsG}, ${tsB}, ${tsA.toFixed(2)})`;

          const startSeconds = track.startFrame / fps;
          const timestamp = `[${formatTime(startSeconds, showHours)}]`;

          return (
            <Animated
              key={i}
              animations={trackAnimations}
              style={{ width: "100%", maxWidth: 550 }}
            >
              <div
                style={{
                  background,
                  backdropFilter: "blur(12px)",
                  border,
                  borderRadius: 20,
                  padding: "16px 24px",
                  color: "white",
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 20,
                  boxShadow,
                  width: "100%",
                }}
              >
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: "bold",
                    color: timestampColor,
                    fontFamily: "monospace",
                  }}
                >
                  {timestamp}
                </div>
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: activeProgress > 0.5 ? "bold" : "normal",
                    fontFamily: "sans-serif",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    flex: 1,
                    textAlign: "left",
                  }}
                >
                  {track.musicTitle}
                </div>
                {activeProgress > 0.01 && (
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      backgroundColor: "#00b7ff",
                      borderRadius: "50%",
                      boxShadow: `0 0 ${Math.round(10 * activeProgress)}px #00b7ff`,
                      opacity: activeProgress,
                      transform: `scale(${activeProgress})`,
                    }}
                  />
                )}
              </div>
            </Animated>
          );
        })}
      </div>

      {/* Global Progress Bar */}
      <div
        style={{
          position: "absolute",
          bottom: isPortrait ? 60 : 12,
          width: isPortrait ? "80%" : "70%",
          maxWidth: 1000,
          display: "flex",
          alignItems: "center",
          gap: 15,
          zIndex: 1000,
          left: "50%",
          transform: "translateX(-50%)",
        }}
      >
        <div
          style={{
            fontSize: isPortrait ? 28 : 30,
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
            fontSize: isPortrait ? 28 : 30,
            fontWeight: "bold",
            opacity: 0.8,
            color: "white",
          }}
        >
          {totalDuration}
        </div>
      </div>
    </>
  );
};

