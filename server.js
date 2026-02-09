const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

const DATA_FILE = './videos.json';
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify([]));

const upload = multer({ dest: 'uploads/' });

// VİDEOLARI LİSTELE
app.get('/videos', (req, res) => {
    res.json(JSON.parse(fs.readFileSync(DATA_FILE)));
});

// VİDEO YÜKLE
app.post('/upload', upload.single('video'), (req, res) => {
    const videos = JSON.parse(fs.readFileSync(DATA_FILE));
    const newVideo = {
        id: Date.now().toString(),
        title: req.body.title || 'İsimsiz Video',
        url: `https://${req.get('host')}/uploads/${req.file.filename}`,
        views: 0,
        likes: Math.floor(Math.random() * 10),
        comments: [],
        createdAt: Date.now()
    };
    videos.unshift(newVideo);
    fs.writeFileSync(DATA_FILE, JSON.stringify(videos));
    res.json({ success: true });
});

// İZLENME ARTIR (+1)
app.post('/view/:id', (req, res) => {
    const videos = JSON.parse(fs.readFileSync(DATA_FILE));
    const v = videos.find(x => x.id === req.params.id);
    if(v) { v.views++; fs.writeFileSync(DATA_FILE, JSON.stringify(videos)); }
    res.json({ success: true, views: v ? v.views : 0 });
});

// YORUM EKLE
app.post('/comment/:id', (req, res) => {
    const videos = JSON.parse(fs.readFileSync(DATA_FILE));
    const v = videos.find(x => x.id === req.params.id);
    if(v) {
        v.comments.push({ user: "Anonim", text: req.body.text, date: Date.now() });
        fs.writeFileSync(DATA_FILE, JSON.stringify(videos));
    }
    res.json({ success: true });
});

app.listen(process.env.PORT || 3000);
