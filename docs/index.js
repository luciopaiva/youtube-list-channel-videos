
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
        for (const row of rows) {
            const fields = row.split("\t");
            const videoUrl = fields[1];
            const imgUrl = fields[fields.length - 1];

            const anchor = document.createElement("a");
            anchor.setAttribute("href", videoUrl);

            const img = document.createElement("img");
            img.setAttribute("src", imgUrl);

            anchor.appendChild(img);
            document.body.appendChild(anchor);
        }
    }
}

window.addEventListener("load", () => new App());
