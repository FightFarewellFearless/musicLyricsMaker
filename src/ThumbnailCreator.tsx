import { loadFont } from "@remotion/google-fonts/Montserrat";
import { loadFont as loadPlayfair } from "@remotion/google-fonts/PlayfairDisplay";
import { AbsoluteFill, getStaticFiles, Img } from "remotion";
import { z } from "zod";
import { Video } from "@remotion/media";
import { defaultThumbnailSchema } from "./Root";

const { fontFamily } = loadFont("normal", { weights: ["700"] });
const { fontFamily: fontFamilySerif } = loadPlayfair("normal", { weights: ["400"] });

export default function ThumbnailCreator(
  props: z.infer<typeof defaultThumbnailSchema>,
) {
  const bgSrc = getStaticFiles().find((a) => a.name.startsWith("background"))?.src;

  const tracks = props.tracksData || [];
  
  // Calculate columns (split in half)
  const leftTracks = tracks.slice(0, Math.ceil(tracks.length / 2));
  const rightTracks = tracks.slice(Math.ceil(tracks.length / 2));

  // Helper to render track list
  const renderTrackList = (trackList: any[], startIndex: number, align: "left" | "right") => {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        width: "35%",
        padding: "40px",
        textAlign: align,
        zIndex: 10,
      }}>
        {trackList.map((track, i) => (
          <div key={i} style={{
            color: "white",
            fontSize: "28px",
            fontFamily: fontFamily,
            fontWeight: 700,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            textShadow: "2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 0px 4px 6px rgba(0,0,0,0.8)", // Hard black stroke and shadow
          }}>
            {String(startIndex + i + 1).padStart(2, "0")}. {track.musicTitle}
          </div>
        ))}
      </div>
    );
  };

  return (
    <AbsoluteFill style={{ backgroundColor: "#111" }}>
      {/* Background Layer */}
      <AbsoluteFill>
        {bgSrc && (
          typeof props.background === "string" ? (
            <Img
              src={bgSrc}
              style={{
                objectFit: "cover",
                width: "100%",
                height: "100%",
                filter: "brightness(0.65)", // No blur, just darken slightly for text readability
              }}
            />
          ) : (
            <Video
              src={bgSrc}
              style={{
                objectFit: "cover",
                width: "100%",
                height: "100%",
                filter: "brightness(0.65)",
              }}
              muted
            />
          )
        )}
      </AbsoluteFill>

      {/* Main Content (Columns) */}
      <AbsoluteFill style={{ display: "flex", flexDirection: "row", justifyContent: "space-between" }}>
        {/* Left Tracklist */}
        {renderTrackList(leftTracks, 0, "left")}

        {/* Center Title */}
        <div style={{
          position: "absolute",
          top: "55%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 20,
          border: "10px solid white",
          padding: "20px 80px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          boxShadow: "0px 10px 30px rgba(0,0,0,0.5)",
        }}>
          <h1 style={{
            color: "white",
            fontSize: "120px",
            margin: 0,
            fontFamily: fontFamilySerif,
            fontWeight: "normal",
            textShadow: "3px 3px 0 #000, -3px -3px 0 #000, 3px -3px 0 #000, -3px 3px 0 #000, 0px 8px 20px rgba(0,0,0,0.8)", // Black stroke + shadow
            textAlign: "center",
          }}>
            {props.musicTitle}
          </h1>
        </div>

        {/* Right Tracklist */}
        {renderTrackList(rightTracks, leftTracks.length, "right")}
      </AbsoluteFill>
      
      {/* Visualizer Graphic (Like the image) */}
      <div style={{
        position: "absolute",
        bottom: "120px",
        left: "0",
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 15,
      }}>
         {/* Fake Sound Wave Lines */}
         <svg width="100%" height="200" viewBox="0 0 1920 200" style={{ position: "absolute" }}>
           {/* Line 1 */}
           <path d="M0,100 L200,100 L250,50 L300,150 L350,20 L400,180 L450,80 L500,120 L550,100 L800,100 L850,30 L900,170 L950,100 L1100,100 L1150,40 L1200,160 L1250,70 L1300,130 L1350,100 L1600,100 L1650,20 L1700,180 L1750,50 L1800,150 L1850,100 L1920,100" 
                 fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="4" />
           {/* Line 2 (Offset) */}
           <path d="M0,100 L180,100 L230,70 L280,130 L330,40 L380,160 L430,90 L480,110 L530,100 L780,100 L830,50 L880,150 L930,100 L1080,100 L1130,60 L1180,140 L1230,80 L1280,120 L1330,100 L1580,100 L1630,40 L1680,160 L1730,70 L1780,130 L1830,100 L1920,100" 
                 fill="none" stroke="rgba(100,200,255,0.6)" strokeWidth="4" />
         </svg>
         
         {/* CD Graphic */}
         <div style={{
           position: "relative",
           width: "160px",
           height: "160px",
           borderRadius: "50%",
           backgroundColor: "#e0e5ec",
           border: "25px solid #fff",
           display: "flex",
           justifyContent: "center",
           alignItems: "center",
           boxShadow: "0 0 30px rgba(0,0,0,0.6)"
         }}>
            {/* CD inner hole */}
            <div style={{
              width: "40px",
              height: "40px",
              backgroundColor: "transparent",
              borderRadius: "50%",
              border: "15px solid #222"
            }}></div>
            {/* CD Shine */}
            <div style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              background: "conic-gradient(from 45deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.8) 25%, rgba(255,255,255,0) 50%, rgba(255,255,255,0.8) 75%, rgba(255,255,255,0) 100%)",
              mixBlendMode: "overlay"
            }}></div>
         </div>
      </div>
    </AbsoluteFill>
  );
}
