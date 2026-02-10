const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

const DB_FILE = './database.json';

if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ videos: [], users: [] }));
}

const db = {
    read: () => JSON.parse(fs.readFileSync(DB_FILE, 'utf8')),
    save: (data) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2))
};

// KULLANICI & KANAL GİRİŞİ
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const data = db.read();
    let user = data.users.find(u => u.username === username);
    if (!user) {
        user = { 
            username, password, subs: [], 
            joined: new Date().toLocaleDateString('tr-TR'),
            bio: "BaseVideo topluluğuna hoş geldiniz!",
            country: "Türkiye"
        };
        data.users.push(user);
        db.save(data);
    }
    res.json({ success: true, user });
});

// KANAL DETAYLARINI GETİR (HAKKINDA KISMI İÇİN)
app.get('/api/channel/:name', (req, res) => {
    const data = db.read();
    const user = data.users.find(u => u.username === req.params.name);
    if(user) {
        const vids = data.videos.filter(v => v.author === user.username);
        const totalViews = vids.reduce((sum, v) => sum + (v.views || 0), 0);
        res.json({ ...user, totalViews, videoCount: vids.length });
    } else { res.status(404).json({error: "Bulunamadı"}); }
});

// VİDEO İŞLEMLERİ
app.get('/api/videos', (req, res) => res.json(db.read().videos));

app.post('/api/action', (req, res) => {
    const { id, type, val } = req.body;
    const data = db.read();
    const v = data.videos.find(x => x.id === id);
    if(v) {
        if(type === 'view') v.views++;
        if(type === 'like') v.likes++;
        if(type === 'rate') v.rating = val;
        db.save(data);
    }
    res.json(v);
});

app.post('/api/comment', (req, res) => {
    const { id, user, text } = req.body;
    const data = db.read();
    const v = data.videos.find(x => x.id === id);
    if(v && text) {
        v.comments.push({ user, text, date: new Date().toLocaleString() });
        db.save(data);
    }
    res.json(v);
});

const upload = multer({ storage: multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
})});

app.post('/api/upload', upload.single('video'), (req, res) => {
    const data = db.read();
    const newVid = {
        id: Date.now().toString(),
        title: req.body.title,
        author: req.body.username,
        url: `/uploads/${req.file.filename}`,
        views: 0, likes: 0, rating: 0, comments: []
    };
    data.videos.unshift(newVid);
    db.save(data);
    res.json(newVid);
});

app.listen(3000, () => console.log("Server 3000 Online"));
