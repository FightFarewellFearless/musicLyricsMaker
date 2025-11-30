import { createReadStream } from 'fs';
import { google } from 'googleapis';
import props from './props.json' with { type: "json" };
import synchronizeLyrics from './public/syncronizeLyrics.json' with { type: "json" };
import dotenv from 'dotenv';
dotenv.config();
const { OAuth2 } = google.auth;
const oauth2client = new OAuth2(process.env.CLIENT_ID, process.env.CLIENT_SECRET, process.env.REDIRECT_URI);
oauth2client.setCredentials({
    refresh_token: process.env.REFRESH_TOKEN
})

async function uploadVideo(title, description, video) {
    const youtube = google.youtube({
        version: 'v3',
        auth: oauth2client
    });

    const res = await youtube.videos.insert({
        part: 'snippet,status',
        requestBody: {
            snippet: {
                title: title,
                description: description,
                categoryId: '10', // Music
            },
            status: {
                privacyStatus: 'public'
            }
        },
        media: {
            body: video,
        }
    });

    // Add thumbnail after video upload
    const videoId = res.data.id;
    const thumbnailRes = await youtube.thumbnails.set({
        videoId: videoId,
        media: {
            body: createReadStream('./video/workflow_output/thumbnail.png'), // Path to your thumbnail image
        },
    });

    console.log('Thumbnail uploaded:', thumbnailRes.data);
    console.log(res.data);
}

const description = `
${props.musicTitle}
Lyrics:
${synchronizeLyrics.map(line => line.text).join('\n')}

Don't forget to like, comment, and subscribe for more music videos!
#lyrics #music
`;

uploadVideo(props.musicTitle + ' (Lyrics)', description, createReadStream('./video/video.mp4'));