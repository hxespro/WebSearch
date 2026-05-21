const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");
const app = express();

app.use(cors());

app.get("/proxy", async (req, res) => {
    let url = req.query.url;

    if (!url) return res.status(400).send("Missing URL");

    try {
        const response = await fetch(url);
        let html = await response.text();

        // Convert relative links to absolute
        const base = new URL(url);
        html = html.replace(/href="\//g, `href="${base.origin}/`);
        html = html.replace(/src="\//g, `src="${base.origin}/`);

        res.set("Content-Type", "text/html");
        res.send(html);
    } catch (err) {
        res.status(500).send("Error: " + err.toString());
    }
});

app.listen(3000, () => console.log("Proxy running on http://localhost:3000"));
