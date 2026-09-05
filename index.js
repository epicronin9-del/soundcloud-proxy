const express = require('express');
const scdl = require('soundcloud-downloader').default;
const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

// Verbeterde en stabiele zoekroute
app.get('/search-track/:query', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    try {
        const { query } = req.params;
        console.log(`[SoundCloud Proxy] Zoekopdracht ontvangen voor titel: "${query}"`);

        // Veilige zoekopdracht uitvoeren op SoundCloud
        const searchResults = await scdl.search({
            query: query,
            resourceType: 'tracks',
            limit: 5 // We halen er 5 op voor de zekerheid
        });

        // Controleer heel nauwkeurig of de collectie resultaten bevat
        if (!searchResults || !searchResults.collection || searchResults.collection.length === 0) {
            console.log(`[SoundCloud Proxy] Geen resultaten gevonden voor: "${query}"`);
            return res.status(200).json({ 
                success: false, 
                message: "Nummer niet gevonden op SoundCloud." 
            });
        }

        // Pak de allereerste track uit de lijst die bruikbaar is
        const trackInfo = searchResults.collection[0];
        const trackUrl = trackInfo.permalink_url;

        if (!trackUrl) {
            return res.status(200).json({ 
                success: false, 
                message: "Track gevonden, maar bevat geen geldige URL." 
            });
        }

        console.log(`[SoundCloud Proxy] Beste match: "${trackInfo.title}" -> ${trackUrl}`);

        // Genereer de directe MP3 stream-URL die je executor nodig heeft
        let streamUrl;
        try {
            streamUrl = await scdl.downloadFormat(trackUrl, scdl.FORMATS.MP3);
        } catch (streamError) {
            console.error("[SoundCloud Proxy] Stream genereren mislukt:", streamError.message);
        }

        if (!streamUrl) {
            return res.status(200).json({
                success: false,
                message: "Dit nummer kan niet worden gestreamd (beveiligd)."
            });
        }

        // Stuur het succesvolle antwoord in het juiste JSON-formaat terug
        return res.status(200).json({
            success: true,
            title: trackInfo.title || "Onbekende Titel",
            artist: trackInfo.user?.username || "Onbekende Artiest",
            audioUrl: streamUrl
        });
        
    } catch (error) {
        console.error("[SoundCloud Proxy] Kritieke fout in route:", error.message);
        // Zorg dat we ALTIJD geldige JSON terugsturen, zelfs bij een crash!
        return res.status(200).json({
            success: false,
            error: error.message,
            message: "Er ging iets mis op de Render server."
        });
    }
});

app.listen(PORT, () => {
    console.log(`[SoundCloud Proxy] Server draait stabiel op poort ${PORT}`);
});
