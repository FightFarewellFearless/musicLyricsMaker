import { z } from "zod";
import { defaultThumbnailSchema } from "./Root";
import { AbsoluteFill, Img } from "remotion";

export default function ThumbnailCreator(props: z.infer<typeof defaultThumbnailSchema>) {
    return (
        <AbsoluteFill>
            {/* Background Layer */}
            <AbsoluteFill>
                <Img src={props.background} style={{ 
                    objectFit: 'cover', 
                    width: '100%', 
                    height: '100%',
                    filter: 'blur(2px) saturate(120%)'
                }} />
                <div style={{ 
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    background: `linear-gradient(45deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 100%)`
                }} />
            </AbsoluteFill>

            {/* Decorative Elements */}
            <div style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                background: `repeating-linear-gradient(
                    45deg,
                    rgba(255,255,255,0.05) 0px,
                    rgba(255,255,255,0.05) 2px,
                    transparent 2px,
                    transparent 4px
                )`
            }} />

            {/* Content Container */}
            <div style={{ 
                position: 'absolute',
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4rem',
                textShadow: '0 4px 12px rgba(0,0,0,0.4)'
            }}>
                {/* Music Icon */}
                <div style={{ 
                    fontSize: 80,
                    color: 'rgba(255,255,255,0.8)',
                    marginBottom: '2rem',
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                }}>
                    🎵
                </div>

                {/* Title Container */}
                <div style={{
                    background: `linear-gradient(90deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(255,255,255,0.1) 100%)`,
                    padding: '2rem',
                    borderRadius: '8px',
                    position: 'relative',
                    maxWidth: '90%'
                }}>
                    <h1 style={{ 
                        color: 'white',
                        fontSize: '6.5rem',
                        fontWeight: 700,
                        textAlign: 'center',
                        margin: 0,
                        lineHeight: 1.2,
                        letterSpacing: '-0.05em',
                        fontFamily: 'Inter, sans-serif',
                    }}>
                        {props.musicTitle}
                    </h1>
                </div>

                {/* Decorative Border */}
                <div style={{
                    position: 'absolute',
                    bottom: '4rem',
                    height: '4px',
                    width: '60%',
                    background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)`
                }} />
            </div>
        </AbsoluteFill>
    )
};