const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Klasör yoksa oluştur
if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');

const DB_FILE = './database.json';
const db = {
    read: () => JSON.parse(fs.readFileSync(DB_FILE, 'utf8') || '{"videos":[]}'),
    save: (data) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2))
};

// VİDEO YÜKLEME AYARI
const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// YÜKLEME FONKSİYONU
app.post('/api/upload', upload.single('video'), (req, res) => {
    const data = db.read();
    const newVideo = {
        id: Date.now(),
        title: req.body.title || "Başlıksız Video",
        author: req.body.username || "BasePost A.Ş",
        url: `/uploads/${req.file.filename}`,
        views: 0,
        likes: 0,
        comments: [],
        date: new Date().toLocaleDateString('tr-TR')
    };
    data.videos.unshift(newVideo); // Yeni videoyu en başa ekle
    db.save(data);
    res.json({ success: true });
});

app.get('/api/videos', (req, res) => res.json(db.read().videos));
app.listen(3000, () => console.log("Sunucu 3000'de hazır!"));
