const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Büyük video dosyaları için limitleri artırıyoruz
app.use(cors());
app.use(express.json({limit: '100mb'}));
app.use(express.urlencoded({limit: '100mb', extended: true}));
app.use('/uploads', express.static('uploads'));

// Veritabanı ve Klasör Hazırlığı
const DB_FILE = './database.json';
if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({videos:[]}));

const db = {
    read: () => JSON.parse(fs.readFileSync(DB_FILE, 'utf8')),
    save: (data) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2))
};

// Multer Video Yükleme Ayarı
const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// API Rotaları
app.get('/api/videos', (req, res) => res.json(db.read().videos));

app.post('/api/upload', upload.single('video'), (req, res) => {
    const data = db.read();
    const newVid = {
        id: Date.now().toString(),
        title: req.body.title,
        author: req.body.username,
        url: `/uploads/${req.file.filename}`,
        views: 0,
        likes: 0,
        favs: 0,
        date: new Date().toLocaleDateString('tr-TR'),
        comments: []
    };
    data.videos.unshift(newVid); // Yeni videoyu en başa ekle
    db.save(data);
    res.json(newVid);
});

app.post('/api/action', (req, res) => {
    const data = db.read();
    const v = data.videos.find(x => x.id === req.body.id);
    if(v) {
        if(req.body.type === 'view') v.views++;
        if(req.body.type === 'like') v.likes++;
        if(req.body.type === 'fav') v.favs++;
        db.save(data);
    }
    res.json(v);
});

app.post('/api/comment', (req, res) => {
    const data = db.read();
    const v = data.videos.find(x => x.id === req.body.id);
    if(v) {
        v.comments.push({ user: req.body.user, text: req.body.text, date: "Az önce" });
        db.save(data);
    }
    res.json(v);
});

app.listen(PORT, () => console.log(`Sunucu ${PORT} portunda aktif.`));
