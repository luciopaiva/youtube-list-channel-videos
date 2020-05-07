
class App {

    constructor() {
        this.start();
    }

    /** @return {void} */
    async start() {
        const response = await fetch("UUQRPDZMSwXFEDS67uc7kIdg.tsv");
        const tsv = await response.text();
        const rows = tsv.split("\n").slice(1);
        this.processRows(rows);
    }

    processRows(rows) {
        const thumbnails = /** @type {String[]} */ rows
            .map(row => row.split("\t"))
            .map(fields => fields[fields.length - 1]);

        for (const url of thumbnails) {
            const img = document.createElement("img");
            img.setAttribute("src", url);
            document.body.appendChild(img);
        }
    }
}

window.addEventListener("load", () => new App());
