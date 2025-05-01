import trr from 'googletrans';
const tr = trr.default;


/**
 * 
 * @param {string} lyricsSource 
 * @returns {Promise<boolean>}
 */
export async function checkRomanizationIsNeeded(lyricsSource) {
  const translate = await tr(lyricsSource);
  // @ts-ignore
  const shouldRomanize = !!translate.raw[0]?.[translate.raw[0].length - 1]?.[3];
  return shouldRomanize;
}

/**
 * 
 * @param {{start: number;text: string}[]} lyricsSource
 * 
 * @returns {Promise<{start: number;text: string}[]>}
 */
export async function romanize(lyricsSource) {
  const syncronizeLyrics = JSON.parse(JSON.stringify(lyricsSource));
  for (let i = 0; i < syncronizeLyrics.length; i++) {
    try {
      const romanize = await tr(syncronizeLyrics[i].text);
      // @ts-ignore
      syncronizeLyrics[i].text = romanize.raw[0]?.[romanize.raw[0].length - 1]?.[3] ?? syncronizeLyrics[i].text;
    } catch { }
  }
  return syncronizeLyrics;
}

/**
 * 
 * @param {{start: number;text: string}[]} lyricsSource
 * @param {string | undefined} to 
 * 
 * @returns {Promise<{start: number;text: string}[]>}
 */
export async function translateLyric(lyricsSource, to) {
  const syncronizeLyrics = JSON.parse(JSON.stringify(lyricsSource));
  for (let i = 0; i < syncronizeLyrics.length; i++) {
    try {
      const translate = await tr(syncronizeLyrics[i].text, to);
      // @ts-ignore
      syncronizeLyrics[i].text = translate.text ?? syncronizeLyrics[i].text;
    } catch { }
  }
  return syncronizeLyrics;
}