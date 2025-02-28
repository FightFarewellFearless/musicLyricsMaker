/* eslint-disable no-undef */
import { bundle } from '@remotion/bundler';
import { renderMedia, renderStill, selectComposition } from '@remotion/renderer';
import path from 'path';
console.log('Memulai rendering...');
const inputProps = {
  musicTitle: "Everything goes on - Porter Robinson",
  syncronizeLyrics: [],
  background: {
    video: "https://static.moewalls.com/videos/preview/2022/star-guardian-akali-and-kaisa-league-of-legends-preview.mp4"
  },
  ytmMusicInfo: '',
  ytmThumbnail: '',
  searchLyricsIndex: 0,
};
const compositionId = 'MusicLyrics';

if (inputProps.background === 'default') {
  inputProps.background = await fetch('https://sebelasempat.hitam.id/api/randomWallpaper').then(a => a.json()).then(a => a.background);
  console.log(inputProps.background);
};

// await downloadMusicFile(inputProps.musicTitle);

// const backgroundQueries = ['lifestyle', 'sky', 'stars'];
// const backgroundQuery = backgroundQueries[Math.floor(Math.random() * backgroundQueries.length)];

// const background = await fetch('https://api.ryzendesu.vip/api/search/wallpaper-moe?query=' + backgroundQuery, {
//   headers: {
//     "Accept": 'application/json',
//     "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36"
//   }
// })
//   .then(res => res.json()).then(data => data.result[Math.floor(Math.random() * data.result.length)].wallpaper);
// console.log(background);
// inputProps.background = background;

console.log('Bundle...');

const bundleLocation = await bundle({
  entryPoint: path.resolve('./src/index.ts'),
  webpackOverride: (config) => config,
});

console.log('Bundle selesai!');
console.log('Memulai rendering Thumbnail...');

const composition = await selectComposition({
  serveUrl: bundleLocation,
  id: compositionId,
  inputProps,
});

await renderStill({
  composition: await selectComposition({
    serveUrl: bundleLocation,
    id: 'MusicThumbnail',
    inputProps,
  }),
  serveUrl: bundleLocation,
  output: `out/MusicThumbnail - ${inputProps.musicTitle}.png`,
  inputProps,
  scale: 1 / 2,
});

console.log('Thumbnail dibuat!');
console.log('Merender...', inputProps.musicTitle);
console.time('Waktu render');
console.log('\n\n\n\n');
await renderMedia({
  composition,
  serveUrl: bundleLocation,
  codec: 'h264',
  outputLocation: `out/${compositionId} - ${inputProps.musicTitle}.mp4`,
  inputProps,
  onProgress: (p) => {
    process.stdout.moveCursor(0, -3);
    process.stdout.clearScreenDown();
    process.stdout.write(`Stage: ${p.stitchStage}\n`);
    const estimatedMinutes = (p.renderEstimatedTime / 60000).toFixed(2);
    process.stdout.write(`Waktu estimasi: ${estimatedMinutes} menit\n`);
    process.stdout.write(`Frame di encode / Frame di render: ${p.encodedFrames} / ${p.renderedFrames}\n`);
    process.stdout.write(`Progress: ${(p.progress * 100).toFixed(2)}%`);
  },
  concurrency: 2,
  // chromiumOptions: {
  //   enableMultiProcessOnLinux: true,
  // },
  // scale: 2/3, 
});
console.log();
console.timeEnd('Waktu render');
console.log('Render done!');
