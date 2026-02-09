const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();

// --- AYARLAR VE GÜVENLİK ---
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

const DB_FILE = './basevideo_pro_db.json';

// Veritabanı Başlatma (Yoksa Oluştur)
if (!fs.existsSync(DB_FILE)) {
    const initialData = {
        config: { version: "2.0.0", created: "2026" },
        users: [],
        videos: [],
        notifications: [],
        system_logs: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
}

const db_read = () => JSON.parse(fs.readFileSync(DB_FILE));
const db_write = (data) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));

// --- GÜVENLİK VE LOG SİSTEMİ ---
const logAction = (msg) => {
    const db = db_read();
    db.system_logs.unshift({ time: new Date().toLocaleString(), action: msg });
    db_write(db);
};

// --- AUTH API (Şifre, Yaş, Cinsiyet) ---
app.post('/api/gatekeeper', (req, res) => {
    const { username, password, age, gender, mode } = req.body;
    const db = db_read();
    let user = db.users.find(u => u.username.toLowerCase() === username.toLowerCase());

    if (mode === 'register') {
        if (user) return res.status(400).json({ error: "Bu kullanıcı zaten mevcut!" });
        
        const newUser = {
            id: "user_" + Date.now(),
            username,
            password, // Gerçek üretimde şifreler hashlenmelidir
            age: parseInt(age),
            gender,
            joined: new Date().toLocaleDateString('tr-TR'),
            subs: 0,
            following: [],
            liked_videos: [],
            bio: `Merhaba, ben ${username}!`
        };
        db.users.push(newUser);
        db_write(db);
        logAction(`Yeni kullanıcı kayıt oldu: ${username}`);
        return res.json({ success: true, user: newUser });
    } else {
        // Giriş Modu
        if (!user || user.password !== password) {
            return res.status(401).json({ error: "Kullanıcı adı veya şifre hatalı!" });
        }
        res.json({ success: true, user });
    }
});

// --- VİDEO VE ETKİLEŞİM API ---
app.get('/api/videos/all', (req, res) => {
    const db = db_read();
    res.json(db.videos);
});

app.post('/api/action/subscribe', (req, res) => {
    const { followerId, targetUsername } = req.body;
    const db = db_read();
    const follower = db.users.find(u => u.id === followerId);
    const target = db.users.find(u => u.username === targetUsername);

    if (follower && target) {
        const idx = follower.following.indexOf(targetUsername);
        if (idx === -1) {
            follower.following.push(targetUsername);
            target.subs++;
        } else {
            follower.following.splice(idx, 1);
            target.subs--;
        }
        db_write(db);
        res.json({ success: true, user: follower, targetSubs: target.subs });
    }
});

// --- DOSYA YÜKLEME ---
const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => cb(null, `BVX_${Date.now()}_${file.originalname}`)
});
const upload = multer({ storage });

app.post('/api/upload', upload.single('video'), (req, res) => {
    const db = db_read();
    const newVideo = {
        id: "vid_" + Date.now(),
        title: req.body.title || "Adsız Video",
        author: req.body.username,
        url: `http://${req.get('host')}/uploads/${req.file.filename}`,
        views: 0,
        likes: 0,
        comments: [],
        timestamp: new Date(),
        isShort: req.body.isShort === 'true'
    };
    db.videos.unshift(newVideo);
    db_write(db);
    logAction(`Video yüklendi: ${newVideo.title} (Yükleyen: ${req.body.username})`);
    res.json({ success: true, video: newVideo });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`
========================================
 BASEVIDEO X ULTIMATE SERVER ONLINE
 PORT: ${PORT}
 DURUM: Hazır ve Güvenli
========================================
`));
