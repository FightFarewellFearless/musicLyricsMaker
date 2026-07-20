import { CalculateMetadataFunction, Composition, staticFile, Still } from "remotion";
import Music from "./Music";
import MusicPortrait from "./MusicPortrait";
import fetch from "cross-fetch";
import { z } from "zod";
import ThumbnailCreator from "./ThumbnailCreator";
import appProps from "../props.json";

// Each <Composition> is an entry in the sidebar!
export type TrackProps = {
  musicTitle: string;
  searchLyricsIndex: number;
};

export type DefaultProps = {
  musicTitle?: string;
  background: {
    video: string
  } | string;
  translateTo: string | "none";
  tracks: TrackProps[];
  tracksData?: {
    ytmMusicInfo: string;
    ytmThumbnailExt: string;
    duration: number;
    syncronizeLyrics: { start: number; text: string }[];
    translateSyncronizeLyrics: { start: number; text: string }[];
    musicTitle: string;
    startFrame: number;
    durationInFrames: number;
  }[];
}

export const DefaultSchema = z.object({
  musicTitle: z.string().optional(),
  background: z.union([z.string(), z.object({ video: z.string() })]),
  translateTo: z.string(),
  tracks: z.array(z.object({
    musicTitle: z.string(),
    searchLyricsIndex: z.number().default(0),
  })),
  tracksData: z.any().optional(),
})

const defaultProps: DefaultProps = {
  musicTitle: (appProps as any).musicTitle || "Best Hits Compilation",
  background: appProps.background || "default",
  translateTo: appProps.translateTo || "none",
  tracks: appProps.tracks || [{
    musicTitle: "Nothing's gonna change my love for you",
    searchLyricsIndex: 0
  }]
}

export type DefaultThumbnailProps = {
  musicTitle: string;
  background: {
    video: string
  } | string;
  tracksData?: any;
};
const defaultThumbnailProps: DefaultThumbnailProps = {
  musicTitle: (appProps as any).musicTitle || "Best Hits Compilation",
  background: appProps.background || "default",
  tracksData: Array.from({ length: 20 }).map((_, i) => ({
    musicTitle: `Awesome Track ${i + 1}`
  }))
};
export const defaultThumbnailSchema = z.object({
  musicTitle: z.string(),
  background: z.union([z.string(), z.object({ video: z.string() })]),
  tracksData: z.any().optional(),
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
      <Composition
        id="MusicLyricsPortrait"
        component={MusicPortrait}
        calculateMetadata={calculateMetadata}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={defaultProps}
        schema={DefaultSchema}
      />
      <Still
        id="MusicThumbnail"
        component={ThumbnailCreator}
        calculateMetadata={calculateMetadataThumbnail}
        width={1920}
        height={1080}
        defaultProps={defaultThumbnailProps}
        schema={defaultThumbnailSchema}
      />
    </>
  )
};

const calculateMetadataThumbnail: CalculateMetadataFunction<DefaultThumbnailProps> = async ({
  props,
}) => {
  let tracksDataRaw: any[] = [];
  try {
    tracksDataRaw = await fetch(staticFile('tracksData.json')).then(a => a.json());
  } catch (e) {
    console.warn("tracksData.json not found in thumbnail.");
  }

  let { background } = props;
  if (props.background === 'default' && typeof props.background === 'string') {
    background = await fetch('https://api.github.com/repos/orangci/walls-catppuccin-mocha/contents')
      .then(res => res.json()).then(a => a.filter((a: any) => a.type === 'file' && a.name !== 'README.md' && a.name !== 'LICENSE' && a.name !== 'bsod.png')[Math.floor(Math.random() * a.length)].download_url);
  }

  return {
    props: {
      ...props,
      background,
      tracksData: tracksDataRaw.length > 0 ? tracksDataRaw : props.tracksData
    }
  };
};

const calculateMetadata: CalculateMetadataFunction<DefaultProps> = async ({
  props,
  defaultProps,
  abortSignal,
}) => {
  let tracksDataRaw: any[] = [];
  try {
    tracksDataRaw = await fetch(staticFile('tracksData.json')).then(a => a.json());
  } catch (e) {
    console.warn("tracksData.json not found, maybe downloadAudio hasn't run yet.");
  }

  let totalDurationFrames = 0;
  const tracksData = tracksDataRaw.map(t => {
     const durationInFrames = Math.round(t.duration * 30);
     const trackMeta = {
       ...t,
       startFrame: totalDurationFrames,
       durationInFrames
     };
     totalDurationFrames += durationInFrames;
     return trackMeta;
  });
  
  if (totalDurationFrames === 0) totalDurationFrames = 30 * 10; // default 10 seconds if no data

  let { background } = props;

  if (props.background === 'default' && typeof props.background === 'string') {
    background = await fetch('https://api.github.com/repos/orangci/walls-catppuccin-mocha/contents')
      .then(res => res.json()).then(a => a.filter((a: any) => a.type === 'file' && a.name !== 'README.md' && a.name !== 'LICENSE' && a.name !== 'bsod.png')[Math.floor(Math.random() * a.length)].download_url);
  }

  return {
    // Change the metadata
    durationInFrames: totalDurationFrames,
    // or transform some props
    props: {
      ...props,
      background,
      tracksData
    },
    // or add per-composition default codec
    defaultCodec: "h264",
  };
};
