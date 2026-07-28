const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 8080;

// Middleware to parse JSON
app.use(express.json());

// Main route for Roblox to fetch SoundCloud track data
app.get('/get-track/:id', async (req, res) => {
    try {
        const trackId = req.params.id;
        
        // Render will automatically pass your client ID from env variables
        const client_id = process.env.SOUNDCLOUD_CLIENT_ID;
        
        const response = await axios.get(`https://soundcloud.com{trackId}`, {
            params: { client_id: client_id }
        });
        
        // Return clear, basic data back to your Roblox game script
        res.json({
            title: response.data.title,
            artist: response.data.user.username,
            duration: response.data.duration
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch SoundCloud data' });
    }
});

app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));
