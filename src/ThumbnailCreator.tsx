import { z } from "zod";
import { defaultThumbnailSchema } from "./Root";
import { AbsoluteFill, getStaticFiles, Img, Video } from "remotion";
import { LoopableOffthreadVideo } from "./LoopableOffthreadVideo";
import {loadFont} from "@remotion/google-fonts/NotoSansJP";
const {fontFamily: fontFamilyJP} = loadFont();

export default function ThumbnailCreator(props: z.infer<typeof defaultThumbnailSchema>) {
  return (
    <AbsoluteFill>
      {/* Background Layer */}
      <AbsoluteFill>
        {
          typeof props.background === 'string' ? (
            <Img src={process.env.REMOTION_USE_LOCAL_DIR === 'yes' ? getStaticFiles().find(a => a.name.startsWith('background'))!.src : props.background} style={{
              objectFit: 'cover',
              width: '100%',
              height: '100%',
              filter: 'blur(3px) saturate(180%)'
            }} />) : (
            <LoopableOffthreadVideo src={process.env.REMOTION_USE_LOCAL_DIR === 'yes' ? getStaticFiles().find(a => a.name.startsWith('background'))!.src : props.background.video} style={{
              objectFit: 'cover',
              width: '100%',
              height: '100%',
              filter: 'blur(3px) saturate(180%)'
            }} muted />
          )
        }
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: `linear-gradient(135deg, rgba(0, 0, 0, 0.514) 0%, rgba(0,0,0,0.6) 100%)`
        }} />
      </AbsoluteFill>

      {/* Content Container */}
      <div style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textShadow: '0 4px 12px rgba(0,0,0,0.7)'
      }}>
        {/* Music Icon */}
        <div style={{
          fontSize: 100,
          color: 'rgba(255,255,255,0.95)',
          marginBottom: '1.5rem',
          filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.5))'
        }}>
          🎶
        </div>

        {/* Title Container */}
        <div style={{
          background: `linear-gradient(90deg, rgba(255,255,255,0.3) 0%, transparent 50%, rgba(255,255,255,0.3) 100%)`,
          padding: '1.5rem 3rem',
          borderRadius: '16px',
          position: 'relative',
          maxWidth: '80%'
        }}>
          <h1 style={{
            color: 'white',
            fontSize: '5rem',
            fontWeight: 900,
            textAlign: 'center',
            margin: 0,
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            fontFamily: 'Poppins, sans-serif, ' + fontFamilyJP,
          }}>
            {props.musicTitle}
          </h1>
        </div>

        {/* Lyrics Video Text */}
        <div style={{
          marginTop: '1rem',
          color: 'rgba(255,255,255,0.8)',
          fontSize: '3rem',
          textAlign: 'center',
          fontFamily: 'Poppins, sans-serif, ' + fontFamilyJP,
        }}>
          Lyrics Video
        </div>

        {/* Decorative Border */}
        <div style={{
          position: 'absolute',
          bottom: '2rem',
          height: '4px',
          width: '70%',
          background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)`
        }} />
      </div>
    </AbsoluteFill>
  )
};