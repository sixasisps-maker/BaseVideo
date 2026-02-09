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
// Veritabanı Başlatma
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: [], videos: [], notifications: [] }));
}

const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

const readDB = () => JSON.parse(fs.readFileSync(DB_FILE));
const writeDB = (data) => fs.writeFileSync(DB_FILE, JSON.stringify(data));

// --- API KATMANI ---

// 1. GLOBAL ARAMA VE TRENDLER (Gelişmiş Filtre)
app.get('/api/videos', (req, res) => {
    const db = readDB();
    const { q, category } = req.query;
    let list = db.videos;
    if (q) list = list.filter(v => v.title.toLowerCase().includes(q.toLowerCase()) || v.channel.toLowerCase().includes(q.toLowerCase()));
    if (category === 'shorts') list = list.filter(v => v.isShort === true);
    res.json(list.sort((a,b) => b.likes - a.likes));
});

// 2. KANAL DETAYI (Tüm Videolar & Abone Sayısı)
app.get('/api/channel/:name', (req, res) => {
    const db = readDB();
    const user = db.users.find(u => u.username.toLowerCase() === req.params.name.toLowerCase());
    const videos = db.videos.filter(v => v.channel.toLowerCase() === req.params.name.toLowerCase());
    if(!user) return res.status(404).json({message: "Yok"});
    res.json({ ...user, videos });
});

// 3. ABONE SİSTEMİ (++++)
app.post('/api/subscribe', (req, res) => {
    const { follower, target } = req.body;
    const db = readDB();
    const targetUser = db.users.find(u => u.username === target);
    const followerUser = db.users.find(u => u.username === follower);
    
    if(targetUser && followerUser) {
        const index = followerUser.subbedTo.indexOf(target);
        if(index === -1) {
            followerUser.subbedTo.push(target);
            targetUser.subs++;
        } else {
            followerUser.subbedTo.splice(index, 1);
            targetUser.subs--;
        }
        writeDB(db);
        res.json({ success: true, subs: targetUser.subs });
    }
});

// 4. YORUM VE YILDIZ (Rating)
app.post('/api/action/:id', (req, res) => {
    const { type, user, text } = req.body;
    const db = readDB();
    const video = db.videos.find(v => v.id === req.params.id);
    if(video) {
        if(type === 'comment') video.comments.push({ user, text, date: "Yeni" });
        if(type === 'like') video.likes++;
        writeDB(db);
    }
    res.json({ success: true, video });
});

// 5. AUTH & UPLOAD
app.post('/api/auth', (req, res) => {
    const { username, password } = req.body;
    const db = readDB();
    let user = db.users.find(u => u.username === username);
    if (!user) {
        user = { username, password, subs: 0, subbedTo: [], joined: "Şubat 2026" };
        db.users.push(user);
        writeDB(db);
    }
    res.json({ success: true, user });
});

app.post('/api/upload', upload.single('video'), (req, res) => {
    const db = readDB();
    const isShort = req.body.isShort === 'true';
    db.videos.unshift({
        id: "v_" + Date.now(), title: req.body.title, channel: req.body.username,
        url: `https://${req.get('host')}/uploads/${req.file.filename}`,
        views: Math.floor(Math.random()*100), likes: 0, comments: [], isShort
    });
    writeDB(db);
    res.json({ success: true });
});

app.listen(process.env.PORT || 3000, () => console.log("System Online."));
