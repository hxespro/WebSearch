import express from "express";
import puppeteer from "puppeteer";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let browser;

// 🔥 Reuse one browser instance (important for speed)
async function getBrowser() {
    if (!browser) {
        browser = await puppeteer.launch({
            headless: "new",
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox"
            ]
        });
    }
    return browser;
}

// Home page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "start.html"));
});

// 🚀 REAL BROWSER PROXY
app.get("/proxy", async (req, res) => {
    const targetUrl = req.query.url;

    if (!targetUrl) {
        return res.status(400).send("Missing ?url=");
    }

    let page;

    try {
        const browser = await getBrowser();
        page = await browser.newPage();

        // Pretend to be real Chrome
        await page.setUserAgent(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
        );

        await page.setViewport({ width: 1280, height: 800 });

        // Go to site and wait until fully loaded
        await page.goto(targetUrl, {
            waitUntil: "networkidle2",
            timeout: 30000
        });

        // Get fully rendered page (after JS runs)
        const html = await page.content();

        await page.close();

        res.send(html);

    } catch (err) {
        if (page) await page.close();
        res.status(500).send("Proxy error: " + err.toString());
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Proxy browser running at http://localhost:${PORT}`);
});
