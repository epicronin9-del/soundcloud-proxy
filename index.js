const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

// Functie om live een werkende SoundCloud Client ID te scrapen
async function getDynamicClientID() {
    try {
        const homePage = await axios.get('https://soundcloud.com', {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        
        // Zoek naar alle JavaScript-bestanden op de homepage
        const jsScripts = homePage.data.match(/https:\/\/a-v2\.sndcdn\.com\/assets\/[a-zA-Z0-9-]+\.[a-zA-Z0-9]+\.js/g);
        if (!jsScripts) return 'IL7Y7egZas9X4vG6uu6VpUvT8p6WkM7Y'; // Fallback

        // Doorzoek het laatste scriptbestand naar de client_id string
        const targetScript = jsScripts[jsScripts.length - 1];
        const scriptContent = await axios.get(targetScript);
        const clientIdMatch = scriptContent.data.match(/client_id\s*:\s*["']([a-zA-Z0-9]{32})["']/);
        
        if (clientIdMatch && clientIdMatch[1]) {
            console.log(`[SoundCloud Proxy] Dynamische Client ID succesvol opgehaald: ${clientIdMatch[1]}`);
            return clientIdMatch[1];
        }
    } catch (e) {
        console.error("[SoundCloud Proxy] Dynamische ID scraping mislukt, fallback gebruikt:", e.message);
    }
    return 'IL7Y7egZas9X4vG6uu6VpUvT8p6WkM7Y'; // Universele fallback
}

// De zoekroute
app.get('/search-track/:query', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    try {
        const { query } = req.params;
        console.log(`[SoundCloud Proxy] Zoeken naar: "${query}"`);

        // Haal de live sleutel op
        const currentClientId = await getDynamicClientID();

        const searchUrl = `https://soundcloud.com{encodeURIComponent(query)}&client_id=${currentClientId}&limit=1`;
        const searchResponse = await axios.get(searchUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });

        const collection = searchResponse.data?.collection;
        if (!collection || collection.length === 0) {
            return res.status(200).json({ success: false, message: "Nummer niet gevonden." });
        }

        const trackData = collection[0];
        const finalAudioUrl = `https://soundcloud.com{trackData.id}/stream?client_id=${currentClientId}`;

        console.log(`[SoundCloud Proxy] Succesvol gekoppeld: "${trackData.title}"`);

        return res.status(200).json({
            success: true,
            title: trackData.title || "Onbekende Titel",
            audioUrl: finalAudioUrl
        });

    } catch (error) {
        console.error("[SoundCloud Proxy] Fout:", error.message);
        return res.status(200).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => console.log(`[SoundCloud Proxy] Systeem actief op poort ${PORT}`));
