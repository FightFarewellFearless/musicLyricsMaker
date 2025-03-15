import { Innertube } from 'youtubei.js';
import fs from 'fs';
import { Readable } from 'stream';
import { finished } from 'stream/promises';
import trr from 'googletrans';
const tr = trr.default;
import props from './props.json' with { type: "json" };

const innertube = await Innertube.create({
    cookie: process.env.YT_COOKIE
});

export async function downloadMusicFile(title) {
    const video = await innertube.music.search(title, {
        type: 'song'
    });
    const download = await innertube.download(video.songs.contents[0].id, {
        type: 'audio'
    });
    console.log('Downloading', video.songs.contents[0].title, '-', video.songs.contents[0].artists.map(a => a.name).join(', '));
    const ytmSearchResult = (video.songs.contents.map(song => ({
        id: song.id,
        title: song.title,
        artists: song.artists.map(a => a.name),
        thumbnail: song.thumbnails[0].url,
        duration: song.duration?.seconds
    })));
    fs.writeFileSync('./public/search.json', JSON.stringify(ytmSearchResult));
    // fetch music thumbnail
    fetch(video.songs.contents[0].thumbnails[0].url).then(async a => ({
        buffer: Buffer.from(await a.arrayBuffer()),
        fileExtension: a.headers.get('content-type').split('/')[1].split(';')[0]
    })).then(a => fs.writeFileSync('./public/ytThumb.' + a.fileExtension, a.buffer));

    if (props.background === 'default' && typeof props.background === 'string') {
        props.background = await fetch('https://api.github.com/repos/orangci/walls-catppuccin-mocha/contents')
            .then(res => res.json()).then(a => a.filter((a) => a.type === 'file' && a.name !== 'README.md' && a.name !== 'LICENSE' && a.name !== 'bsod.png')[Math.floor(Math.random() * a.length)].download_url);
    }
    // fetch background
    fetch(props.background?.video ?? props.background).then(async a => ({
        buffer: Buffer.from(await a.arrayBuffer()),
        fileExtension: a.headers.get('content-type').split('/')[1].split(';')[0]
    })).then(a => fs.writeFileSync('./public/background.' + a.fileExtension, a.buffer));

    // sync lyrics

    const syncronizeLyrics = [];

    const data = await fetch(
        "https://lrclib.net/api/search?q=" + encodeURIComponent(ytmSearchResult[0].title + " " + ytmSearchResult[0].artists.join(" "))
    ).then((res) => res.json()).then((x) => x.filter(a => a.syncedLyrics !== null)
        .filter(a => Math.abs(a.duration - ytmSearchResult[0].duration) <= 2)
        // @ts-ignore
        .toSorted((a, b) => a.duration - b.duration));

    const searchData = data[0]; // props.searchLyricsIndex

    const syncronizeLyricsRaw = searchData.syncedLyrics.split("\n")
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

    const translate = await tr(searchData.syncedLyrics);
    // @ts-ignore
    const shouldRomanize = !!translate.raw[0]?.[translate.raw[0].length - 1]?.[3];

    if (shouldRomanize) {
        for (let i = 0; i < syncronizeLyrics.length; i++) {
            try {
                const romanize = await tr(syncronizeLyrics[i].text);
                // @ts-ignore
                syncronizeLyrics[i].text = romanize.raw[0]?.[romanize.raw[0].length - 1]?.[3]
            } catch { }
        }
    }

    fs.writeFileSync('./public/syncronizeLyrics.json', JSON.stringify(syncronizeLyrics));

    const file = fs.createWriteStream('./public/music.mp3');
    await finished(Readable.fromWeb(download).pipe(file));
};

downloadMusicFile(
    props.musicTitle
);