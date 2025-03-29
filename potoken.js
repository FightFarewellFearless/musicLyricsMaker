import { Innertube } from 'youtubei.js';
import { BG } from 'bgutils-js';
import { JSDOM } from 'jsdom';

const dom = new JSDOM();

Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document
});


const yt = await Innertube.create({ retrieve_player: false });
const requestKey = "O43z0dpjhgX20SCx4KAo";
const visitorData = yt.session.context.client.visitorData;

const bgConfig = {
    fetch: (...params) => fetch(...params),
    globalObj: globalThis,
    identifier: visitorData,
    requestKey
};
BG.Challenge.create(bgConfig).then(async (bg) => {
    if (!bg) throw new Error("Could not get challenge");
    const interpreterJavascript = bg.interpreterJavascript.privateDoNotAccessOrElseSafeScriptWrappedValue;
    console.log(interpreterJavascript);
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
    console.log(poTokenResult.poToken);
});