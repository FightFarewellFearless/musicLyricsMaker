import { BG } from "bgutils-js";
import fs from "fs";
import path from "path";
import trr from "googletrans";
import { JSDOM } from "jsdom";
import { Innertube, UniversalCache } from "youtubei.js";
import props from "./props.json" with { type: "json" };
import { romanize, translateLyric } from "./src/googletranslate.js";
import { execSync } from "child_process";

import { Platform } from "youtubei.js/web";

Platform.shim.eval = async (data, env) => {
  const properties = [];

  if (env.n) {
    properties.push(`n: exportedVars.nFunction("${env.n}")`);
  }

  if (env.sig) {
    properties.push(`sig: exportedVars.sigFunction("${env.sig}")`);
  }

  const code = `${data.output}\nreturn { ${properties.join(", ")} }`;

  return new Function(code)();
};

const tr = trr.default;

console.log("Initializing JSDOM...");
const dom = new JSDOM();

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
});

console.log("Creating Innertube instance...");
const yt = await Innertube.create({
  retrieve_player: false,
  client_type: "WEB_CREATOR",
});
const requestKey = "O43z0dpjhgX20SCx4KAo";
const visitorData = yt.session.context.client.visitorData;

console.log("Setting up BG configuration...");
const bgConfig = {
  fetch: (...params) => fetch(...params),
  globalObj: globalThis,
  identifier: visitorData,
  requestKey,
};

console.log("Creating BG Challenge...");
const pot = await BG.Challenge.create(bgConfig).then(async (bg) => {
  if (!bg) throw new Error("Could not get challenge");
  console.log("BG Challenge created successfully.");

  const interpreterJavascript =
    bg.interpreterJavascript.privateDoNotAccessOrElseSafeScriptWrappedValue;
  if (interpreterJavascript) {
    console.log("Executing interpreterJavascript...");
    new Function(interpreterJavascript)();
  } else throw new Error("Could not get interpreterJavascript");

  console.log("Generating PoToken...");
  const poTokenResult = await BG.PoToken.generate({
    program: bg.program,
    globalName: bg.globalName,
    bgConfig,
  });

  if (!poTokenResult.poToken) {
    throw new Error("Could not get poToken");
  }
  console.log("PoToken generated successfully.");
  return poTokenResult.poToken;
});

console.log("Creating Innertube instance with PoToken...");
const innertube = await Innertube.create({
  // cache: new UniversalCache(true),
  //player_id: '00c52fa0',
  cookie: process.env.YT_COOKIE,
  po_token: pot,
  visitor_data: visitorData,
  client_type: "WEB_CREATOR",
});

export async function downloadMusicFile() {
  console.log("Clearing old data in ./public...");
  const publicDir = "./public";
  if (fs.existsSync(publicDir)) {
    fs.readdirSync(publicDir).forEach((file) => {
      if (file !== "PLACEHOLDER") {
        fs.unlinkSync(path.join(publicDir, file));
      }
    });
  } else {
    fs.mkdirSync(publicDir);
  }

  console.log("Fetching background...");
  if (props.background === "default" && typeof props.background === "string") {
    console.log("Fetching default background...");
    props.background = await fetch(
      "https://api.github.com/repos/DenverCoder1/minimalistic-wallpaper-collection/contents/images",
    )
      .then((res) => res.json())
      .then(
        (a) =>
          a.filter(
            (a) =>
              a.type === "file" &&
              a.name !== "README.md" &&
              a.name !== "LICENSE" &&
              a.name !== "bsod.png",
          )[Math.floor(Math.random() * a.length)].download_url,
      );
  }

  const bgExt = await fetch(props.background?.video ?? props.background)
    .then(async (a) => ({
      buffer: Buffer.from(await a.arrayBuffer()),
      fileExtension: a.headers.get("content-type").split("/")[1].split(";")[0],
    }))
    .then((a) => {
      fs.writeFileSync("./public/background." + a.fileExtension, a.buffer);
      return a.fileExtension;
    });

  const tracksData = [];
  
  if (!props.tracks || props.tracks.length === 0) {
    console.log("No tracks found in props.json");
    return;
  }

  for (let i = 0; i < props.tracks.length; i++) {
    const trackProps = props.tracks[i];
    const title = trackProps.musicTitle;
    console.log(`\n--- Processing Track ${i}: ${title} ---`);

    const video = await innertube.music.search(title, {
      type: "song",
    });

    if (!video.songs || video.songs.contents.length === 0) {
      console.log(`No song found for ${title}`);
      continue;
    }

    const musicurl = await (
      await innertube.music.getInfo(video.songs.contents[0].id)
    ).streaming_data.formats[0].decipher(innertube.session.player);

    console.log("Downloading music file...");
    const download = await fetch(musicurl)
      .then((a) => a.arrayBuffer())
      .then((a) => Buffer.from(a));
    fs.writeFileSync(`./public/music_${i}.mp4`, download);

    console.log("Converting music file to MP3...");
    execSync(`ffmpeg -y -i ./public/music_${i}.mp4 ./public/music_${i}.mp3`);
    fs.unlinkSync(`./public/music_${i}.mp4`);

    const ytmSearchResult = video.songs.contents.map((song) => ({
      id: song.id,
      title: song.title,
      artists: song.artists.map((a) => a.name),
      thumbnail: song.thumbnails[0].url,
      duration: song.duration?.seconds,
    }));

    console.log("Fetching music thumbnail...");
    const thumbExt = await fetch(video.songs.contents[0].thumbnails[0].url)
      .then(async (a) => {
        const ext = a.headers.get("content-type").split("/")[1].split(";")[0];
        fs.writeFileSync(`./public/ytThumb_${i}.${ext}`, Buffer.from(await a.arrayBuffer()));
        return ext;
      });

    console.log("Synchronizing lyrics...");
    let syncronizeLyrics = [];

    const data = await fetch(
      "https://lrclib.net/api/search?q=" +
        encodeURIComponent(
          ytmSearchResult[0].title + " " + ytmSearchResult[0].artists.join(" "),
        ),
    )
      .then((res) => res.json())
      .then((x) =>
        x
          .filter((a) => a.syncedLyrics !== null)
          .filter((a) => Math.abs(a.duration - ytmSearchResult[0].duration) <= 2)
          // @ts-ignore
          .toSorted(
            (a, b) =>
              Math.abs(a.duration - ytmSearchResult[0].duration) -
              Math.abs(b.duration - ytmSearchResult[0].duration),
          ),
      );

    const searchData = data[trackProps.searchLyricsIndex || 0];

    if (searchData && searchData.syncedLyrics) {
      const syncronizeLyricsRaw = searchData.syncedLyrics.split("\n");
      syncronizeLyricsRaw.forEach((a) => {
        try {
          const start = a.split("[")[1].split("]")[0];
          const text = a.split("]")[1];
          const [minutes, seconds] = start.split(":");
          const startDuration = Number(minutes) * 60 + Number(seconds);
          if (startDuration === 0 && text.trim() === "") return;
          syncronizeLyrics.push({
            start: startDuration,
            text,
          });
        } catch {}
      });

      console.log("Translating lyrics...");
      const translate = await tr(searchData.syncedLyrics);
      
      // @ts-ignore
      const shouldRomanize = !!translate.raw[0]?.[translate.raw[0].length - 1]?.[3];

      let translateSyncronizeLyrics = [];
      if (props.translateTo !== "none") {
        translateSyncronizeLyrics = await translateLyric(syncronizeLyrics, props.translateTo);
      }

      if (shouldRomanize) {
        syncronizeLyrics = await romanize(syncronizeLyrics);
      }

      tracksData.push({
        ytmMusicInfo: `${searchData.trackName} - ${searchData.artistName}`,
        ytmThumbnailExt: thumbExt,
        duration: searchData.duration,
        syncronizeLyrics: [{ start: 0, text: `[${searchData.trackName} - ${searchData.artistName}]` }, ...syncronizeLyrics],
        translateSyncronizeLyrics,
        musicTitle: trackProps.musicTitle
      });
    } else {
      tracksData.push({
        ytmMusicInfo: `${ytmSearchResult[0].title} - ${ytmSearchResult[0].artists.join(", ")}`,
        ytmThumbnailExt: thumbExt,
        duration: ytmSearchResult[0].duration,
        syncronizeLyrics: [{ start: 0, text: `[${ytmSearchResult[0].title} - ${ytmSearchResult[0].artists.join(", ")}]` }],
        translateSyncronizeLyrics: [],
        musicTitle: trackProps.musicTitle
      });
    }
  }

  console.log("Writing unified tracksData.json...");
  fs.writeFileSync("./public/tracksData.json", JSON.stringify(tracksData, null, 2));
}

console.log("Starting downloadMusicFile...");
downloadMusicFile();
