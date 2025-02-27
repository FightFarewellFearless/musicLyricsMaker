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
  background: {
    video: string
  } | string;
  ytmMusicInfo: string;
  ytmThumbnail: string;
  searchLyricsIndex: number;
}
export const DefaultSchema = z.object({
  musicTitle: z.string(),
  syncronizeLyrics: z.array(z.object({
    start: z.number(),
    text: z.string(),
  })),
  background: z.union([z.string(), z.object({ video: z.string() })]),
  ytmMusicInfo: z.string(),
  ytmThumbnail: z.string(),
  searchLyricsIndex: z.number().default(0),
})
const defaultProps: DefaultProps = {
  musicTitle: "Rindu rumah",
  syncronizeLyrics: [],
  background: {
    video: "https://static.moewalls.com/videos/preview/2023/lofi-anime-girl-drinking-coffee-preview.mp4"
  },
  ytmMusicInfo: '',
  ytmThumbnail: '',
  searchLyricsIndex: 0,
};

export type DefaultThumbnailProps = {
  musicTitle: string;
  background: {
    video: string
  } | string;
};
const defaultThumbnailProps: DefaultThumbnailProps = {
  musicTitle: "Rindu rumah",
  background: {
    video: "https://static.moewalls.com/videos/preview/2023/lofi-anime-girl-drinking-coffee-preview.mp4"
  },
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
  const ytmSearchResult: YTMSearch = await fetch(
    'https://sebelasempat.hitam.id/api/ytm/search?q=' + encodeURIComponent(props.musicTitle),
    { signal: abortSignal }
  ).then(a => a.json()).then((a: YTMSearch[]) => a[0]);
  const data: APIRes[] = await fetch(
    "https://lrclib.net/api/search?q=" + encodeURIComponent(ytmSearchResult.title + " " + ytmSearchResult.artists.join(" ")),
    { signal: abortSignal }
  ).then((res) => res.json()).then((x: APIRes[]) => x.filter(a => a.syncedLyrics !== null)
    .filter(a => Math.abs(a.duration - ytmSearchResult.duration) <= 2));

  const searchData = data[defaultProps.searchLyricsIndex];

  const syncronizeLyricsRaw = searchData.syncedLyrics.split("\n")
  const syncronizeLyrics: { start: number; text: string }[] = [];
  syncronizeLyricsRaw.forEach(a => {
    try {
      const start = a.split("[")[1].split("]")[0];
      const text = a.split("]")[1];
      const [minutes, seconds] = start.split(":");
      syncronizeLyrics.push({
        start: (Number(minutes) * 60) + Number(seconds),
        text,
      });
    } catch { };
  });

  let {background} = props;

  if (props.background === 'default' && typeof props.background === 'string') {
    background = await fetch('https://sebelasempat.hitam.id/api/randomWallpaper').then(a => a.json()).then(a => a.background);
  }

  return {
    // Change the metadata
    durationInFrames: Math.round(searchData.duration * 30),
    // or transform some props
    props: {
      ...props,
      syncronizeLyrics: [{ start: 0, text: `[${searchData.trackName} - ${searchData.artistName}]` }, ...syncronizeLyrics],
      background,
      ytmThumbnail: ytmSearchResult.thumbnail,
      ytmMusicInfo: `${searchData.trackName} - ${searchData.artistName}`,
    },
    // or add per-composition default codec
    defaultCodec: "h264",
  };
};
