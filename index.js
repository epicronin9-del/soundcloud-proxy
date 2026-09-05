const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

// Basis-route: Test direct via je browser!
app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ success: true, message: "Proxy is officieel live en stabiel!" });
});

// De stabiele zoekroute die werkt met Query Parameters (?q=...)
app.get('/search', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    try {
        const query = req.query.q;
        
        // Als er geen zoekterm is, crashen we niet, maar sturen we netjes een melding
        if (!query) {
            return res.status(200).json({ success: false, message: "Geen zoekterm ingevoerd." });
        }

        console.log(`[SoundCloud Proxy] Zoekopdracht ontvangen voor: "${query}"`);

        // Publieke en geteste SoundCloud ClientID
        const CLIENT_ID = "IL7Y7egZas9X4vG6uu6VpUvT8p6WkM7Y";
        const searchUrl = `https://soundcloud.com{encodeURIComponent(query)}&client_id=${CLIENT_ID}&limit=1`;
        
        const searchResponse = await axios.get(searchUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });

        const collection = searchResponse.data?.collection || [];

        if (collection.length === 0) {
            console.log(`[SoundCloud Proxy] Niets gevonden voor: "${query}"`);
            return res.status(200).json({ success: false, message: "Nummer niet gevonden op SoundCloud." });
        }

        const trackData = collection[0]; // Pak veilig het eerste resultaat uit de lijst
        const finalAudioUrl = `https://soundcloud.com{trackData.id}/stream?client_id=${CLIENT_ID}`;

        console.log(`[SoundCloud Proxy] Succesvol gekoppeld: "${trackData.title}" (ID: ${trackData.id})`);

        return res.status(200).json({
            success: true,
            title: trackData.title || query,
            audioUrl: finalAudioUrl
        });

    } catch (error) {
        console.error("[SoundCloud Proxy] Fout opgevangen tijdens het zoeken:", error.message);
        // We sturen ALTIJD geldige JSON terug, zodat Roblox nooit meer over HTML struikelt
        return res.status(200).json({ success: false, message: "Server verwerkingsfout bij zoeken." });
    }
});

// Start de server veilig op
app.listen(PORT, () => {
    console.log(`[SoundCloud Proxy] Systeem succesvol opgestart op poort ${PORT}`);
});
