const fs = require('fs');
const google = require('googleapis').google;
const props = require('./props.json');
const { OAuth2 } = google.auth;
require('dotenv').config();
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
            body: fs.createReadStream('./video/workflow_output/thumbnail.png'), // Path to your thumbnail image
        },
    });

    console.log('Thumbnail uploaded:', thumbnailRes.data);
    console.log(res.data);
}

const description = `Check out "${props.musicTitle}"! 
Hope you enjoy it as much as we loved making it.`;

uploadVideo(props.musicTitle + ' (Lyrics)', description, fs.createReadStream('./video/video.mp4'));