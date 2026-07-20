import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

export const TrackList: React.FC<{
  tracksData: any[];
  isPortrait?: boolean;
}> = ({ tracksData, isPortrait = false }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  if (!tracksData || tracksData.length === 0) return null;

  // Find the currently playing track
  let currentIndex = tracksData.findIndex(
    (t) => frame >= t.startFrame && frame < t.startFrame + t.durationInFrames
  );
  if (currentIndex === -1) {
    if (frame >= tracksData[tracksData.length - 1].startFrame) {
      currentIndex = tracksData.length - 1;
    } else {
      currentIndex = 0;
    }
  }

  // Calculate overall progress
  const currentTimeDuration = `${String(Math.floor(frame / fps / 60)).padStart(2, "0")}:${String(Math.floor((frame / fps) % 60)).padStart(2, "0")}`;
  const totalDuration = `${String(Math.floor(durationInFrames / fps / 60)).padStart(2, "0")}:${String(Math.floor((durationInFrames / fps) % 60)).padStart(2, "0")}`;

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
          const isCurrent = i === currentIndex;
          const diff = i - currentIndex;
          
          // Only show 1 previous and 2 next tracks to prevent clutter
          if (diff < -1 || diff > 2) return null;

          const opacity = isCurrent ? 1 : Math.max(0, 0.8 - Math.abs(diff) * 0.3);
          const scale = isCurrent ? 1 : 0.9;
          
          const startSeconds = track.startFrame / fps;
          const timestamp = `[${String(Math.floor(startSeconds / 60)).padStart(2, "0")}:${String(Math.floor(startSeconds % 60)).padStart(2, "0")}]`;

          return (
            <div
              key={i}
              style={{
                background: isCurrent ? "rgba(0, 183, 255, 0.18)" : "rgba(0,0,0,0.45)",
                border: isCurrent
                  ? "1px solid rgba(0, 183, 255, 0.5)"
                  : "1px solid rgba(255,255,255,0.08)",
                borderRadius: 20,
                padding: "16px 24px",
                color: "white",
                transform: `scale(${scale})`,
                opacity,
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: 20,
                width: "100%",
                maxWidth: 550,
              }}
            >
              <div
                style={{
                  fontSize: 18,
                  fontWeight: "bold",
                  color: isCurrent ? "#00b7ff" : "rgba(255,255,255,0.6)",
                  fontFamily: "monospace",
                }}
              >
                {timestamp}
              </div>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: isCurrent ? "bold" : "normal",
                  fontFamily: "sans-serif",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  flex: 1,
                  textAlign: "left"
                }}
              >
                {track.musicTitle}
              </div>
              {isCurrent && (
                <div
                  style={{
                    width: 10,
                    height: 10,
                    backgroundColor: "#00b7ff",
                    borderRadius: "50%",
                  }}
                />
              )}
            </div>
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
              backgroundColor: "#00b7ff",
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
