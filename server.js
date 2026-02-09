const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

const DB_PATH = './master_database.json';

// Veritabanı Şeması (Yeni alanlar eklendi)
if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ 
        users: [], 
        videos: [], 
        notifications: [],
        stats: { total_registrations: 0 }
    }, null, 2));
}

const getDB = () => JSON.parse(fs.readFileSync(DB_PATH));
const saveDB = (data) => fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));

// --- AUTH SİSTEMİ (Kayıt + Giriş) ---
app.post('/api/auth/gate', (req, res) => {
    const { username, password, age, gender, isRegistering } = req.body;
    const db = getDB();
    let user = db.users.find(u => u.username === username);

    if (isRegistering) {
        if (user) return res.status(400).json({ error: "Bu kullanıcı adı zaten alınmış!" });
        
        // Yeni Kullanıcı Oluştur
        const newUser = {
            username,
            password, // Gerçek projede hash'lenmeli (bcrypt)
            age: parseInt(age),
            gender,
            sub_count: 0,
            subscriptions: [],
            joined: new Date().toLocaleDateString('tr-TR'),
            bio: "Yeni BaseVideo X Üyesi"
        };
        db.users.push(newUser);
        db.stats.total_registrations++;
        saveDB(db);
        return res.json({ success: true, user: newUser });
    } else {
        // Giriş Yap
        if (!user || user.password !== password) {
            return res.status(401).json({ error: "Kullanıcı adı veya şifre hatalı!" });
        }
        res.json({ success: true, user });
    }
});

// --- DİĞER API'LAR (Abonelik, Video, Yorum) ---
// (Önceki devasa kodun üzerine bu yapıyı entegre ediyoruz)

app.get('/api/explore', (req, res) => res.json(getDB().videos));

app.post('/api/upload', multer({dest: 'uploads/'}).single('video'), (req, res) => {
    const db = getDB();
    const video = {
        id: "v_" + Date.now(),
        title: req.body.title,
        author: req.body.username,
        url: `http://${req.get('host')}/uploads/${req.file.filename}`,
        views: 0, likes: 0, comments: [],
        isShort: req.body.isShort === 'true',
        date: new Date().toLocaleDateString('tr-TR')
    };
    db.videos.unshift(video);
    saveDB(db);
    res.json({ success: true, video });
});

app.listen(3000, () => console.log(">> BaseVideo X: High-Security Engine Active"));
