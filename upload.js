import { Innertube } from 'youtubei.js';
import fs from 'fs';

import props from './props.json' with { type: "json" };

// const thumbnail = fs.readFileSync('./video/workflow_output/thumbnail.png');
// const video = fs.readFileSync('./video/video.mp4');
const video = fs.readFileSync('./video.mp4');

const innertube = await Innertube.create({
    // cookie: process.env.YT_COOKIE
    cookie: `GPS=1; YSC=ohV0tn_puwc; VISITOR_INFO1_LIVE=4oZNxHu2kCI; VISITOR_PRIVACY_METADATA=CgJJRBIEGgAgLg%3D%3D; __Secure-ROLLOUT_TOKEN=CLuM_qPn7cDlDRDV8u6AktyLAxjJm6OHktyLAw%3D%3D; PREF=f6=40000000&tz=Asia.Jakarta; SID=g.a000uAiuhuL22ROIGI94bwGQFpeVYpS51nixEAwSrvcE7iEHcSJ0e9G6RPYtOPFzMIDApXOuggACgYKAQESARMSFQHGX2MiKMUY2D6PowyXnO1x1hyu3RoVAUF8yKq9loENpxEyTsbjICj873ek0076; __Secure-1PSIDTS=sidts-CjEBEJ3XV0CTYwHrzyoLjWYwYr5o8IypgCqexW7CJ5WJDtHoPhDBntKzVaC0NgINCJNlEAA; __Secure-3PSIDTS=sidts-CjEBEJ3XV0CTYwHrzyoLjWYwYr5o8IypgCqexW7CJ5WJDtHoPhDBntKzVaC0NgINCJNlEAA; __Secure-1PSID=g.a000uAiuhuL22ROIGI94bwGQFpeVYpS51nixEAwSrvcE7iEHcSJ07u514Ro-k4VwYpeuBfLQwwACgYKARcSARMSFQHGX2Mi_dE1b2PH8omOZtwPZJdI6BoVAUF8yKrdHZEL1HlX9xZHIWBEj4fS0076; __Secure-3PSID=g.a000uAiuhuL22ROIGI94bwGQFpeVYpS51nixEAwSrvcE7iEHcSJ0pjcEyurIjRF7SDg9ArYJAgACgYKAfcSARMSFQHGX2Mi_KbWMlZMny_xI_FGomLbihoVAUF8yKoKidqDZNZnZz6C2N1Ex83l0076; HSID=Ag985AuQWZwvG177l; SSID=AzN8fni8w6sVbaNdn; APISID=1wJyjg-Rn8QdcMle/A4py5b6pKDzwAN2E1; SAPISID=gph90ceadAqp0OwG/AELKyMjdbzOXu5XNv; __Secure-1PAPISID=gph90ceadAqp0OwG/AELKyMjdbzOXu5XNv; __Secure-3PAPISID=gph90ceadAqp0OwG/AELKyMjdbzOXu5XNv; LOGIN_INFO=AFmmF2swRgIhALyfk5nyn6PfXjrm4mhM-qqKbo_CmLoUOG2O6n_ClP7OAiEAl2bz2P8F8fu8CSaawpV73ynGK450VTzeYviOxciO32Q:QUQ3MjNmeWdjckNzTS10LUJDS1Y4SFhWNnhzcnNTOHphNzZuQ3pXSWxNNHVjbE93MExwM1Z3aGc3dk9aY1pObkE2UDl0emkwdm1JZ3A4dkdSbXJkMURoMEprNE9vS1QtR1ozVFJURDUwYmFZVnJuMGpLeWNuZnUyM0RvX0U1RXIyZ2RNLUQ1NUc0Zl9yLXpJaTV6STk5VURjNFdzbm1JaTJn; SIDCC=AKEyXzXFDZ52iSW00NcTH5L1LFKHMRr_a6dkbIIyMBLQzw0olM68MZFcyml5azZ2GJuEw4i1; __Secure-1PSIDCC=AKEyXzXeO9DAW8foIGsJt7rrOGDBBM8Binsq8KePu-byXnvm7-Hz3qdc0bkiZzPEw-8c53VnCg; __Secure-3PSIDCC=AKEyXzWqjyPlaL4JBwVCUeAYOHK2f2KjHEyQ1RNhgOD3YQqXvwjZhVdQrI8T6jPXR3YI0yvR`
});

const videoId = await innertube.studio.upload(video.buffer, {
    // is_draft: true,
    // title: props.musicTitle,
    title: "This is test video",
    privacy: "PRIVATE",
    description: 'Hello this is a test video!'
});

console.log(
    JSON.stringify(
        videoId
        , null, 2
    )
);
