import { z } from "zod";
import { AbsoluteFill, getStaticFiles, Img, Sequence } from "remotion";
import { DefaultSchema } from "./Root";
import { Video } from "@remotion/media";
import { TrackRenderer } from "./TrackRenderer";
import { TrackList } from "./TrackList";

export default function Music(props: z.infer<typeof DefaultSchema>) {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#111",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Global Background Media */}
      <AbsoluteFill style={{ opacity: 0.5 }}>
        {typeof props.background === "string" ? (
          <Img
            src={
              getStaticFiles().find((a) => a.name.startsWith("background"))
                ?.src || ""
            }
            style={{ objectFit: "cover", width: "100%", height: "100%" }}
          />
        ) : (
          <Video
            muted
            loop
            src={
              getStaticFiles().find((a) => a.name.startsWith("background"))
                ?.src || ""
            }
            style={{ objectFit: "cover", width: "100%", height: "100%" }}
          />
        )}
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          backdropFilter: "blur(3px)",
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0) 0%, rgba(0,0,0,0.5) 100%)",
        }}
      />
      {/* Track List Overlay */}
      {props.tracksData && <TrackList tracksData={props.tracksData} />}
      {/* Render each track sequentially */}
      {props.tracksData?.map((track: any, i: number) => (
        <Sequence
          key={i}
          from={track.startFrame}
          durationInFrames={track.durationInFrames}
        >
          <TrackRenderer track={track} trackIndex={i} isPortrait={false} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}
