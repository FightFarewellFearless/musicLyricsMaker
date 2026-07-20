/* eslint-disable no-undef */
import { bundle } from '@remotion/bundler';
import { renderMedia, renderStill, selectComposition } from '@remotion/renderer';
import path from 'path';
import fs from 'fs';

console.log('Memulai rendering...');
const inputProps = JSON.parse(fs.readFileSync('./props.json', 'utf8'));
const compositionId = 'MusicLyrics';

if (inputProps.background === 'default') {
  inputProps.background = await fetch('https://sebelasempat.hitam.id/api/randomWallpaper').then(a => a.json()).then(a => a.background);
  console.log(inputProps.background);
};

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

const firstTrackTitle = inputProps.tracks?.[0]?.musicTitle || 'Compilation';
const thumbnailProps = {
  musicTitle: inputProps.musicTitle || `Best Songs Compilation`,
  background: inputProps.background,
  tracksData: inputProps.tracks
};

await renderStill({
  composition: await selectComposition({
    serveUrl: bundleLocation,
    id: 'MusicThumbnail',
    inputProps: thumbnailProps,
  }),
  serveUrl: bundleLocation,
  output: `out/MusicThumbnail - Compilation.png`,
  inputProps: thumbnailProps,
  scale: 1 / 2,
});

console.log('Thumbnail dibuat!');
console.log('Merender...', firstTrackTitle);
console.time('Waktu render');
console.log('\n\n\n\n');
await renderMedia({
  composition,
  serveUrl: bundleLocation,
  codec: 'h264',
  outputLocation: `out/${compositionId} - Compilation.mp4`,
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
});
console.log();
console.timeEnd('Waktu render');
console.log('Render done!');
