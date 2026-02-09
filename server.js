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

app.get('/videos', (req, res) => {
    res.json(JSON.parse(fs.readFileSync(DATA_FILE)));
});

app.post('/upload', upload.single('video'), (req, res) => {
    const videos = JSON.parse(fs.readFileSync(DATA_FILE));
    const newVideo = {
        id: Date.now().toString(),
        title: req.body.title || 'İsimsiz Video',
        channelName: req.body.channel || 'Anonim Kanal',
        url: `https://${req.get('host')}/uploads/${req.file.filename}`,
        views: 0,
        likes: 0,
        shares: 0,
        comments: [],
        createdAt: Date.now()
    };
    videos.unshift(newVideo);
    fs.writeFileSync(DATA_FILE, JSON.stringify(videos));
    res.json({ success: true });
});

// BEĞENİ ARTIR
app.post('/like/:id', (req, res) => {
    const videos = JSON.parse(fs.readFileSync(DATA_FILE));
    const v = videos.find(x => x.id === req.params.id);
    if(v) { v.likes++; fs.writeFileSync(DATA_FILE, JSON.stringify(videos)); }
    res.json({ success: true, likes: v ? v.likes : 0 });
});

// İZLENME ARTIR
app.post('/view/:id', (req, res) => {
    const videos = JSON.parse(fs.readFileSync(DATA_FILE));
    const v = videos.find(x => x.id === req.params.id);
    if(v) { v.views++; fs.writeFileSync(DATA_FILE, JSON.stringify(videos)); }
    res.json({ success: true });
});

app.listen(process.env.PORT || 3000);
