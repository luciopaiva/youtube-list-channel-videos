
const fs = require("fs");
const axios = require("axios");

const ERROR = 1;
const RESULTS_PER_PAGE = 50;  // max permitted by the API

class Video {
    /** @type {String} */
    id;
    /** @type {String} */
    videoUrl;
    /** @type {String} */
    publishedAt;
    /** @type {String} */
    title;
    /** @type {String} */
    thumbnailUrl;

    toString() {
        return [this.id, this.videoUrl, this.publishedAt, this.title, this.thumbnailUrl].join("\t");
    }

    static getHeaders() {
        return ["id", "url", "publishedAt", "title", "thumbnail"].join("\t");
    }
}

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
        /** @type {Video[]} */
        const videos = [];

        let nextPageToken = undefined;
        do {
            let rawVideos;
            // fetch next page
            [rawVideos, nextPageToken] = await this.getPlaylistVideosPage(nextPageToken);
            if (rawVideos.length === 0) {
                console.warn("Page returned empty list of rawVideos!");
            }

            // map data to video objects
            for (const rawVideo of rawVideos) {
                const video = new Video();

                // check https://developers.google.com/youtube/v3/docs/playlistItems for field descriptions
                video.id = rawVideo.contentDetails?.videoId;
                video.publishedAt = rawVideo.contentDetails?.videoPublishedAt;
                video.title = rawVideo.snippet?.title;
                // valid thumbnail sizes:
                // default (120x90), medium (320x180), high (480x360), standard (640x480), maxres (1280x720)
                video.thumbnailUrl = rawVideo.snippet?.thumbnails?.medium?.url;
                video.videoUrl = `https://www.youtube.com/watch?v=${video.id}`;

                videos.push(video);
            }

            videos.sort((a, b) => a.publishedAt.localeCompare(b.publishedAt));

            this.videoCount += rawVideos.length;
            const percent = 100 * this.videoCount / this.totalVideoCount;
            console.info(`${percent.toFixed(0)}% (${this.videoCount}/${this.totalVideoCount})`);

        } while (nextPageToken?.length > 0);

        const fileName = `${playlistId}.tsv`;
        const lines = [Video.getHeaders()];
        videos.forEach(video => lines.push(video.toString()));
        fs.writeFileSync(fileName, lines.join("\n"));
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
