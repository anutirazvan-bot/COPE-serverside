const express = require('express');
const path = require('path');
const app = express();

// Use PORT from environment variables (Render/Heroku standard) or default to 4346
const PORT = process.env.PORT || 4346;

app.use(express.json());

// Serve static files from the current directory
app.use(express.static(__dirname));

// Use a Map for O(1) performance
const positionsMap = new Map();

// Background cleanup task to maintain performance
setInterval(() => {
    const expiry = Date.now() - (2 * 60 * 60 * 1000); // 2 hours
    for (const [name, entry] of positionsMap.entries()) {
        if (entry.serverTimestamp < expiry) positionsMap.delete(name);
    }
}, 60000);

// GET: Returns positions exactly as expected by your Flutter _positions list[cite: 1, 2]
app.get('/positions', (req, res) => {
    res.json({
        positions: Array.from(positionsMap.values()),
             currentTime: Date.now()
    });
});

// POST: Add or update a position
app.post('/positions', (req, res) => {
    const { name, position, building, roof, direction, user } = req.body;

    // Validation: Require all fields except 'direction', which can be null
    if (!name || !position || !building || !roof || !user) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const now = Date.now();
    positionsMap.set(name, {
        name,
        position,
        building,
        roof,
        direction: direction ?? null, // Explicitly set to null if missing or undefined
        user,
        serverTimestamp: now
    });

    res.status(201).json({ message: 'Success' });
});

// Explicit endpoint to ensure zones.json is served correctly[cite: 2]
app.get('/zones.json', (req, res) => {
    res.sendFile(path.join(__dirname, 'zones.json'));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
