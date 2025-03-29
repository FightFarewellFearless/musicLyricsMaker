import { Innertube } from 'youtubei.js';
import { BG } from 'bgutils-js';
import { JSDOM } from 'jsdom';

const dom = new JSDOM();

Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document
});


const yt = await Innertube.create({ retrieve_player: false, client_type: 'WEB_CREATOR' });
const requestKey = "O43z0dpjhgX20SCx4KAo";
const visitorData = yt.session.context.client.visitorData;

const bgConfig = {
    fetch: (...params) => fetch(...params),
    globalObj: globalThis,
    identifier: visitorData,
    requestKey
};
const pot = await BG.Challenge.create(bgConfig).then(async (bg) => {
    if (!bg) throw new Error("Could not get challenge");
    const interpreterJavascript = bg.interpreterJavascript.privateDoNotAccessOrElseSafeScriptWrappedValue;
    if (interpreterJavascript) {
        new Function(interpreterJavascript)();
    } else throw new Error("Could not get interpreterJavascript");

    const poTokenResult = await BG.PoToken.generate({
        program: bg.program,
        globalName: bg.globalName,
        bgConfig
    });

    if (!poTokenResult.poToken) {
        throw new Error("Could not get poToken");
    }
    return (poTokenResult.poToken);
});

console.log(pot, visitorData)