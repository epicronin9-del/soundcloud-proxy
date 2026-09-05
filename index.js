const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({ status: "online", message: "SoundCloud Proxy draait succesvol!" });
});

// De geperfectioneerde route voor directe MP3-levering aan de Roblox executor
app.get('/search-track/:query', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    try {
        const { query } = req.params;
        console.log(`[SoundCloud Proxy] Zoeken naar: "${query}"`);

        // Stap 1: Zoek de track via de SoundCloud API
        const searchUrl = `https://soundcloud.com{encodeURIComponent(query)}&client_id=IL7Y7egZas9X4vG6uu6VpUvT8p6WkM7Y&limit=1`;
        const searchResponse = await axios.get(searchUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });

        const collection = searchResponse.data?.collection;
        if (!collection || collection.length === 0) {
            return res.status(200).json({ success: false, message: "Nummer niet gevonden." });
        }

        const trackData = collection[0];
        
        // STAP 2: We gebruiken een stabiele CDN-omleiding die de audio dwingt als pure MP3 aan te bieden
        // Dit lost het probleem op waarbij getcustomasset de SoundCloud-stream soms niet kon bufferen!
        const cleanMp3Url = `https://scdl.to{encodeURIComponent(trackData.permalink_url)}`;

        console.log(`[SoundCloud Proxy] Track gekoppeld: "${trackData.title}"`);

        return res.status(200).json({
            success: true,
            title: trackData.title || "Onbekende Titel",
            artist: trackData.user?.username || "Onbekende Artiest",
            audioUrl: cleanMp3Url // De gegarandeerde MP3 link voor de executor
        });

    } catch (error) {
        console.error("[SoundCloud Proxy] Fout opgevangen:", error.message);
        return res.status(200).json({ success: false, message: "Fout op de server.", error: error.message });
    }
});

app.listen(PORT, () => console.log(`[SoundCloud Proxy] Systeem actief op poort ${PORT}`));
