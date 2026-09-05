const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ success: true, message: "Proxy is live en universeel!" });
});

// Universele route die zowel platte titels als complete SoundCloud links accepteert
app.get('/search', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    try {
        let query = req.query.q;
        if (!query) {
            return res.status(200).json({ success: false, message: "Geen invoer meegegeven." });
        }

        console.log(`[SoundCloud Proxy] Invoer ontvangen: "${query}"`);
        const CLIENT_ID = "IL7Y7egZas9X4vG6uu6VpUvT8p6WkM7Y";

        // OPTIE A: De gebruiker voert een volledige SoundCloud link in
        if (query.includes("soundcloud.com/")) {
            console.log(`[SoundCloud Proxy] Directe link gedetecteerd! Resolven...`);
            
            // Haal de trackgegevens rechtstreeks op via de permalink-resolver van SoundCloud
            const resolveUrl = `https://soundcloud.com{encodeURIComponent(query)}&client_id=${CLIENT_ID}`;
            const resolveResponse = await axios.get(resolveUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
            });

            const trackData = resolveResponse.data;
            if (!trackData || !trackData.id) {
                return res.status(200).json({ success: false, message: "Link kon niet worden opgelost." });
            }

            const finalAudioUrl = `https://soundcloud.com{trackData.id}/stream?client_id=${CLIENT_ID}`;
            console.log(`[SoundCloud Proxy] Succesvol opgelost via link: "${trackData.title}"`);

            return res.status(200).json({
                success: true,
                title: trackData.title || "Gevonden via link",
                audioUrl: finalAudioUrl
            });
        }

        // OPTIE B: De gebruiker voert een normale titel in (de oude zoekmethode)
        const searchUrl = `https://soundcloud.com{encodeURIComponent(query)}&client_id=${CLIENT_ID}&limit=1`;
        const searchResponse = await axios.get(searchUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });

        const collection = searchResponse.data?.collection || [];
        if (collection.length === 0) {
            return res.status(200).json({ success: false, message: "Niet gevonden via titel." });
        }

        const trackData = collection[0];
        const finalAudioUrl = `https://soundcloud.com{trackData.id}/stream?client_id=${CLIENT_ID}`;
        console.log(`[SoundCloud Proxy] Succesvol gevonden via zoekopdracht: "${trackData.title}"`);

        return res.status(200).json({
            success: true,
            title: trackData.title || query,
            audioUrl: finalAudioUrl
        });

    } catch (error) {
        console.error("[SoundCloud Proxy] Fout opgetreden:", error.message);
        return res.status(200).json({ success: false, message: "Fout op de server bij verwerking." });
    }
});

app.listen(PORT, () => console.log(`[SoundCloud Proxy] Systeem operationeel op poort ${PORT}`));
