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
if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({videos:[], users:[]}));

const db = {
    read: () => JSON.parse(fs.readFileSync(DB_FILE, 'utf8')),
    save: (data) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2))
};

// LOGIN API
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const data = db.read();
    
    // Basit kayıt/giriş mantığı: Kullanıcı yoksa oluştur, varsa şifre kontrol et
    let user = data.users.find(u => u.username === username);
    
    if (!user) {
        user = { username, password };
        data.users.push(user);
        db.save(data);
        return res.json({ success: true, user });
    } else {
        if (user.password === password) {
            return res.json({ success: true, user });
        } else {
            return res.status(401).json({ success: false, message: "Hatalı şifre!" });
        }
    }
});

// VİDEO LİSTESİ VE DİĞERLERİ (Önceki kodlarla aynı)
app.get('/api/videos', (req, res) => res.json(db.read().videos));

const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

app.post('/api/upload', upload.single('video'), (req, res) => {
    const data = db.read();
    const newVid = { id: Date.now().toString(), title: req.body.title, author: req.body.username, url: `/uploads/${req.file.filename}`, views: 0, likes: 0, date: "10.02.2026", comments: [] };
    data.videos.unshift(newVid);
    db.save(data);
    res.json(newVid);
});

app.listen(3000, () => console.log("Sunucu 3000 portunda!"));
