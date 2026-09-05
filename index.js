const express = require('express');
const scdl = require('soundcloud-downloader').default; // Installeer deze module!
const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

// De route die Roblox aanroept
app.get('/get-track/:artist/:track', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    try {
        const { artist, track } = req.params;
        // Bouw de echte SoundCloud URL
        const targetUrl = `https://soundcloud.com{artist}/${track}`;
        
        console.log(`Searching SoundCloud for: ${targetUrl}`);

        // 1. Haal de metadata op (Titel, Artiest, etc.)
        const info = await scdl.getInfo(targetUrl);
        
        // 2. Haal de DIRECTE MP3 stream-URL op die Roblox kan afspelen
        const streamUrl = await scdl.downloadFormat(targetUrl, scdl.FORMATS.MP3);

        if (!streamUrl) {
            throw new Error("Could not generate stream URL");
        }

        return res.json({
            success: true,
            title: info.title || track,
            artist: info.user?.username || artist,
            audioUrl: streamUrl // Dit sturen we nu wél mee naar Roblox!
        });
        
    } catch (error) {
        console.error("Error fetching SoundCloud track:", error.message);
        return res.json({
            success: false,
            title: "Fout",
            artist: "Track niet gevonden of fout",
            error: error.message
        });
    }
});

app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));
