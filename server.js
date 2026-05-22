import express from "express";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";
import cheerio from "cheerio";

const app = express();
const PORT = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve your start page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "start.html"));
});

// Rewrite absolute, relative, CSS, JS, and media URLs
function rewriteUrl(base, resource) {
    try {
        return "/proxy?url=" + encodeURIComponent(new URL(resource, base).href);
    } catch {
        return resource;
    }
}

// Main proxy route
app.get("/proxy", async (req, res) => {
    const targetUrl = req.query.url;

    if (!targetUrl) {
        return res.status(400).send("Missing ?url=");
    }

    try {
        const response = await fetch(targetUrl);
        const contentType = response.headers.get("content-type");
        res.set("Content-Type", contentType);

        // Non-HTML content (images, CSS, JS) → just stream it
        if (!contentType.includes("text/html")) {
            const buffer = await response.arrayBuffer();
            return res.send(Buffer.from(buffer));
        }

        // HTML content → rewrite it
        const html = await response.text();
        const $ = cheerio.load(html);

        // Fix links
        $("a").each((i, el) => {
            const href = $(el).attr("href");
            if (href) $(el).attr("href", rewriteUrl(targetUrl, href));
        });

        // Fix images
        $("img").each((i, el) => {
            const src = $(el).attr("src");
            if (src) $(el).attr("src", rewriteUrl(targetUrl, src));
        });

        // Fix scripts
        $("script").each((i, el) => {
            const src = $(el).attr("src");
            if (src) $(el).attr("src", rewriteUrl(targetUrl, src));
        });

        // Fix CSS files
        $("link").each((i, el) => {
            const href = $(el).attr("href");
            if (href) $(el).attr("href", rewriteUrl(targetUrl, href));
        });

        // Fix iframes
        $("iframe").each((i, el) => {
            const src = $(el).attr("src");
            if (src) $(el).attr("src", rewriteUrl(targetUrl, src));
        });

        res.send($.html());
    } catch (err) {
        res.status(500).send("Proxy error: " + err.toString());
    }
});

app.listen(PORT, () => console.log(`Proxy running → http://localhost:${PORT}`));
