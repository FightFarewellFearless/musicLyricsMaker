import { BG } from "bgutils-js";
import fs from "fs";
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
  // player_id: '0004de42',
  cookie: process.env.YT_COOKIE,
  po_token: pot,
  visitor_data: visitorData,
  client_type: "WEB_CREATOR",
});

export async function downloadMusicFile(title) {
  console.log("Searching for music:", title);
  const video = await innertube.music.search(title, {
    type: "song",
  });

  const musicurl = await (
    await innertube.music.getInfo(video.songs.contents[0].id)
  ).streaming_data.formats[0].decipher(innertube.session.player);

  console.log("Downloading music file...");
  const download = await fetch(musicurl)
    .then((a) => a.arrayBuffer())
    .then((a) => Buffer.from(a));
  fs.writeFileSync("./public/music.mp4", download);

  console.log("Converting music file to MP3...");
  execSync("ffmpeg -y -i ./public/music.mp4 ./public/music.mp3");

  console.log("Deleting temporary MP4 file...");
  fs.unlinkSync("./public/music.mp4");

  console.log("Processing search results...");
  const ytmSearchResult = video.songs.contents.map((song) => ({
    id: song.id,
    title: song.title,
    artists: song.artists.map((a) => a.name),
    thumbnail: song.thumbnails[0].url,
    duration: song.duration?.seconds,
  }));
  console.log("Search results:", ytmSearchResult);
  fs.writeFileSync("./public/search.json", JSON.stringify(ytmSearchResult));

  console.log("Fetching music thumbnail...");
  fetch(video.songs.contents[0].thumbnails[0].url)
    .then(async (a) => ({
      buffer: Buffer.from(await a.arrayBuffer()),
      fileExtension: a.headers.get("content-type").split("/")[1].split(";")[0],
    }))
    .then((a) =>
      fs.writeFileSync("./public/ytThumb." + a.fileExtension, a.buffer),
    );

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

  console.log("Fetching background...");
  fetch(props.background?.video ?? props.background)
    .then(async (a) => ({
      buffer: Buffer.from(await a.arrayBuffer()),
      fileExtension: a.headers.get("content-type").split("/")[1].split(";")[0],
    }))
    .then((a) =>
      fs.writeFileSync("./public/background." + a.fileExtension, a.buffer),
    );

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
  console.log("Lyrics search result:", data);

  const searchData = data[props.searchLyricsIndex];
  console.log("Selected lyrics data:", searchData);
  fs.writeFileSync("./public/searchData.json", JSON.stringify(searchData));

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
  console.log("Translation result:", translate);

  // @ts-ignore
  const shouldRomanize = !!translate.raw[0]?.[translate.raw[0].length - 1]?.[3];
  console.log("Should romanize:", shouldRomanize);

  if (props.translateTo !== "none") {
    console.log("Translating synchronized lyrics...");
    fs.writeFileSync(
      "./public/translateSyncronizeLyrics.json",
      JSON.stringify(await translateLyric(syncronizeLyrics, props.translateTo)),
    );
  } else {
    console.log("No translation needed.");
    fs.writeFileSync("./public/translateSyncronizeLyrics.json", "[]");
  }

  if (shouldRomanize) {
    console.log("Romanizing lyrics...");
    syncronizeLyrics = await romanize(syncronizeLyrics);
  }

  console.log("Writing synchronized lyrics to file...");
  fs.writeFileSync(
    "./public/syncronizeLyrics.json",
    JSON.stringify(syncronizeLyrics),
  );
}

console.log("Starting downloadMusicFile...");
downloadMusicFile(props.musicTitle);
