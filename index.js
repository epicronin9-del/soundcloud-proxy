const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ success: true, message: "Proxy is 100% operationeel!" });
});

// De universele route voor zowel directe links als titels
app.get('/search', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    try {
        let query = req.query.q;
        if (!query) {
            return res.status(200).json({ success: false, message: "Geen invoer ontvangen." });
        }

        console.log(`[SoundCloud Proxy] Invoer ontvangen: "${query}"`);
        const CLIENT_ID = "IL7Y7egZas9X4vG6uu6VpUvT8p6WkM7Y";
        let trackId = null;
        let trackTitle = "Gevonden via link";

        // OPTIE A: Er is een browser-link geplakt (We vangen alle varianten op)
        if (query.includes("soundcloud.com") || query.includes("soundcloud")) {
            console.log(`[SoundCloud Proxy] Directe link gedetecteerd! Resolven...`);
            
            // Maak de link schoon mocht Roblox er tekens van hebben gemaakt (zoals %3A of %2F)
            let decodedUrl = decodeURIComponent(query);
            
            // Fix voor links die gekopieerd zijn zonder https://
            if (!decodedUrl.startsWith("http")) {
                decodedUrl = "https://" + decodedUrl.replace(/^(http:\/\/|https:\/\/)?/, "");
            }

            try {
                const resolveUrl = `https://soundcloud.com{encodeURIComponent(decodedUrl)}&client_id=${CLIENT_ID}`;
                const resolveResponse = await axios.get(resolveUrl, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
                });

                if (resolveResponse.data && resolveResponse.data.id) {
                    trackId = resolveResponse.data.id;
                    trackTitle = resolveResponse.data.title;
                }
            } catch (resolveError) {
                console.error("[SoundCloud Proxy] Resolve via link mislukt:", resolveError.message);
            }
        }

        // OPTIE B: Er is een losse titel ingetypt (of de link-resolve is mislukt)
        if (!trackId) {
            console.log(`[SoundCloud Proxy] Zoeken op trefwoord: "${query}"`);
            const searchUrl = `https://soundcloud.com{encodeURIComponent(query)}&client_id=${CLIENT_ID}&limit=1`;
            
            const searchResponse = await axios.get(searchUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
            });

            const collection = searchResponse.data?.collection || [];
            if (collection.length > 0) {
                trackId = collection[0].id;
                trackTitle = collection[0].title;
            }
        }

        // Als we een geldig SoundCloud ID hebben, genereren we de audio-omleiding
        if (trackId) {
            const finalAudioUrl = `https://soundcloud.com{trackId}/stream?client_id=${CLIENT_ID}`;
            console.log(`[SoundCloud Proxy] Succesvol gekoppeld: "${trackTitle}" (ID: ${trackId})`);

            return res.status(200).json({
                success: true,
                title: trackTitle,
                audioUrl: finalAudioUrl
            });
        }

        return res.status(200).json({ success: false, message: "Nummer onvindbaar." });

    } catch (error) {
        console.error("[SoundCloud Proxy] Algemene fout:", error.message);
        return res.status(200).json({ success: false, message: "Fout op de server." });
    }
});

app.listen(PORT, () => console.log(`[SoundCloud Proxy] Server actief op poort ${PORT}`));
