const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

const DB_FILE = './database_vFinal.json';
const db = {
    read: () => {
        if (!fs.existsSync(DB_FILE)) return { users: [], videos: [] };
        return JSON.parse(fs.readFileSync(DB_FILE));
    },
    save: (data) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2))
};

// ABONE OLMA FONKSİYONU
app.post('/api/subscribe', (req, res) => {
    const { channelName, viewerName } = req.body;
    const data = db.read();
    const channel = data.users.find(u => u.username === channelName);
    if (!channel) return res.status(404).send();
    
    if (!channel.subscribers) channel.subscribers = [];
    if (!channel.subscribers.includes(viewerName)) {
        channel.subscribers.push(viewerName);
        db.save(data);
    }
    res.json({ count: channel.subscribers.length });
});

// YORUM GÖNDERME (FIXED)
app.post('/api/comment', (req, res) => {
    const { id, user, text } = req.body;
    const data = db.read();
    const v = data.videos.find(vid => vid.id == id);
    if(!v.comments) v.comments = [];
    v.comments.unshift({ user, text, date: "10.02.2026" });
    db.save(data);
    res.json(v);
});

// LİKE, FAV VE YILDIZ
app.post('/api/action', (req, res) => {
    const { id, type } = req.body;
    const data = db.read();
    const v = data.videos.find(vid => vid.id == id);
    if (type === 'view') v.views = (v.views || 0) + 1;
    if (type === 'like') v.likes = (v.likes || 0) + 1;
    if (type === 'fav') v.favs = (v.favs || 0) + 1;
    v.stars = Math.min(5, Math.floor((v.views || 0) / 5) + 1);
    db.save(data);
    res.json(v);
});

app.get('/api/videos', (req, res) => res.json(db.read().videos));
app.post('/api/auth', (req, res) => {
    const { username, password } = req.body;
    const data = db.read();
    let user = data.users.find(u => u.username === username);
    if (!user) {
        user = { username, password, subscribers: [] };
        data.users.push(user);
        db.save(data);
    }
    res.json({ success: true, user });
});

app.listen(process.env.PORT || 3000);
