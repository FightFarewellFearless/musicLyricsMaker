import Youtube from 'youtube-api';
import fs from 'fs';

import props from './props.json' with { type: "json" };

Youtube.authenticate({
    type: "key"
  , key: process.env.YTAPI
});
// // Load credentials
// const youtube = google.youtube({
//     version: 'v3',
//     auth: {
//         apiKey: process.env.YTAPI
//     }
// });

const videoPath = './out/Kazam_screencast_00000.mp4';
const thumbnailPath = './video/workflow_output/thumbnail.png';

async function uploadVideo() {
    try {
        const response = await Youtube.videos.insert({
            part: 'snippet,status',
            requestBody: {
                snippet: {
                    title: props.title,
                },
                status: {
                    privacyStatus: 'public', // 'private', 'unlisted', or 'public'
                },
            },
            media: {
                body: fs.createReadStream(videoPath),
            },
        });

        console.log('Video uploaded successfully:', response.data);
        const videoId = response.data.id;

        // Upload Thumbnail
        await uploadThumbnail(videoId);
    } catch (error) {
        console.error('Error uploading video:', error);
    }
}

async function uploadThumbnail(videoId) {
    try {
        const response = await Youtube.thumbnails.set({
            videoId: videoId,
            media: {
                mimeType: 'image/png', // Ensure correct MIME type
                body: fs.createReadStream(thumbnailPath),
            },
        });

        console.log('Thumbnail uploaded successfully:', response.data);
    } catch (error) {
        console.error('Error uploading thumbnail:', error);
    }
}

uploadVideo();
