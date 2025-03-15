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
    fetch(video.songs.contents[0].thumbnails[0].url).then(a => a.arrayBuffer()).then(a => Buffer.from(a)).then(a => fs.writeFileSync('./public/ytThumb.jpg'));
    const file = fs.createWriteStream('./public/music.mp3');
    await finished(Readable.fromWeb(download).pipe(file));
};

downloadMusicFile(
    props.musicTitle
);