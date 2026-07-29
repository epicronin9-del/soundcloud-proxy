const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

app.get('/get-track/:id', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    try {
        const trackId = req.params.id;
        const targetUrl = `https://soundcloud.com{trackId}&format=json`;
        
        const response = await axios.get(targetUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        
        const fullTitle = response.data.title || "Unknown Track";
        let artist = response.data.author_name || "Unknown Artist";
        let title = fullTitle;
        
        if (fullTitle.includes(" - ")) {
            const parts = fullTitle.split(" - ");
            artist = parts[0].trim();
            title = parts[1].trim();
        }
        
        return res.json({
            success: true,
            title: title,
            artist: artist,
            duration: 180000 
        });
        
    } catch (error) {
        return res.json({
            success: false,
            title: "BKJN",
            artist: "Lekkerfaces",
            duration: 180000,
            error: error.message
        });
    }
});

app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));
