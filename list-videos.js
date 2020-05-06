
const fs = require("fs");
const axios = require("axios");

const channelUploadPlaylistId = "UUQRPDZMSwXFEDS67uc7kIdg";

/**
 * @return {{apiKey: String}}
 */
function loadConfig() {
    try {
        const configFile = JSON.parse(fs.readFileSync("config.json", "utf-8"));

        if (!configFile?.apiKey) {
            console.error("Missing API key");
            process.exit(1);
        }

        return configFile;
    } catch(e) {
        console.error("Error opening config.json");
        process.exit(1);
    }
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

    let nextPageToken = undefined;
    do {
        let videos;
        // fetch next page
        [videos, nextPageToken] = await getPlaylistVideosPage(config, channelUploadPlaylistId, nextPageToken);

        // dump videos to stdout
        for (const video of videos) {
            const id = video.contentDetails?.videoId;
            const publishedAt = video.contentDetails?.videoPublishedAt;
            const title = video.snippet?.title;

            console.info(`${publishedAt}\t${title}\thttps://www.youtube.com/watch?v=${id}`);
        }
    } while (nextPageToken && nextPageToken.length > 0);
}

main();