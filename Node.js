const express = require('express');
const path = require('path');

const app = express();
const PORT = 4346;

app.use(express.json());

// Serve static files
app.use(express.static(__dirname));

// Use a Map for O(1) read/write/update performance
const positionsMap = new Map();

// Background worker: Cleans up expired entries every minute
// Prevents API requests from being slowed down by data cleanup
setInterval(() => {
    const expiryThreshold = Date.now() - (2 * 60 * 60 * 1000); // 2 hours
    for (const [name, data] of positionsMap.entries()) {
        if (data.serverTimestamp < expiryThreshold) {
            positionsMap.delete(name);
        }
    }
}, 60 * 1000);

// GET: Returns positions exactly as expected by your Flutter _positions list
app.get('/positions', (req, res) => {
    res.json({
        positions: Array.from(positionsMap.values()),
        currentTime: Date.now()
    });
});

// POST: Add or update a position
app.post('/positions', (req, res) => {
    const { name, position, building, roof, direction, user } = req.body;

    // Strict validation
    if (!name || !position || !building || !roof || !direction || !user) {
        return res.status(400).json({ error: 'Missing required fields.' });
    }

    const now = Date.now();
    
    // Update or Insert logic is now instant via Map
    const entry = {
        name,
        position,
        building,
        roof,
        direction,
        user,
        serverTimestamp: now // Used by the background interval
    };

    positionsMap.set(name, entry);

    // Respond with a status code 201 so the Flutter logic triggers _fetchPositions()
    res.status(201).json({
        message: 'Position successfully registered.',
        entry: entry
    });
});

// Explicit endpoints for your assets
app.get('/zones.json', (req, res) => {
    res.sendFile(path.join(__dirname, 'zones.json'));
});

app.get('/zones', (req, res) => {
    res.sendFile(path.join(__dirname, 'zones.json'));
});

// Start server
app.listen(PORT, () => {
    console.log(`COPE Production-Ready Server running on port ${PORT}`);
});
