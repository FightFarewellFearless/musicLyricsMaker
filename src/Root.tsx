import { CalculateMetadataFunction, Composition, Still } from "remotion";
import Music from "./Music";
import fetch from "cross-fetch";
import { z } from "zod";
import ThumbnailCreator from "./ThumbnailCreator";

// Each <Composition> is an entry in the sidebar!
export type DefaultProps = {
  musicTitle: string;
  syncronizeLyrics: {
    start: number;
    text: string;
  }[];
  background: string | 'default';
}
export const DefaultSchema = z.object({
  musicTitle: z.string(),
  syncronizeLyrics: z.array(z.object({
    start: z.number(),
    text: z.string(),
  })),
  background: z.string().or(z.literal('default')),
})
const defaultProps: DefaultProps = {
  musicTitle: "It's Ok if you forget me",
  syncronizeLyrics: [],
  background: 'default',
};

export type DefaultThumbnailProps = {
  musicTitle: string;
  background: string;
};
const defaultThumbnailProps: DefaultThumbnailProps = {
  musicTitle: "It's Ok if you forget me",
  background: 'https://sebelasempat.hitam.id/api/wallpaper?url=https://raw.githubusercontent.com/orangci/walls-catppuccin-mocha/master/fox-clearing.png',
};
export const defaultThumbnailSchema = z.object({
  musicTitle: z.string(),
  background: z.string().or(z.literal('default')),
})

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MusicLyrics"
        component={Music}
        calculateMetadata={calculateMetadata}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={defaultProps}
        schema={DefaultSchema}
      />
      <Still 
        id="MusicThumbnail"
        component={ThumbnailCreator}
        width={1920}
        height={1080}
        defaultProps={defaultThumbnailProps}
        schema={defaultThumbnailSchema}
      />
    </>
  )
};

const calculateMetadata: CalculateMetadataFunction<DefaultProps> = async ({
  props,
  defaultProps,
  abortSignal,
}) => {
  interface APIRes {
    id: number;
    name: string;
    trackName: string;
    artistName: string;
    albumName: string;
    duration: number;
    instrumental: boolean;
    plainLyrics: string;
    syncedLyrics: string;
  }
  const data: APIRes[] = await fetch(
    "https://lrclib.net/api/search?q=" + props.musicTitle,
    { signal: abortSignal }
  ).then((res) => res.json()).then((x: APIRes[]) => x.filter(a => a.syncedLyrics !== null));

  const syncronizeLyricsRaw = data[0].syncedLyrics.split("\n")
  const syncronizeLyrics: { start: number; text: string }[] = [];
  syncronizeLyricsRaw.forEach(a => {
    try {
      const start = a.split("[")[1].split("]")[0];
      const text = a.split("]")[1];
      const [minutes, seconds] = start.split(":");
      syncronizeLyrics.push({
        start: (Number(minutes) * 60) + Number(seconds),
        text: text,
      });
    } catch { };
  });

  let background: string;

  if (props.background !== 'default') {
    background = props.background;
  } else {
    background = await fetch('https://sebelasempat.hitam.id/api/randomWallpaper').then(a => a.json()).then(a => a.background);
  }

  return {
    // Change the metadata
    durationInFrames: Math.round(data[0].duration * 30),
    // or transform some props
    props: {
      ...props,
      syncronizeLyrics: [{ start: 0, text: `[${data[0].trackName} - ${data[0].artistName}]` }, ...syncronizeLyrics],
      background,
    },
    // or add per-composition default codec
    defaultCodec: "h264",
  };
};
