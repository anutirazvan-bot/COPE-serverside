const express = require('express');
const app = express();
const PORT = 4346;

app.use(express.json());
app.use(express.static(__dirname));

// Use a Map for O(1) performance
const positionsMap = new Map();

// Background cleanup task to maintain performance[cite: 2]
setInterval(() => {
    const expiry = Date.now() - (2 * 60 * 60 * 1000);
    for (const [name, entry] of positionsMap.entries()) {
        if (entry.serverTimestamp < expiry) positionsMap.delete(name);
    }
}, 60000);

app.get('/positions', (req, res) => {
    res.json({
        positions: Array.from(positionsMap.values()),
        currentTime: Date.now()
    });
});

app.post('/positions', (req, res) => {
    const { name, position, building, roof, direction, user } = req.body;
    if (!name || !position || !building || !roof || !direction || !user) {
        return res.status(400).json({ error: 'Missing fields' });
    }

    const now = Date.now();
    positionsMap.set(name, { 
        name, position, building, roof, direction, user, 
        time: now, serverTimestamp: now 
    });
    
    res.status(201).json({ message: 'Success' });
});

app.listen(PORT, () => console.log(`Server running on ${PORT}`));
