const API = "https://basevideo.onrender.com";

const App = {
    // 1. BAĞLANTI TESTİ (Sadece sunucu uyanık mı diye bakar)
    async checkConnection() {
        try {
            const r = await fetch(`${API}/api/videos`);
            if (!r.ok) throw new Error();
            return true;
        } catch (e) {
            return false;
        }
    },

    // 2. GİRİŞ YAPMA FONKSİYONU
    async login() {
        const username = document.getElementById('user-in').value;
        const password = document.getElementById('pass-in').value;
        const btn = document.querySelector('#login-screen button');

        if(!username || !password) return alert("Lütfen boş alan bırakmayın!");

        btn.innerText = "GİRİŞ YAPILIYOR...";
        btn.disabled = true;

        try {
            const r = await fetch(`${API}/api/login`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ username, password })
            });

            if (r.ok) {
                const res = await r.json();
                localStorage.setItem('bv_user', JSON.stringify(res.user));
                this.showApp();
            } else {
                alert("Kullanıcı adı veya şifre hatalı!");
                btn.innerText = "GİRİŞ YAP";
                btn.disabled = false;
            }
        } catch (e) {
            this.showError();
        }
    },

    // EKRANLARI GÖSTERME
    showApp() {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('error-screen').style.display = 'none';
        document.getElementById('main-app').style.display = 'block';
        this.loadFeed(); // Videoları yükle
    },

    showError() {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('main-app').style.display = 'none';
        document.getElementById('error-screen').style.display = 'flex';
    }
};

// --- KRİTİK AÇILIŞ MANTIĞI ---
window.onload = async () => {
    // Önce interneti/sunucuyu kontrol et
    const isConnected = await App.checkConnection();

    if (!isConnected) {
        // Sunucu kapalıysa veya internet yoksa direkt hata ekranı
        App.showError();
    } else {
        // Sunucu varsa, kullanıcı daha önce giriş yapmış mı bak
        const savedUser = localStorage.getItem('bv_user');
        
        if (savedUser) {
            // Kayıtlıysa içeri al
            App.showApp();
        } else {
            // Kayıtlı değilse login ekranında bırak
            document.getElementById('login-screen').style.display = 'flex';
        }
    }
};
