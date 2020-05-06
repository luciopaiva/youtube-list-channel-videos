
// https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=UCQRPDZMSwXFEDS67uc7kIdg&key=[YOUR_API_KEY]

//GET https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=UCQRPDZMSwXFEDS67uc7kIdg&key=[YOUR_API_KEY] HTTP/1.1
//
// Authorization: Bearer [YOUR_ACCESS_TOKEN]
// Accept: application/json

//GET https://www.googleapis.com/youtube/v3/playlistItems?part=snippet%2CcontentDetails&maxResults=50&playlistId=UUQRPDZMSwXFEDS67uc7kIdg&key=[YOUR_API_KEY] HTTP/1.1
//
// Authorization: Bearer [YOUR_ACCESS_TOKEN]
// Accept: application/json

const fs = require("fs");
const axios = require("axios");

const channelUploadPlaylistId = "UUQRPDZMSwXFEDS67uc7kIdg";

function loadConfig() {
    let configFile;
    try {
        configFile = JSON.parse(fs.readFileSync("config.json", "utf-8"));
    } catch(e) {
        console.error("Error opening config.json");
        process.exit(1);
    }

    if (!configFile?.apiKey) {
        console.error("Missing API key");
        process.exit(1);
    }

    return configFile;
}

async function getPlaylistVideosPage(config, playlistId, pageToken) {
    try {
        const result = await axios.get("https://www.googleapis.com/youtube/v3/playlistItems", {
            params: {
                part: "snippet,contentDetails",
                maxResults: 50,
                playlistId: playlistId,
                ...(pageToken && {pageToken}),
                key: config.apiKey
            }
        });

        const videos = result?.data?.items;
        const nextPageToken = result?.data?.nextPageToken;

        if (!Array.isArray(videos)) {
            console.error("Could not retrieve list of videos");
            process.exit(1);
        }

        return [videos, nextPageToken];
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

async function main() {
    const config = loadConfig();

    // const result1 = await axios.get("https://www.googleapis.com/youtube/v3/channels", {
    //     params: {
    //         part: "contentDetails",
    //         id: channelUploadPlaylistId,
    //         key: config.apiKey
    //     }
    // });
    //
    // const uploadPlaylistId = result1?.data?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    // console.info(uploadPlaylistId);

    // const uploadPlaylistId = channelUploadPlaylistId;
    //
    // const result2 = await axios.get("https://www.googleapis.com/youtube/v3/playlistItems", {
    //     params: {
    //         part: "snippet,contentDetails",
    //         maxResults: 50,
    //         // id: channelUploadPlaylistId,
    //         playlistId: uploadPlaylistId,
    //         key: config.apiKey
    //     }
    // });
    //
    // const videos = result2?.data?.items;
    // if (!Array.isArray(videos)) {
    //     console.error("Could not retrieve list of videos");
    //     process.exit(1);
    // }

    let nextPageToken = undefined;
    do {
        let videos;
        [videos, nextPageToken] = await getPlaylistVideosPage(config, channelUploadPlaylistId, nextPageToken);

        for (const video of videos) {
            const id = video.contentDetails?.videoId;
            const publishedAt = video.contentDetails?.videoPublishedAt;
            const title = video.snippet?.title;

            console.info(`${publishedAt}\t${title}\thttps://www.youtube.com/watch?v=${id}`);
        }
    } while (nextPageToken && nextPageToken.length > 0);
}

main();
