
const fs = require("fs");
const axios = require("axios");

/**
 * @return {String}
 */
function getApiKeyFromConfigFile() {
    try {
        const configFile = JSON.parse(fs.readFileSync("config.json", "utf-8"));

        if (!configFile?.["apiKey"]) {
            console.error("File config.json is missing API key - check README.md for instructions");
            process.exit(1);
        }

        return configFile["apiKey"];
    } catch(e) {
        console.error("Error opening config.json - check README.md for instructions");
        process.exit(1);
    }
}

async function getPlaylistVideosPage(apiKey, playlistId, pageToken) {
    try {
        const result = await axios.get("https://www.googleapis.com/youtube/v3/playlistItems", {
            params: {
                part: "snippet,contentDetails",
                maxResults: 50,  // max permitted by the API
                playlistId: playlistId,
                ...(pageToken && {pageToken}),  // include page token if one was passed
                key: apiKey
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

/** @return {void} */
async function main(args) {
    if (typeof args[0] !== "string" || args[0].length === 0) {
        console.error("Missing argument 'channel-id'");
        process.exit(1);
    }
    const playlistId = args[0];

    const apiKey = getApiKeyFromConfigFile();

    let nextPageToken = undefined;
    do {
        let videos;
        // fetch next page
        [videos, nextPageToken] = await getPlaylistVideosPage(apiKey, playlistId, nextPageToken);

        // dump videos to stdout
        for (const video of videos) {
            const id = video.contentDetails?.videoId;
            const publishedAt = video.contentDetails?.videoPublishedAt;
            const title = video.snippet?.title;

            console.info(`${publishedAt}\t${title}\thttps://www.youtube.com/watch?v=${id}`);
        }
    } while (nextPageToken?.length > 0);
}

main(process.argv.slice(2));
