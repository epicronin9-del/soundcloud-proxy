const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ status: "online", message: "Proxy is live!" });
});

// De stabiele zoekroute via Query Parameters (?q=...)
app.get('/search', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    try {
        // We pakken de zoekterm nu veilig uit req.query
        const query = req.query.q;
        if (!query) {
            return res.status(200).json({ success: false, message: "Geen zoekterm meegegeven." });
        }

        console.log(`[SoundCloud Proxy] Zoekopdracht ontvangen voor: "${query}"`);

        const CLIENT_ID = "IL7Y7egZas9X4vG6uu6VpUvT8p6WkM7Y";
        const searchUrl = `https://soundcloud.com{encodeURIComponent(query)}&client_id=${CLIENT_ID}&limit=1`;
        
        const searchResponse = await axios.get(searchUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });

        const collection = searchResponse.data?.collection || [];

        if (collection.length === 0) {
            console.log(`[SoundCloud Proxy] Niets gevonden voor: "${query}"`);
            return res.status(200).json({ success: false, message: "Nummer niet gevonden." });
        }

        const trackData = collection[0];
        const finalAudioUrl = `https://soundcloud.com{trackData.id}/stream?client_id=${CLIENT_ID}`;

        console.log(`[SoundCloud Proxy] Succesvol gekoppeld: "${trackData.title}"`);

        return res.status(200).json({
            success: true,
            title: trackData.title || query,
            audioUrl: finalAudioUrl
        });

    } catch (error) {
        console.error("[SoundCloud Proxy] Zoekfout:", error.message);
        return res.status(200).json({ success: false, message: "Server fout bij zoeken." });
    }
});

setInterval(async () => {
    try { await axios.get(`https://onrender.com`); } catch (e) {}
}, 10 * 60 * 1000);

app.listen(PORT, () => console.log(`[SoundCloud Proxy] Server actief op poort ${PORT}`));
const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ status: "online", message: "Proxy is live!" });
});

// De stabiele zoekroute via Query Parameters (?q=...)
app.get('/search', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    try {
        // We pakken de zoekterm nu veilig uit req.query
        const query = req.query.q;
        if (!query) {
            return res.status(200).json({ success: false, message: "Geen zoekterm meegegeven." });
        }

        console.log(`[SoundCloud Proxy] Zoekopdracht ontvangen voor: "${query}"`);

        const CLIENT_ID = "IL7Y7egZas9X4vG6uu6VpUvT8p6WkM7Y";
        const searchUrl = `https://soundcloud.com{encodeURIComponent(query)}&client_id=${CLIENT_ID}&limit=1`;
        
        const searchResponse = await axios.get(searchUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });

        const collection = searchResponse.data?.collection || [];

        if (collection.length === 0) {
            console.log(`[SoundCloud Proxy] Niets gevonden voor: "${query}"`);
            return res.status(200).json({ success: false, message: "Nummer niet gevonden." });
        }

        const trackData = collection[0];
        const finalAudioUrl = `https://soundcloud.com{trackData.id}/stream?client_id=${CLIENT_ID}`;

        console.log(`[SoundCloud Proxy] Succesvol gekoppeld: "${trackData.title}"`);

        return res.status(200).json({
            success: true,
            title: trackData.title || query,
            audioUrl: finalAudioUrl
        });

    } catch (error) {
        console.error("[SoundCloud Proxy] Zoekfout:", error.message);
        return res.status(200).json({ success: false, message: "Server fout bij zoeken." });
    }
});

setInterval(async () => {
    try { await axios.get(`https://onrender.com`); } catch (e) {}
}, 10 * 60 * 1000);

app.listen(PORT, () => console.log(`[SoundCloud Proxy] Server actief op poort ${PORT}`));
