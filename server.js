const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// İzinleri açıyoruz (Hata almamak için şart)
app.use(cors());
app.use(express.json());

// Videoların yükleneceği klasörü oluştur
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Video yükleme ayarları
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        // Dosya ismini benzersiz yap
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB sınır
});

// Videolara dışarıdan erişim izni ver
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Test rotası
app.get('/', (req, res) => {
    res.send('BaseVideo Sunucusu Aktif! 🚀');
});

// VİDEO YÜKLEME KOMUTU
app.post('/upload', upload.single('video'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Dosya seçilmedi!' });
    }

    // Videonun internetteki tam linkini oluştur
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.get('host');
    const videoUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

    res.json({ url: videoUrl });
});

app.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor.`);
});
