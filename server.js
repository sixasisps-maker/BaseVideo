const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

const DB_PATH = './basevideo_plus_db.json';
const MY_IP = '192.168.1.240'; 

// Veritabanı Kontrolü
if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ users: [], videos: [] }, null, 2));
}

const getDB = () => JSON.parse(fs.readFileSync(DB_PATH));
const saveDB = (data) => fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));

// --- KRİTİK GİRİŞ/KAYIT MOTORU ---
app.post('/api/gatekeeper', (req, res) => {
    const { username, password, age, gender, mode } = req.body;
    const db = getDB();
    
    // Kullanıcıyı bul (Küçük/Büyük harf duyarsız)
    let userIndex = db.users.findIndex(u => u.username.toLowerCase() === username.toLowerCase());
    let user = db.users[userIndex];

    if (mode === 'register') {
        if (userIndex !== -1) return res.status(400).json({ success: false, error: "Bu kullanıcı zaten var!" });
        
        const newUser = {
            id: "u_" + Date.now(),
            username: username,
            password: password,
            age: age || 0,
            gender: gender || "Belirtilmemiş",
            subs: 0,
            joined: new Date().toLocaleDateString('tr-TR')
        };
        db.users.push(newUser);
        saveDB(db);
        return res.json({ success: true, user: newUser });
    } 
    
    if (mode === 'login') {
        if (userIndex === -1) return res.status(404).json({ success: false, error: "Kullanıcı bulunamadı!" });
        if (user.password !== password) return res.status(401).json({ success: false, error: "Şifre hatalı!" });
        
        return res.json({ success: true, user: user });
    }
});

app.get('/api/explore', (req, res) => res.json(getDB().videos));

const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => cb(null, `BVX_${Date.now()}_${file.originalname}`)
});
const upload = multer({ storage });

app.post('/api/upload', upload.single('video'), (req, res) => {
    const db = getDB();
    const video = {
        id: "v_" + Date.now(),
        title: req.body.title,
        author: req.body.username,
        url: `http://${MY_IP}:3000/uploads/${req.file.filename}`,
        views: 0,
        isShort: req.body.isShort === 'true'
    };
    db.videos.unshift(video);
    saveDB(db);
    res.json({ success: true, video });
});

app.listen(3000, '0.0.0.0', () => {
    console.log(`\x1b[32m%s\x1b[0m`, `>>> PLUS PLUS SERVER AKTİF: http://${MY_IP}:3000`);
});
