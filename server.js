const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();

// --- 2026 KURUMSAL AYARLAR ---
app.use(cors({ origin: '*' })); // Her cihazdan gelen isteği kabul et
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const DB_FILE = './basevideo_enterprise_core.json';
const UPLOAD_DIR = './uploads';

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ 
        users: [], videos: [], 
        system_stats: { total_views: 0, server_start: new Date() } 
    }, null, 2));
}

const db = {
    load: () => JSON.parse(fs.readFileSync(DB_FILE)),
    save: (data) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2))
};

// --- KİMLİK DOĞRULAMA (LOGIN/REGISTER) ---
app.post('/api/auth', (req, res) => {
    const { username, password, mode, age, gender } = req.body;
    const data = db.load();
    const existingUser = data.users.find(u => u.username.toLowerCase() === username.toLowerCase());

    if (mode === 'register') {
        if (existingUser) return res.status(400).json({ error: "Bu isimle bir hesap zaten var!" });
        const newUser = { 
            id: Date.now(), username, password, age, gender, 
            joined: "2026", subs: 0, avatar: username[0].toUpperCase() 
        };
        data.users.push(newUser);
        db.save(data);
        return res.json({ success: true, user: newUser });
    } else {
        if (!existingUser || existingUser.password !== password) {
            return res.status(401).json({ error: "Giriş bilgileri yanlış!" });
        }
        return res.json({ success: true, user: existingUser });
    }
});

// --- VİDEO YÖNETİMİ ---
const storage = multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) => cb(null, `BVX_${Date.now()}_${file.originalname}`)
});
const upload = multer({ storage });

app.post('/api/upload', upload.single('video'), (req, res) => {
    const data = db.load();
    const video = {
        id: Date.now(),
        title: req.body.title || "Adsız Video",
        author: req.body.username,
        url: `/uploads/${req.file.filename}`,
        isShort: req.body.isShort === 'true',
        views: 0,
        likes: 0
    };
    data.videos.unshift(video);
    db.save(data);
    res.json({ success: true, video });
});

app.get('/api/stream', (req, res) => res.json(db.load().videos));

// --- SERVER BAŞLATICI (HER AĞA AÇIK) ---
const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`
    =============================================
    🚀 BASEVIDEO X ENTERPRISE SERVER AKTİF!
    🌐 Yerel Erişim: http://localhost:${PORT}
    📡 Port: ${PORT} (Tüm ağlara açık)
    =============================================
    `);
});
