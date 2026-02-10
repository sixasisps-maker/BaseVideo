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
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({videos:[], users:[]}));

const db = {
    read: () => JSON.parse(fs.readFileSync(DB_FILE, 'utf8')),
    save: (data) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2))
};

// LOGIN & USER INFO
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const data = db.read();
    let user = data.users.find(u => u.username === username);
    if (!user) { user = { username, password, subCount: 0, bio: "BaseVideo User" }; data.users.push(user); db.save(data); }
    res.json({ success: true, user });
});

// KANAL BİLGİSİ GETİR
app.get('/api/channel/:name', (req, res) => {
    const data = db.read();
    const user = data.users.find(u => u.username === req.params.name);
    const vids = data.videos.filter(v => v.author === req.params.name);
    res.json({ user, vids });
});

// VİDEO İŞLEMLERİ (BEĞENİ & İZLENME)
app.post('/api/action', (req, res) => {
    const { id, type, rating } = req.body;
    const data = db.read();
    const v = data.videos.find(x => x.id === id);
    if(v) {
        if(type === 'view') v.views++;
        if(type === 'like') v.likes++;
        if(type === 'rate') v.rating = rating; // 1-5 arası yıldız
        db.save(data);
    }
    res.json(v);
});

// VİDEO YÜKLEME
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
        date: new Date().toLocaleDateString(),
        comments: []
    };
    data.videos.unshift(newVid);
    db.save(data);
    res.json(newVid);
});

app.get('/api/videos', (req, res) => res.json(db.read().videos));
app.listen(3000);
