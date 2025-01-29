import { AbsoluteFill, Audio, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { DefaultProps, DefaultSchema } from "./Root";
import { useEffect, useMemo, useRef } from "react";
import { useAudioData, visualizeAudio } from '@remotion/media-utils';
import { Animated, Animation, Move, Scale } from "remotion-animated";
import {z} from 'zod';

export default function Music(props: z.infer<typeof DefaultSchema>) {
    const music = `https://sebelasempat.hitam.id/api/ytMusic/${encodeURIComponent(props.musicTitle)}`;
    const frame = useCurrentFrame();
    const { fps, durationInFrames } = useVideoConfig();
    const duration = frame / fps;
    // console.log(props.syncronizeLyrics.filter((a) => duration >= a.start), duration)
    const lyricsOnCurrentDuration = props.syncronizeLyrics.filter((a) => duration >= a.start);
    let currentLyrics = lyricsOnCurrentDuration.slice(-1)[0]?.text || "♫";
    currentLyrics = currentLyrics === '' || currentLyrics === ' ' ? '♫' : currentLyrics;
    const previousLyrics = lyricsOnCurrentDuration.slice(-2)[0]?.text || "";
    const nextLyrics = props.syncronizeLyrics[lyricsOnCurrentDuration.lastIndexOf(lyricsOnCurrentDuration[lyricsOnCurrentDuration.length - 1]) + 1]?.text || "";
    const audioData = useAudioData(music);

    const currentLyricsAnimation = useMemo(() => {
        const animation: Animation[] = [];
        props.syncronizeLyrics.forEach(a => {
            const start = a.start * fps;
            const duration = fps / 2;
            animation.push(
                Move({ y: 0, initialY: 50, start, duration }),
                Scale({ by: 1, initial: 0.85, start, duration })
            );
        })
        return animation;
    }, []);

    const currentTimeDuration = `${String(Math.floor(duration / 60)).padStart(2, '0')}:${String(Math.floor(duration % 60)).padStart(2, '0')}`;
    const totalDuration = `${String(Math.floor(durationInFrames / fps / 60)).padStart(2, '0')}:${String(Math.floor(durationInFrames / fps % 60)).padStart(2, '0')}`;

    if (!audioData) return null;
    const frequencyData = visualizeAudio({
        fps,
        frame,
        audioData,
        numberOfSamples: 32,
        optimizeFor: 'accuracy',
    });
    const minDb = -60;
    const maxDb = -10;
    const clampNumberBetween0and1 = (num: number) => Math.min(Math.max(num, 0), 1);
    const visualization = frequencyData.map((value) => {
        // convert to decibels (will be in the range `-Infinity` to `0`)
        const db = 20 * Math.log10(value);

        // scale to fit between min and max
        const scaled = (db - minDb) / (maxDb - minDb);

        return clampNumberBetween0and1(scaled);
    });
    

    return (
        <>
            <Audio src={music} />
            <AbsoluteFill style={{ backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' }}>
                <AbsoluteFill>
                    <Img src={props.background} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                    <div style={{ backgroundColor: 'black', opacity: 0.6, position: 'absolute', width: '100%', height: '100%' }} />
                </AbsoluteFill>
                <div style={{ fontSize: 45, textAlign: 'center', opacity: 0.7, color: 'white' }}>
                    {previousLyrics}
                </div>
                <Animated animations={currentLyricsAnimation} style={{ zIndex: 9999 }} >
                    <div style={{
                        fontSize: 80, textAlign: 'center', fontFamily: 'sans', fontWeight: 'bold', color: 'white',
                        textShadow: '0 0 5px #00b7ff, 0 0 10px #00b7ff, 0 0 15px #00b7ff, 0 0 20px #00b7ff, 0 0 25px #00b7ff',
                        marginRight: 120, marginLeft: 120,
                    }}>
                        {currentLyrics}
                    </div>
                </Animated>
                <div style={{ fontSize: 45, textAlign: 'center', opacity: 0.7, color: 'white' }}>
                    {nextLyrics}
                </div>
                <div style={{ height: 100, alignItems: 'flex-end', display: 'flex', flexDirection: 'row', gap: 5, position: 'absolute', bottom: 35 }}>
                    {visualization.map((a, i) => (
                        <div key={i} style={{ height: (70 * a) + 5, width: 5, background: 'linear-gradient(to top, #00b7ff, #00ffff)' }} />
                    ))}
                </div>

                <div style={{ height: 5, width: 1000, position: 'absolute', bottom: 20 }}>
                    <div style={{ fontSize: 40, position: 'absolute', left: 0, bottom: 7, color: 'white', fontWeight: 'bold' }}>{currentTimeDuration}</div>
                    <div style={{ backgroundColor: 'white', height: 5, width: 1000, position: 'absolute', bottom: 0 }} />
                    <div style={{ height: 5, width: (frame / durationInFrames) * 1000, backgroundColor: 'red', position: 'absolute' }} />
                    <div style={{ position: 'absolute', left: (frame / durationInFrames) * 1000, bottom: -10, height: 25, width: 25, borderRadius: 100, backgroundColor: 'red' }} />
                    <div style={{ fontSize: 40, position: 'absolute', right: 0, bottom: 7, color: 'white', fontWeight: 'bold' }}>{totalDuration}</div>
                </div>
            </AbsoluteFill>
        </>
    );
}