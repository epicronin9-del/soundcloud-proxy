const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

// Basis-route: Als je deze link in je browser opent MOET je dit zien!
app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ status: "online", message: "Proxy is live!" });
});

// De universele zoekroute voor Roblox
app.get('/search-track/:query', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    try {
        const { query } = req.params;
        console.log(`[SoundCloud Proxy] Zoeken naar: "${query}"`);

        // Een actieve, publieke SoundCloud ClientID
        const CLIENT_ID = "IL7Y7egZas9X4vG6uu6VpUvT8p6WkM7Y";

        const searchUrl = `https://soundcloud.com{encodeURIComponent(query)}&client_id=${CLIENT_ID}&limit=1`;
        
        const searchResponse = await axios.get(searchUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });

        const collection = searchResponse.data?.collection;

        if (!collection || collection.length === 0) {
            return res.status(200).json({ success: false, message: "Nummer niet gevonden op SoundCloud." });
        }

        const trackData = collection[0]; // Pak het eerste resultaat
        const finalAudioUrl = `https://soundcloud.com{trackData.id}/stream?client_id=${CLIENT_ID}`;

        console.log(`[SoundCloud Proxy] Succesvol gekoppeld: "${trackData.title}"`);

        return res.status(200).json({
            success: true,
            title: trackData.title || "Onbekende Titel",
            audioUrl: finalAudioUrl
        });

    } catch (error) {
        console.error("[SoundCloud Proxy] Fout in route:", error.message);
        return res.status(200).json({ success: false, message: "Server verwerkingsfout." });
    }
});

// ==================== ⏰ VEILIGE SELF-PING ====================
// Deze eenvoudige wekker crasht NOOIT, wat er ook gebeurt
setInterval(async () => {
    try {
        await axios.get(`https://onrender.com`);
        console.log("[Keep-Alive] Ping succesvol!");
    } catch (e) {
        console.log("[Keep-Alive] Tikje mislukt, server slaapt nog.");
    }
}, 10 * 60 * 1000); // Elke 10 minuten
// ==============================================================

app.listen(PORT, () => {
    console.log(`[SoundCloud Proxy] Server draait succesvol op poort ${PORT}`);
});
