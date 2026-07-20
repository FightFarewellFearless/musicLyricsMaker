
import { z } from "zod";
import { AbsoluteFill, getStaticFiles, Img, Sequence } from "remotion";
import { DefaultSchema } from "./Root";
import { LoopableOffthreadVideo } from "./LoopableOffthreadVideo";
import { TrackRenderer } from "./TrackRenderer";
import { TrackList } from "./TrackList";

export default function MusicPortrait(props: z.infer<typeof DefaultSchema>) {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#111",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
      }}
    >
      {/* Global Background (portrait fit) */}
      <AbsoluteFill style={{ opacity: 0.5 }}>
        {typeof props.background === "string" ? (
          <Img
            src={getStaticFiles().find((a) => a.name.startsWith("background"))?.src || ""}
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
            src={getStaticFiles().find((a) => a.name.startsWith("background"))?.src || ""}
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

      {/* Track List Overlay */}
      {props.tracksData && <TrackList tracksData={props.tracksData} isPortrait={true} />}

      {/* Render each track sequentially */}
      {props.tracksData?.map((track: any, i: number) => (
        <Sequence
          key={i}
          from={track.startFrame}
          durationInFrames={track.durationInFrames}
        >
          <TrackRenderer track={track} trackIndex={i} isPortrait={true} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}
