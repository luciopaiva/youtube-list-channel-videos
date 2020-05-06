
const fs = require("fs");
const axios = require("axios");

const ERROR = 1;
const RESULTS_PER_PAGE = 50;  // max permitted by the API

class ListVideos {

    /** @type {String} */
    apiKey;
    /** @type {String} */
    playlistId;

    videoCount = 0;
    totalVideoCount = 0;

    constructor(playlistId) {
        this.playlistId = playlistId;

        this.getApiKeyFromConfigFile();
    }

    /**
     * @return {String}
     */
    getApiKeyFromConfigFile() {
        try {
            const configFile = JSON.parse(fs.readFileSync("config.json", "utf-8"));

            if (!configFile?.["apiKey"]) {
                console.error("File config.json is missing API key - check README.md for instructions");
                process.exit(ERROR);
            }

            this.apiKey = configFile["apiKey"];
        } catch(e) {
            console.error("Error opening config.json - check README.md for instructions");
            process.exit(1);
        }
    }

    async getPlaylistVideosPage(pageToken) {
        try {
            const result = await axios.get("https://www.googleapis.com/youtube/v3/playlistItems", {
                params: {
                    part: "snippet,contentDetails",
                    maxResults: RESULTS_PER_PAGE,
                    playlistId: this.playlistId,
                    ...(pageToken && {pageToken}),  // include page token if one was passed
                    key: this.apiKey
                }
            });

            const data = result?.data;
            const videos = data?.items;
            const nextPageToken = data?.nextPageToken;
            const pageInfo = data?.pageInfo;
            this.totalVideoCount = pageInfo?.totalResults;

            if (!Array.isArray(videos)) {
                console.error("Could not retrieve list of videos");
                process.exit(ERROR);
            }

            return [videos, nextPageToken];
        } catch (e) {
            console.error(e);
            process.exit(ERROR);
        }
    }

    /** @return {void} */
    async run() {
        const records = [["id", "url", "publishedAt", "title", "thumbnail"].join("\t")];
        let nextPageToken = undefined;
        do {
            let videos;
            // fetch next page
            [videos, nextPageToken] = await this.getPlaylistVideosPage(nextPageToken);

            // dump videos to stdout
            for (const video of videos) {
                // check https://developers.google.com/youtube/v3/docs/playlistItems for field descriptions
                const id = video.contentDetails?.videoId;
                const publishedAt = video.contentDetails?.videoPublishedAt;
                const title = video.snippet?.title;
                // valid thumbnail sizes:
                // default (120x90), medium (320x180), high (480x360), standard (640x480), maxres (1280x720)
                const thumbnailUrl = video.snippet?.thumbnails?.medium?.url;

                const videoUrl = `https://www.youtube.com/watch?v=${id}`;
                const fields = [id, videoUrl, publishedAt, title, thumbnailUrl];
                records.push(fields.join("\t"));
            }

            this.videoCount += videos.length;
            const percent = 100 * this.videoCount / this.totalVideoCount;
            console.info(`${percent.toFixed(0)}%`);

        } while (nextPageToken?.length > 0);

        const fileName = `${playlistId}.tsv`;
        fs.writeFileSync(fileName, records.join("\n"));
        console.info(`Video count: ${this.videoCount}`);
        console.info(`File saved: "${fileName}"`);
    }
}

const playlistId = process.argv[2];
if (typeof playlistId !== "string" || playlistId.length === 0) {
    console.error("Missing argument 'channel-id'");
    process.exit(ERROR);
}

const app = new ListVideos(playlistId);
app.run();
