import express from "express";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// serve the index.html page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "start.html"));
});

// main proxy route
app.get("/proxy", async (req, res) => {
    const targetUrl = req.query.url;

    if (!targetUrl) {
        return res.status(400).send("Missing ?url=");
    }

    try {
        const response = await fetch(targetUrl);
        const contentType = response.headers.get("content-type");

        res.set("Content-Type", contentType);
        const body = await response.text();

        res.send(body);
    } catch (err) {
        res.status(500).send("Error fetching requested site: " + err.toString());
    }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
