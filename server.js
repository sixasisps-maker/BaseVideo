/**
 * BASEVIDEO X ENTERPRISE - SERVER CORE v4.0
 * 1000 Satırlık Dev Proje Altyapısı
 */
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();

// --- MIDDLEWARES ---
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- DATABASE ENGINE ---
const DB_PATH = './basevideo_pro_max.json';
const UPLOAD_DIR = './uploads';

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);
if (!fs.existsSync(DB_PATH)) {
    const initialSchema = {
        users: [],
        videos: [],
        notifications: [],
        system: { version: "4.0.0", logs: [] }
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialSchema, null, 2));
}

const db = {
    read: () => JSON.parse(fs.readFileSync(DB_PATH)),
    write: (data) => fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2)),
    log: (msg) => {
        const d = JSON.parse(fs.readFileSync(DB_PATH));
        d.system.logs.push({ time: new Date(), msg });
        fs.writeFileSync(DB_PATH, JSON.stringify(d, null, 2));
    }
};

// --- AUTHENTICATION API (Şifre, Yaş, Cinsiyet) ---
app.post('/api/auth', (req, res) => {
    const { username, password, mode, age, gender } = req.body;
    const data = db.read();
    const user = data.users.find(u => u.username.toLowerCase() === username.toLowerCase());

    if (mode === 'register') {
        if (user) return res.status(400).json({ error: "Bu kullanıcı adı zaten alınmış!" });
        const newUser = {
            id: "user_" + Date.now(),
            username, password, age, gender,
            subs: 0, following: [], likes: [],
            joined: new Date().toLocaleDateString('tr-TR')
        };
        data.users.push(newUser);
        db.write(data);
        db.log(`Yeni kullanıcı: ${username}`);
        return res.json({ success: true, user: newUser });
    } else {
        if (!user || user.password !== password) return res.status(401).json({ error: "Hatalı giriş bilgileri!" });
        return res.json({ success: true, user });
    }
});

// --- VIDEO ENGINE ---
const storage = multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) => cb(null, `BVX_${Date.now()}_${file.originalname}`)
});
const upload = multer({ storage });

app.post('/api/upload', upload.single('video'), (req, res) => {
    const data = db.read();
    // Dinamik URL Oluşturma (IP Bağımsız)
    const protocol = req.protocol;
    const host = req.get('host');
    
    const video = {
        id: "vid_" + Date.now(),
        title: req.body.title || "Adsız Video",
        author: req.body.username,
        url: `${protocol}://${host}/uploads/${req.file.filename}`,
        isShort: req.body.isShort === 'true',
        views: 0, likes: 0,
        timestamp: new Date()
    };
    data.videos.unshift(video);
    db.write(data);
    res.json({ success: true, video });
});

app.get('/api/videos', (req, res) => res.json(db.read().videos));

// --- SERVER START ---
const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`
    ============================================
    🚀 BASEVIDEO X ULTIMATE SERVER ONLINE
    🏠 Local: http://localhost:${PORT}
    📡 Network: http://[BİLGİSAYAR_IP]:${PORT}
    ============================================
    `);
});
