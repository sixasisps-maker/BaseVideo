const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

const DB_FILE = './database.json';
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({ users: [], videos: [] }));

const upload = multer({ dest: 'uploads/' });
const readDB = () => JSON.parse(fs.readFileSync(DB_FILE));
const writeDB = (data) => fs.writeFileSync(DB_FILE, JSON.stringify(data));

// ARAMA VE TRENDLER
app.get('/api/videos', (req, res) => {
    const db = readDB();
    const { q } = req.query;
    let list = db.videos;
    if (q) {
        list = list.filter(v => v.title.toLowerCase().includes(q.toLowerCase()) || v.channel.toLowerCase().includes(q.toLowerCase()));
    }
    res.json(list);
});

// KANAL DETAYLARINI GETİR (Hesap Görüntüleme İçin)
app.get('/api/channel/:name', (req, res) => {
    const db = readDB();
    const user = db.users.find(u => u.username.toLowerCase() === req.params.name.toLowerCase());
    const userVideos = db.videos.filter(v => v.channel.toLowerCase() === req.params.name.toLowerCase());
    if (!user) return res.status(404).json({ message: "Kanal bulunamadı" });
    res.json({ ...user, videos: userVideos });
});

// AUTH & SUB (Önceki sistemlerin devamı...)
app.post('/api/auth', (req, res) => {
    const { username, password } = req.body;
    const db = readDB();
    let user = db.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!user) {
        user = { username, password, subs: 0, subbedTo: [], joined: new Date().toLocaleDateString('tr-TR') };
        db.users.push(user);
        writeDB(db);
    }
    res.json({ success: true, user });
});

app.post('/api/upload', upload.single('video'), (req, res) => {
    const db = readDB();
    db.videos.unshift({
        id: "vid_" + Date.now(), title: req.body.title, channel: req.body.username,
        url: `https://${req.get('host')}/uploads/${req.file.filename}`,
        views: 0, likes: 0, comments: [], date: "Bugün"
    });
    writeDB(db);
    res.json({ success: true });
});

app.listen(process.env.PORT || 3000);
