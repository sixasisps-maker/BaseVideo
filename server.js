const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();

// --- RENDER & GLOBAL AYARLAR ---
app.use(cors()); // Her yerden erişime izin ver
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const DB_FILE = './database_2026.json';
if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');

// Veritabanı Başlatıcı
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: [], videos: [] }, null, 2));
}

const db = {
    get: () => JSON.parse(fs.readFileSync(DB_FILE)),
    save: (data) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2))
};

// --- AUTH API ---
app.post('/api/auth', (req, res) => {
    const { username, password, mode } = req.body;
    const data = db.get();
    const user = data.users.find(u => u.username.toLowerCase() === username.toLowerCase());

    if (mode === 'register') {
        if (user) return res.status(400).json({ error: "Kullanıcı adı alınmış!" });
        const newUser = { id: Date.now(), username, password, subs: 0 };
        data.users.push(newUser);
        db.save(data);
        return res.json({ success: true, user: newUser });
    } else {
        if (!user || user.password !== password) return res.status(401).json({ error: "Giriş hatalı!" });
        res.json({ success: true, user });
    }
});

// --- VİDEO MOTORU ---
const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => cb(null, `BVX_${Date.now()}_${file.originalname}`)
});
const upload = multer({ storage });

app.post('/api/upload', upload.single('video'), (req, res) => {
    const data = db.get();
    const video = {
        id: Date.now(),
        title: req.body.title,
        author: req.body.username,
        url: `/uploads/${req.file.filename}`,
        isShort: req.body.isShort === 'true',
        views: 0
    };
    data.videos.unshift(video);
    db.save(data);
    res.json({ success: true });
});

app.get('/api/videos', (req, res) => res.json(db.get().videos));

// RENDER PORT AYARI: Render kendi portunu atar, yoksa 3000'i kullanır
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`BaseVideo X Render üzerinde ${PORT} portunda aktif!`);
});
