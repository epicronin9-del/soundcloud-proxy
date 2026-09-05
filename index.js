const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ success: true, message: "Proxy is 100% operationeel!" });
});

app.get('/search', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    try {
        let query = req.query.q;
        if (!query) {
            return res.status(200).json({ success: false, message: "Geen invoer." });
        }

        const CLIENT_ID = "IL7Y7egZas9X4vG6uu6VpUvT8p6WkM7Y";
        let trackId = null;
        let trackTitle = query;

        // CONTROLE 1: Als de gebruiker een link invoert (we herstellen eventuele verminkte URL's automatisch)
        if (query.includes("soundcloud.com") || query.includes("soundcloud")) {
            console.log(`[Proxy] Directe link gedetecteerd, bezig met herstellen...`);
            
            // Zorg dat de URL de juiste HTTP-indeling heeft
            let cleanUrl = query;
            if (!cleanUrl.startsWith("http")) {
                cleanUrl = "https://" + cleanUrl.replace(/^(http:\/\/|https:\/\/)?/, "");
            }

            const resolveUrl = `https://soundcloud.com{encodeURIComponent(cleanUrl)}&client_id=${CLIENT_ID}`;
            const resolveResponse = await axios.get(resolveUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });

            if (resolveResponse.data && resolveResponse.data.id) {
                trackId = resolveResponse.data.id;
                trackTitle = resolveResponse.data.title;
            }
        }

        // CONTROLE 2: Als het zoeken via tekst gaat (automatische focus op Lekkerfaces hardstyle releases)
        if (!trackId) {
            console.log(`[Proxy] Zoeken op trefwoord: "${query}"`);
            
            // We sturen de zoekopdracht breed in om de Dynamite Saturday OST direct op te vangen
            const searchUrl = `https://soundcloud.com{encodeURIComponent(query)}&client_id=${CLIENT_ID}&limit=5`;
            const searchResponse = await axios.get(searchUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });

            const collection = searchResponse.data?.collection || [];
            if (collection.length > 0) {
                // Zoek bij voorkeur naar de track van Lekkerfaces binnen de top-resultaten
                const exactMatch = collection.find(t => t.user?.permalink === 'lekkerfaces' || t.title.toLowerCase().includes('lekkerfaces')) || collection[0];
                trackId = exactMatch.id;
                trackTitle = exactMatch.title;
            }
        }

        // Als er na beide controles een ID is gevonden, genereren we de MP3 stream
        if (trackId) {
            const finalAudioUrl = `https://soundcloud.com{trackId}/stream?client_id=${CLIENT_ID}`;
            console.log(`[Proxy] Succesvol gekoppeld: "${trackTitle}" (ID: ${trackId})`);

            return res.status(200).json({
                success: true,
                title: trackTitle,
                audioUrl: finalAudioUrl
            });
        }

        return res.status(200).json({ success: false, message: "Nummer onvindbaar." });

    } catch (error) {
        console.error("[Proxy] Kritieke fout:", error.message);
        return res.status(200).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => console.log(`[Proxy] Server gestart op poort ${PORT}`));
