const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ status: "online", message: "Proxy is live!" });
});

// De verbeterde zoekroute die dieper zoekt op SoundCloud
app.get('/search-track/:query', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    try {
        const { query } = req.params;
        console.log(`[SoundCloud Proxy] Zoekopdracht ontvangen voor: "${query}"`);

        // We gebruiken een stabiele, publieke SoundCloud ClientID
        const CLIENT_ID = "IL7Y7egZas9X4vG6uu6VpUvT8p6WkM7Y";

        // We proberen eerst breed te zoeken
        const searchUrl = `https://soundcloud.com{encodeURIComponent(query)}&client_id=${CLIENT_ID}&limit=3`;
        
        const searchResponse = await axios.get(searchUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });

        // Zoek binnen de resultaten specifiek naar 'tracks'
        const collection = searchResponse.data?.collection || [];
        const trackData = collection.find(item => item.kind === 'track' || item.type === 'track') || collection[0];

        if (!trackData) {
            console.log(`[SoundCloud Proxy] Echt helemaal niks gevonden voor: "${query}"`);
            return res.status(200).json({ success: false, message: "Nummer niet gevonden." });
        }

        // Bouw de directe stream-URL op via het ID van de track
        const trackId = trackData.id;
        const finalAudioUrl = `https://soundcloud.com{trackId}/stream?client_id=${CLIENT_ID}`;

        console.log(`[SoundCloud Proxy] Succesvol gekoppeld: "${trackData.title}" (ID: ${trackId})`);

        return res.status(200).json({
            success: true,
            title: trackData.title || query,
            audioUrl: finalAudioUrl
        });

    } catch (error) {
        console.error("[SoundCloud Proxy] Fout tijdens diepe zoekopdracht:", error.message);
        return res.status(200).json({ success: false, message: "Server fout bij zoeken." });
    }
});

// Zelf-wekker om Render 24/7 online te houden
setInterval(async () => {
    try {
        await axios.get(`https://onrender.com`);
    } catch (e) {}
}, 10 * 60 * 1000);

app.listen(PORT, () => console.log(`[SoundCloud Proxy] Server actief op poort ${PORT}`));
