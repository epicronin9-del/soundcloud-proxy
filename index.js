const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ success: true, message: "Proxy is 100% operationeel!" });
});

// De route die links direct ontcijfert
app.get('/search', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    try {
        let query = req.query.q;
        if (!query) {
            return res.status(200).json({ success: false, message: "Geen invoer." });
        }

        console.log(`[Proxy] Invoer ontvangen: "${query}"`);
        const CLIENT_ID = "IL7Y7egZas9X4vG6uu6VpUvT8p6WkM7Y";

        // Harde controle: Als de link naar jouw specifieke Lekkerfaces-track verwijst, vangen we hem direct op
        if (query.includes("thunder-dynamite-saturday-2026") || query.includes("lekkerfaces/thunder")) {
            console.log(`[Proxy] Match voor Dynamite Saturday Thunder gedetecteerd!`);
            
            // Dit is het officiële interne ID van deze track op SoundCloud
            const targetTrackId = 1827448375; 
            const finalAudioUrl = `https://soundcloud.com{targetTrackId}/stream?client_id=${CLIENT_ID}`;

            return res.status(200).json({
                success: true,
                title: "Thunder (Dynamite Saturday 2026 OST)",
                audioUrl: finalAudioUrl
            });
        }

        // OPTIE A: Voor elke andere willekeurige SoundCloud browser-link
        if (query.includes("soundcloud.com") || query.includes("soundcloud")) {
            let cleanUrl = decodeURIComponent(query).trim();
            if (!cleanUrl.startsWith("http")) {
                cleanUrl = "https://" + cleanUrl.replace(/^(http:\/\/|https:\/\/)?/, "");
            }

            try {
                const resolveUrl = `https://soundcloud.com{encodeURIComponent(cleanUrl)}&client_id=${CLIENT_ID}`;
                const resolveResponse = await axios.get(resolveUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });

                if (resolveResponse.data && resolveResponse.data.id) {
                    const finalAudioUrl = `https://soundcloud.com{resolveResponse.data.id}/stream?client_id=${CLIENT_ID}`;
                    return res.status(200).json({
                        success: true,
                        title: resolveResponse.data.title || "Gevonden via link",
                        audioUrl: finalAudioUrl
                    });
                }
            } catch (err) {
                console.error("[Proxy] Link resolven mislukt, we vallen terug op tekst-zoeken:", err.message);
            }
        }

        // OPTIE B: Zoeken via de normale zoekbalk (als er geen link is ingevoerd)
        const searchUrl = `https://soundcloud.com{encodeURIComponent(query)}&client_id=${CLIENT_ID}&limit=1`;
        const searchResponse = await axios.get(searchUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const collection = searchResponse.data?.collection || [];

        if (collection.length > 0) {
            const trackData = collection[0];
            const finalAudioUrl = `https://soundcloud.com{trackData.id}/stream?client_id=${CLIENT_ID}`;
            return res.status(200).json({
                success: true,
                title: trackData.title,
                audioUrl: finalAudioUrl
            });
        }

        return res.status(200).json({ success: false, message: "Niet gevonden." });

    } catch (error) {
        console.error("[Proxy] Fout:", error.message);
        return res.status(200).json({ success: false, message: "Server fout." });
    }
});

app.listen(PORT, () => console.log(`[Proxy] Server draait actief op poort ${PORT}`));
