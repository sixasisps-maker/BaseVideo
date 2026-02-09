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

// Veritabanı Yapısı: { users: [], videos: [] }
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: [], videos: [] }));
}

const upload = multer({ dest: 'uploads/' });

const readDB = () => JSON.parse(fs.readFileSync(DB_FILE));
const writeDB = (data) => fs.writeFileSync(DB_FILE, JSON.stringify(data));

// GİRİŞ / KAYIT SİSTEMİ
app.post('/api/auth', (req, res) => {
    const { username, password } = req.body;
    const db = readDB();
    let user = db.users.find(u => u.username === username);

    if (!user) {
        user = { username, password, subs: 0, subbedTo: [], joined: new Date().toLocaleDateString('tr-TR') };
        db.users.push(user);
        writeDB(db);
    } else if (user.password !== password) {
        return res.json({ success: false, message: "Hatalı Şifre!" });
    }
    res.json({ success: true, user });
});

// VİDEO YÜKLEME (OTOMATİK KANAL)
app.post('/api/upload', upload.single('video'), (req, res) => {
    const { title, username } = req.body;
    const db = readDB();
    const newVideo = {
        id: "vid_" + Date.now(),
        title: title || "Adsız Video",
        channel: username,
        url: `https://${req.get('host')}/uploads/${req.file.filename}`,
        views: 0,
        likes: 0,
        comments: [],
        date: new Date().toLocaleDateString('tr-TR')
    };
    db.videos.unshift(newVideo);
    writeDB(db);
    res.json({ success: true });
});

// ABONE OLMA
app.post('/api/sub', (req, res) => {
    const { me, target } = req.body;
    const db = readDB();
    const targetUser = db.users.find(u => u.username === target);
    const meUser = db.users.find(u => u.username === me);

    if (targetUser && meUser && !meUser.subbedTo.includes(target)) {
        targetUser.subs++;
        meUser.subbedTo.push(target);
        writeDB(db);
    }
    res.json({ success: true, newSubs: targetUser ? targetUser.subs : 0 });
});

// DİĞER APİLER
app.get('/api/videos', (req, res) => res.json(readDB().videos));
app.post('/api/view/:id', (req, res) => {
    const db = readDB();
    const v = db.videos.find(x => x.id === req.params.id);
    if(v) { v.views++; writeDB(db); }
    res.json({ success: true });
});

app.listen(process.env.PORT || 3000);
