const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

// Ultra-stabiele route die ALTIJD geldige JSON teruggeeft aan Roblox
app.get('/search-track/:query', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    try {
        const { query } = req.params;
        console.log(`[SoundCloud Proxy] Nieuwe zoekopdracht ontvangen: "${query}"`);

        // We gebruiken een publieke SoundCloud-zoekvriendelijke API om resultaten te scrapen
        const searchUrl = `https://soundcloud.com{encodeURIComponent(query)}&client_id=IL7Y7egZas9X4vG6uu6VpUvT8p6WkM7Y&limit=1`;
        
        const searchResponse = await axios.get(searchUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });

        const collection = searchResponse.data?.collection;

        if (!collection || collection.length === 0) {
            console.log(`[SoundCloud Proxy] Geen tracks gevonden voor: "${query}"`);
            return res.status(200).json({ 
                success: false, 
                message: "Nummer niet gevonden op SoundCloud." 
            });
        }

        const trackData = collection[0];
        
        // Directe en betrouwbare opbouw van de stream-URL via SoundCloud's publieke CDN-omleiding
        const finalAudioUrl = `https://soundcloud.com{trackData.id}/stream?client_id=IL7Y7egZas9X4vG6uu6VpUvT8p6WkM7Y`;

        console.log(`[SoundCloud Proxy] Match gevonden: "${trackData.title}" (ID: ${trackData.id})`);

        return res.status(200).json({
            success: true,
            title: trackData.title || "Onbekende Titel",
            artist: trackData.user?.username || "Onbekende Artiest",
            audioUrl: finalAudioUrl
        });

    } catch (error) {
        console.error("[SoundCloud Proxy] Fout opgevangen:", error.message);
        // Veilige JSON-fallback: we zorgen dat het script NOOIT HTML terugstuurt bij een fout
        return res.status(200).json({
            success: false,
            message: "Fout op de server.",
            error: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`[SoundCloud Proxy] Server draait succesvol op poort ${PORT}`);
});
