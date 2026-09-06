const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

const CLIENT_ID = "IL7Y7egZas9X4vG6uu6VpUvT8p6WkM7Y";

app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ success: true, message: "SoundCloud Audio Link Proxy is online!" });
});

// De endpoint die een volledige SoundCloud URL ontleedt naar audio en metadata
app.get('/resolve', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    try {
        const targetUrl = req.query.url;
        if (!targetUrl) {
            return res.status(200).json({ success: false, message: "Geen URL meegegeven (?url=...)" });
        }

        console.log(`[Proxy] Bezig met resolven van link: "${targetUrl}"`);
        const cleanUrl = decodeURIComponent(targetUrl).trim();

        // Vraag de data rechtstreeks op bij SoundCloud's hoofd-resolver
        const resolveApiUrl = `https://soundcloud.com{encodeURIComponent(cleanUrl)}&client_id=${CLIENT_ID}`;
        const response = await axios.get(resolveApiUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });

        const trackData = response.data;
        if (!trackData || !trackData.id) {
            return res.status(200).json({ success: false, message: "Link kon niet worden opgelost." });
        }

        // Genereer de directe MP3 audio-omleiding
        const finalAudioUrl = `https://api.soundcloud.com/tracks/${trackData.id}/stream?client_id=${CLIENT_ID}`;
        
        // Pak de albumhoes (artwork), fallback naar gebruikersfoto indien leeg
        let artworkUrl = trackData.artwork_url || trackData.user?.avatar_url || "";
        if (artworkUrl && artworkUrl.includes('-large.')) {
            artworkUrl = artworkUrl.replace('-large.', '-t500x500.'); // Maak de hoes scherper (HQ)
        }

        return res.status(200).json({
            success: true,
            title: trackData.title || "Onbekend Nummer",
            artist: trackData.user?.username || "Onbekende Artiest",
            duration: trackData.duration || 0, // In milliseconden
            coverUrl: artworkUrl,
            audioUrl: finalAudioUrl
        });

    } catch (error) {
        console.error("[Proxy] Fout bij resolven:", error.message);
        return res.status(200).json({ success: false, message: "Fout bij ophalen van SoundCloud link." });
    }
});

// Hou Render 24/7 online
setInterval(async () => {
    try { await axios.get(`https://soundcloud-proxy-1mj0.onrender.com/`); } catch (e) {}
}, 10 * 60 * 1000);

app.listen(PORT, () => console.log(`[Proxy] Actief op poort ${PORT}`));
