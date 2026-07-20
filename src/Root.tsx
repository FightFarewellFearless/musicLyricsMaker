import { CalculateMetadataFunction, Composition, getStaticFiles, staticFile, Still } from "remotion";
import tr from 'googletrans';
import Music from "./Music";
import MusicPortrait from "./MusicPortrait";
import fetch from "cross-fetch";
import { z } from "zod";
import ThumbnailCreator from "./ThumbnailCreator";
import { checkRomanizationIsNeeded, romanize, translateLyric } from "./googletranslate";

// Each <Composition> is an entry in the sidebar!
export type DefaultProps = {
  musicTitle: string;
  syncronizeLyrics: {
    start: number;
    text: string;
  }[];
  translateSyncronizeLyrics: {
    start: number;
    text: string;
  }[];
  background: {
    video: string
  } | string;
  ytmMusicInfo: string;
  ytmThumbnail: string;
  searchLyricsIndex: number;
  translateTo: string | "none";
}
export const DefaultSchema = z.object({
  musicTitle: z.string(),
  syncronizeLyrics: z.array(z.object({
    start: z.number(),
    text: z.string(),
  })),
  translateSyncronizeLyrics: z.array(z.object({
    start: z.number(),
    text: z.string(),
  })),
  background: z.union([z.string(), z.object({ video: z.string() })]),
  ytmMusicInfo: z.string(),
  ytmThumbnail: z.string(),
  searchLyricsIndex: z.number().default(0),
  translateTo: z.string(),
})
const defaultProps: DefaultProps = {
  "musicTitle": "Nothing's gonna change my love for you",
  "syncronizeLyrics": [],
  "translateSyncronizeLyrics": [],
  "background": "default",
  "ytmMusicInfo": "",
  "ytmThumbnail": "",
  "searchLyricsIndex": 0,
  "translateTo": "none"
}

export type DefaultThumbnailProps = {
  musicTitle: string;
  background: {
    video: string
  } | string;
};
const defaultThumbnailProps: DefaultThumbnailProps = {
  musicTitle: "Nothing's gonna change my love for you",
  background: "default",
};
export const defaultThumbnailSchema = z.object({
  musicTitle: z.string(),
  background: z.union([z.string(), z.object({ video: z.string() })]),
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
  interface YTMSearch {
    id: string;
    title: string;
    artists: string[];
    thumbnail: string;
    duration: number;
  }
  type SYNCLRC = { start: number; text: string }[];
  let syncronizeLyrics: SYNCLRC = [];
  let translateSyncronizeLyrics: SYNCLRC = [];
  let searchData: APIRes;
  let ytmSearchResult: YTMSearch;

    searchData = await fetch(staticFile('searchData.json')).then(a => a.json());
    ytmSearchResult = await fetch(
      staticFile('search.json')
    ).then(a => a.json()).then((a: YTMSearch[]) => a[0]);
    syncronizeLyrics = await fetch(staticFile('syncronizeLyrics.json')).then(a => a.json());
    translateSyncronizeLyrics = await fetch(staticFile('translateSyncronizeLyrics.json')).then(a => a.json());

  let { background } = props;

  if (props.background === 'default' && typeof props.background === 'string') {
    background = await fetch('https://api.github.com/repos/orangci/walls-catppuccin-mocha/contents')
      .then(res => res.json()).then(a => a.filter((a: any) => a.type === 'file' && a.name !== 'README.md' && a.name !== 'LICENSE' && a.name !== 'bsod.png')[Math.floor(Math.random() * a.length)].download_url);
  }

  return {
    // Change the metadata
    durationInFrames: Math.round(searchData.duration * 30),
    // or transform some props
    props: {
      ...props,
      syncronizeLyrics: [{ start: 0, text: `[${searchData.trackName} - ${searchData.artistName}]` }, ...syncronizeLyrics],
      translateSyncronizeLyrics,
      background,
      ytmThumbnail: ytmSearchResult.thumbnail,
      ytmMusicInfo: `${searchData.trackName} - ${searchData.artistName}`,
    },
    // or add per-composition default codec
    defaultCodec: "h264",
  };
};
