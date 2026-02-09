const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

const DB_FILE = './basevideo_pro_db.json';
const MY_IP = '192.168.1.240'; // Senin verdiğin IP

// Veritabanı Başlatma
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: [], videos: [], notifications: [] }, null, 2));
}

const db_read = () => JSON.parse(fs.readFileSync(DB_FILE));
const db_write = (data) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));

// AUTH API (Şifre, Yaş, Cinsiyet Kayıt Motoru)
app.post('/api/gatekeeper', (req, res) => {
    const { username, password, age, gender, mode } = req.body;
    const db = db_read();
    let user = db.users.find(u => u.username.toLowerCase() === username.toLowerCase());

    if (mode === 'register') {
        if (user) return res.status(400).json({ error: "Bu kullanıcı zaten mevcut!" });
        const newUser = {
            id: "user_" + Date.now(),
            username, password, age: parseInt(age), gender,
            joined: new Date().toLocaleDateString('tr-TR'),
            subs: 0, following: []
        };
        db.users.push(newUser);
        db_write(db);
        return res.json({ success: true, user: newUser });
    } else {
        if (!user || user.password !== password) {
            return res.status(401).json({ error: "Kullanıcı adı veya şifre hatalı!" });
        }
        res.json({ success: true, user });
    }
});

// Video Yükleme ve Diğerleri...
app.get('/api/videos/all', (req, res) => res.json(db_read().videos));

const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => cb(null, `BVX_${Date.now()}_${file.originalname}`)
});
const upload = multer({ storage });

app.post('/api/upload', upload.single('video'), (req, res) => {
    const db = db_read();
    const video = {
        id: "vid_" + Date.now(),
        title: req.body.title,
        author: req.body.username,
        url: `http://${MY_IP}:3000/uploads/${req.file.filename}`, // IP buraya eklendi
        views: 0, likes: 0, isShort: req.body.isShort === 'true'
    };
    db.videos.unshift(video);
    db_write(db);
    res.json({ success: true, video });
});

// SUNUCUYU AÇ
app.listen(3000, '0.0.0.0', () => {
    console.log(`🚀 Sunucu Aktif! Telefonunla bağlanacağın adres: http://${MY_IP}:3000`);
});
