const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

// Basis-route om te testen of de server online is
app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({ status: "online", message: "SoundCloud Proxy draait succesvol!" });
});

// Universele zoekroute voor Roblox
app.get('/search-track/:query', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    try {
        const { query } = req.params;
        console.log(`[SoundCloud Proxy] Nieuwe zoekopdracht ontvangen: "${query}"`);

        const searchUrl = `https://soundcloud.com{encodeURIComponent(query)}&client_id=IL7Y7egZas9X4vG6uu6VpUvT8p6WkM7Y&limit=1`;
        
        const searchResponse = await axios.get(searchUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });

        const collection = searchResponse.data?.collection;

        if (!collection || collection.length === 0) {
            return res.status(200).json({ success: false, message: "Nummer niet gevonden op SoundCloud." });
        }

        const trackData = collection[0];
        const finalAudioUrl = `https://soundcloud.com{trackData.id}/stream?client_id=IL7Y7egZas9X4vG6uu6VpUvT8p6WkM7Y`;

        return res.status(200).json({
            success: true,
            title: trackData.title || "Onbekende Titel",
            artist: trackData.user?.username || "Onbekende Artiest",
            audioUrl: finalAudioUrl
        });

    } catch (error) {
        return res.status(200).json({ success: false, message: "Fout op de server.", error: error.message });
    }
});

// ==================== ⏰ DE FIX: SELF-PING (WAKKER HOUDEN) ====================
// Vul hier jouw exacte Render URL in (ZONDER schuine streep op het einde)
const JOUW_RENDER_URL = "https://onrender.com";

setInterval(async () => {
    try {
        // De server stuurt elke 10 minuten een klein verzoek naar zichzelf
        await axios.get(JOUW_RENDER_URL);
        console.log("[Keep-Alive] Succesvol een ping naar onszelf gestuurd om wakker te blijven!");
    } catch (error) {
        console.error("[Keep-Alive] Ping mislukt, maar de server is in ieder geval actief:", error.message);
    }
}, 10 * 60 * 1000); // 10 minuten in milliseconden
// ==============================================================================

app.listen(PORT, () => {
    console.log(`[SoundCloud Proxy] Server draait succesvol op poort ${PORT}`);
});
