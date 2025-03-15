import { Innertube } from 'youtubei.js';
import fs from 'fs';
import { Readable } from 'stream';
import { finished } from 'stream/promises';
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
    fs.writeFileSync('./public/search.json', JSON.stringify(video.songs.contents.map(song => ({
        id: song.id,
        title: song.title,
        artists: song.artists.map(a => a.name),
        thumbnail: song.thumbnails[0].url,
        duration: song.duration?.seconds
    }))));
    fetch(video.songs.contents[0].thumbnails[0].url).then(async a => ({
        buffer: Buffer.from(await a.arrayBuffer()),
        fileExtension: a.headers.get('content-type').split('/')[1].split(';')[0]
    })).then(a => fs.writeFileSync('./public/ytThumb.' + a.fileExtension, a.buffer));

    if (props.background === 'default' && typeof props.background === 'string') {
        props.background = await fetch('https://api.github.com/repos/orangci/walls-catppuccin-mocha/contents')
        .then(res => res.json()).then(a => a.filter((a) => a.type === 'file' && a.name !== 'README.md' && a.name !== 'LICENSE' && a.name !== 'bsod.png')[Math.floor(Math.random() * a.length)].download_url);
      }
    
    fetch(props.background?.video ?? props.background).then(async a => ({
        buffer: Buffer.from(await a.arrayBuffer()),
        fileExtension: a.headers.get('content-type').split('/')[1].split(';')[0]
    })).then(a => fs.writeFileSync('./public/background.' + a.fileExtension, a.buffer));

    const file = fs.createWriteStream('./public/music.mp3');
    await finished(Readable.fromWeb(download).pipe(file));
};

downloadMusicFile(
    props.musicTitle
);