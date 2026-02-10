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

// Veritabanı Başlatma
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ videos: [], users: [] }));
}

const db = {
    read: () => JSON.parse(fs.readFileSync(DB_FILE, 'utf8')),
    save: (data) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2))
};

// --- KULLANICI & KANAL ---
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const data = db.read();
    let user = data.users.find(u => u.username === username);
    if (!user) {
        user = { username, password, subs: [], joined: new Date().toLocaleDateString('tr-TR') };
        data.users.push(user);
        db.save(data);
    }
    res.json({ success: true, user });
});

app.post('/api/subscribe', (req, res) => {
    const { follower, target } = req.body;
    const data = db.read();
    const u = data.users.find(x => x.username === follower);
    if(u) {
        if(!u.subs.includes(target)) u.subs.push(target);
        else u.subs = u.subs.filter(s => s !== target);
        db.save(data);
    }
    res.json(u);
});

// --- VİDEO İŞLEMLERİ ---
app.get('/api/videos', (req, res) => res.json(db.read().videos));

app.post('/api/action', (req, res) => {
    const { id, type, val } = req.body;
    const data = db.read();
    const v = data.videos.find(x => x.id === id);
    if(v) {
        if(type === 'view') v.views++;
        if(type === 'like') v.likes++;
        if(type === 'rate') v.rating = val; // 1-5 arası yıldız
        db.save(data);
    }
    res.json(v);
});

// YORUM SİSTEMİ (KRİTİK)
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

app.post('/api/delete-video', (req, res) => {
    const { id, username } = req.body;
    const data = db.read();
    data.videos = data.videos.filter(v => !(v.id === id && v.author === username));
    db.save(data);
    res.json({ success: true });
});

// DOSYA YÜKLEME
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
        views: 0, likes: 0, rating: 0,
        comments: []
    };
    data.videos.unshift(newVid);
    db.save(data);
    res.json(newVid);
});

app.listen(3000, () => console.log("Server 3000 hazır!"));
