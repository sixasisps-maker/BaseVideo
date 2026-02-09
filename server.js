const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors()); // Tarayıcı erişimi için şart
app.use(express.json());
app.use('/uploads', express.static('uploads')); // Videolara erişim sağlar

const DATA_FILE = './videos.json';

// Veritabanı dosyasını kontrol et, yoksa oluştur
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

// Uploads klasörü yoksa oluştur
if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
}

const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// VİDEOLARI LİSTELE (GET)
app.get('/videos', (req, res) => {
    const data = JSON.parse(fs.readFileSync(DATA_FILE));
    res.json(data);
});

// VİDEO YÜKLE (POST)
app.post('/upload', upload.single('video'), (req, res) => {
    if (!req.file) return res.status(400).json({ success: false });

    const videos = JSON.parse(fs.readFileSync(DATA_FILE));
    const newVideo = {
        title: req.body.title || 'İsimsiz Video',
        url: `https://${req.get('host')}/uploads/${req.file.filename}`,
        createdAt: Date.now()
    };
    
    videos.unshift(newVideo); // Yeni videoyu en üste ekle
    fs.writeFileSync(DATA_FILE, JSON.stringify(videos));
    res.json({ success: true, url: newVideo.url });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Sunucu ${PORT} portunda aktif!`));
