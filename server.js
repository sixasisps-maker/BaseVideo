const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

const DATA_FILE = './database.json';

// Veritabanı başlatma
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

// Uploads klasörü kontrolü
if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');

const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// 1. Tüm Videoları Getir
app.get('/api/videos', (req, res) => {
    const data = JSON.parse(fs.readFileSync(DATA_FILE));
    res.json(data);
});

// 2. Video Yükle
app.post('/api/upload', upload.single('video'), (req, res) => {
    const data = JSON.parse(fs.readFileSync(DATA_FILE));
    const newVideo = {
        id: "vid_" + Date.now(),
        title: req.body.title || 'Adsız Nostalji',
        channel: req.body.channel || 'Anonim Kullanıcı',
        url: `https://${req.get('host')}/uploads/${req.file.filename}`,
        views: 0,
        likes: 0,
        comments: [],
        timestamp: new Date().toLocaleDateString('tr-TR')
    };
    data.unshift(newVideo);
    fs.writeFileSync(DATA_FILE, JSON.stringify(data));
    res.json({ success: true, video: newVideo });
});

// 3. İzlenme Artır (+1)
app.post('/api/view/:id', (req, res) => {
    const data = JSON.parse(fs.readFileSync(DATA_FILE));
    const video = data.find(v => v.id === req.params.id);
    if (video) {
        video.views++;
        fs.writeFileSync(DATA_FILE, JSON.stringify(data));
    }
    res.json({ success: true, views: video ? video.views : 0 });
});

// 4. Beğeni Artır (+1)
app.post('/api/like/:id', (req, res) => {
    const data = JSON.parse(fs.readFileSync(DATA_FILE));
    const video = data.find(v => v.id === req.params.id);
    if (video) {
        video.likes++;
        fs.writeFileSync(DATA_FILE, JSON.stringify(data));
    }
    res.json({ success: true, likes: video ? video.likes : 0 });
});

// 5. Yorum Ekle
app.post('/api/comment/:id', (req, res) => {
    const data = JSON.parse(fs.readFileSync(DATA_FILE));
    const video = data.find(v => v.id === req.params.id);
    if (video) {
        video.comments.push({
            user: "User_" + Math.floor(Math.random() * 999),
            text: req.body.text,
            time: "Şimdi"
        });
        fs.writeFileSync(DATA_FILE, JSON.stringify(data));
    }
    res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`BaseVideo Sunucusu ${PORT} portunda fena çalışıyor!`));
