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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function withRetry(fn, retries = 3, delayMs = 2000, label = "") {
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      console.warn(`[Retry ${attempt}/${retries}] ${label ? label + ": " : ""}${err.message || err}`);
      if (attempt < retries) {
        await sleep(delayMs * attempt);
      }
    }
  }
  throw lastError;
}

export async function downloadMusicFile() {
  console.log("Clearing old data in ./public...");
  const publicDir = "./public";
  if (fs.existsSync(publicDir)) {
    fs.readdirSync(publicDir).forEach((file) => {
      if (file !== "PLACEHOLDER") {
        try {
          fs.unlinkSync(path.join(publicDir, file));
        } catch {}
      }
    });
  } else {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  console.log("Fetching background...");
  try {
    if (props.background === "default" || (typeof props.background === "string" && props.background === "default")) {
      console.log("Fetching default background...");
      props.background = await fetch(
        "https://api.github.com/repos/DenverCoder1/minimalistic-wallpaper-collection/contents/images"
      )
        .then((res) => res.json())
        .then(
          (a) =>
            a.filter(
              (a) =>
                a.type === "file" &&
                a.name !== "README.md" &&
                a.name !== "LICENSE" &&
                a.name !== "bsod.png"
            )[Math.floor(Math.random() * a.length)].download_url
        );
    }

    const bgUrl = props.background?.video ?? props.background;
    if (bgUrl) {
      const bgRes = await fetch(bgUrl);
      const bgBuffer = Buffer.from(await bgRes.arrayBuffer());
      const contentType = bgRes.headers.get("content-type") || "image/jpeg";
      const fileExtension = contentType.split("/")[1]?.split(";")[0] || "jpg";
      fs.writeFileSync(`./public/background.${fileExtension}`, bgBuffer);
    }
  } catch (bgErr) {
    console.warn(`Failed to fetch background: ${bgErr.message}`);
  }

  const tracksData = [];

  if (!props.tracks || props.tracks.length === 0) {
    console.log("No tracks found in props.json");
    return;
  }

  for (let i = 0; i < props.tracks.length; i++) {
    const trackProps = props.tracks[i];
    const title = trackProps.musicTitle;
    console.log(`\n--- Processing Track ${i}: ${title} ---`);

    const tempMp4 = `./public/music_${i}.mp4`;
    const finalMp3 = `./public/music_${i}.mp3`;

    try {
      // 1. YouTube Search with Retry
      const video = await withRetry(
        () => innertube.music.search(title, { type: "song" }),
        3,
        2000,
        `YouTube Music Search (${title})`
      );

      if (!video.songs || !video.songs.contents || video.songs.contents.length === 0) {
        console.log(`No song found on YouTube for: ${title}`);
        tracksData.push({
          ytmMusicInfo: title,
          ytmThumbnailExt: "jpg",
          duration: 0,
          syncronizeLyrics: [{ start: 0, text: `[${title} - Track Not Found]` }],
          translateSyncronizeLyrics: [],
          musicTitle: title,
        });
        continue;
      }

      const song = video.songs.contents[0];
      const songId = song.id;

      // 2. Fetch Info & Decipher Audio Stream
      console.log(`Found YouTube track: "${song.title}" (ID: ${songId})`);
      const info = await withRetry(
        () => innertube.music.getInfo(songId),
        3,
        2000,
        `Get Info (${songId})`
      );

      let downloadBuffer = null;

      // Select audio format from adaptive_formats or formats
      let audioFormat = info.streaming_data?.formats?.[0] || info.streaming_data?.adaptive_formats?.[0];

      if (audioFormat) {
        try {
          const musicurl = await audioFormat.decipher(innertube.session.player);
          console.log("Downloading music audio stream...");
          const downloadRes = await fetch(musicurl);
          if (downloadRes.ok) {
            downloadBuffer = Buffer.from(await downloadRes.arrayBuffer());
          }
        } catch (decipherErr) {
          console.warn(`Direct decipher stream download failed: ${decipherErr.message}`);
        }
      }

      // Fallback download if decipher/direct fetch failed
      if (!downloadBuffer) {
        console.log("Trying fallback download via innertube.download...");
        const stream = await withRetry(
          () => innertube.download(songId, { type: "audio" }),
          2,
          2000,
          `Innertube Download (${songId})`
        );
        const chunks = [];
        const reader = stream.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
        }
        downloadBuffer = Buffer.concat(chunks);
      }

      fs.writeFileSync(tempMp4, downloadBuffer);

      console.log("Converting music file to MP3...");
      execSync(`ffmpeg -y -i "${tempMp4}" "${finalMp3}"`);

      const ytmSearchResult = video.songs.contents.map((s) => ({
        id: s.id,
        title: s.title,
        artists: s.artists ? s.artists.map((a) => a.name) : ["Unknown Artist"],
        thumbnail: s.thumbnails?.[0]?.url,
        duration: s.duration?.seconds || 0,
      }));

      // 3. Fetch Thumbnail
      console.log("Fetching music thumbnail...");
      let thumbExt = "jpg";
      if (song.thumbnails?.[0]?.url) {
        try {
          const thumbRes = await fetch(song.thumbnails[0].url);
          if (thumbRes.ok) {
            const contentType = thumbRes.headers.get("content-type") || "image/jpeg";
            thumbExt = contentType.split("/")[1]?.split(";")[0] || "jpg";
            fs.writeFileSync(`./public/ytThumb_${i}.${thumbExt}`, Buffer.from(await thumbRes.arrayBuffer()));
          }
        } catch (thumbErr) {
          console.warn(`Failed to fetch thumbnail: ${thumbErr.message}`);
        }
      }

      // 4. Synchronize Lyrics via LRCLib
      console.log("Synchronizing lyrics...");
      let syncronizeLyrics = [];
      let searchData = null;

      try {
        const query = encodeURIComponent(`${ytmSearchResult[0].title} ${ytmSearchResult[0].artists.join(" ")}`);
        const lrclibRes = await withRetry(
          () => fetch(`https://lrclib.net/api/search?q=${query}`),
          2,
          1000,
          `LRCLib search (${title})`
        );

        if (lrclibRes.ok) {
          const x = await lrclibRes.json();
          if (Array.isArray(x)) {
            const filtered = x
              .filter((a) => a.syncedLyrics !== null)
              .filter((a) => Math.abs(a.duration - ytmSearchResult[0].duration) <= 2)
              // @ts-ignore
              .toSorted(
                (a, b) =>
                  Math.abs(a.duration - ytmSearchResult[0].duration) -
                  Math.abs(b.duration - ytmSearchResult[0].duration)
              );
            searchData = filtered[trackProps.searchLyricsIndex || 0];
          }
        }
      } catch (lrcErr) {
        console.warn(`LRCLib request failed for "${title}": ${lrcErr.message}`);
      }

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
        let translateSyncronizeLyrics = [];
        let shouldRomanize = false;

        try {
          const translate = await tr(searchData.syncedLyrics);
          // @ts-ignore
          shouldRomanize = !!translate?.raw?.[0]?.[translate.raw[0].length - 1]?.[3];
        } catch (trErr) {
          console.warn(`Translate detection failed: ${trErr.message}`);
        }

        if (props.translateTo && props.translateTo !== "none") {
          try {
            translateSyncronizeLyrics = await translateLyric(syncronizeLyrics, props.translateTo);
          } catch (trLyricErr) {
            console.warn(`Translate lyrics failed: ${trLyricErr.message}`);
          }
        }

        if (shouldRomanize) {
          try {
            syncronizeLyrics = await romanize(syncronizeLyrics);
          } catch (romErr) {
            console.warn(`Romanize lyrics failed: ${romErr.message}`);
          }
        }

        tracksData.push({
          ytmMusicInfo: `${searchData.trackName} - ${searchData.artistName}`,
          ytmThumbnailExt: thumbExt,
          duration: searchData.duration,
          syncronizeLyrics: [{ start: 0, text: `[${searchData.trackName} - ${searchData.artistName}]` }, ...syncronizeLyrics],
          translateSyncronizeLyrics,
          musicTitle: trackProps.musicTitle,
        });
      } else {
        tracksData.push({
          ytmMusicInfo: `${ytmSearchResult[0].title} - ${ytmSearchResult[0].artists.join(", ")}`,
          ytmThumbnailExt: thumbExt,
          duration: ytmSearchResult[0].duration,
          syncronizeLyrics: [{ start: 0, text: `[${ytmSearchResult[0].title} - ${ytmSearchResult[0].artists.join(", ")}]` }],
          translateSyncronizeLyrics: [],
          musicTitle: trackProps.musicTitle,
        });
      }
    } catch (trackErr) {
      console.error(`Error processing Track ${i} (${title}):`, trackErr.message || trackErr);
      tracksData.push({
        ytmMusicInfo: title,
        ytmThumbnailExt: "jpg",
        duration: 0,
        syncronizeLyrics: [{ start: 0, text: `[${title} - Failed to process]` }],
        translateSyncronizeLyrics: [],
        musicTitle: trackProps.musicTitle,
      });
    } finally {
      // Always cleanup temp mp4 file
      if (fs.existsSync(tempMp4)) {
        try {
          fs.unlinkSync(tempMp4);
        } catch {}
      }
    }

    // Delay between tracks to avoid rate limiting
    if (i < props.tracks.length - 1) {
      console.log("Waiting 2 seconds before next track...");
      await sleep(2000);
    }
  }

  console.log("Writing unified tracksData.json...");
  fs.writeFileSync("./public/tracksData.json", JSON.stringify(tracksData, null, 2));
}

console.log("Starting downloadMusicFile...");
downloadMusicFile();
