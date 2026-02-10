const API = "https://basevideo.onrender.com";
let curVid = null, userData = JSON.parse(localStorage.getItem('bv_user')), targetChannel = "";

const App = {
    // SAYFA DEĞİŞTİRME SİSTEMİ (GEÇMİŞ DESTEKLİ)
    togglePage(id, pushState = true) {
        document.querySelectorAll('.full-screen').forEach(s => s.style.display = 'none');
        const target = document.getElementById('screen-' + id);
        
        if (target) {
            target.style.display = 'flex';
            // Sayfa değişimini tarayıcı geçmişine ekle (Siyah ekranı önler)
            if (pushState) history.pushState({ page: id }, "", "#" + id);
        }

        if(id === 'comments') this.renderComs();
    },

    // VİDEO OYNATMA
    play(v) {
        curVid = v;
        this.togglePage('player');
        const player = document.getElementById('p-video');
        player.src = API + v.url;
        player.play();
        
        document.getElementById('p-title').innerText = v.title;
        document.getElementById('p-author').innerText = v.author;
        document.getElementById('p-likes').innerText = v.likes;
        document.getElementById('p-coms').innerText = v.comments.length;
        document.getElementById('p-views').innerText = v.views + " views";
        
        // Silme butonu kontrolü
        const delBtn = document.getElementById('del-btn');
        if(delBtn) delBtn.style.display = (v.author === userData.username) ? 'block' : 'none';

        fetch(`${API}/api/action`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id:v.id, type:'view'}) });
    },

    // ANA SAYFAYA DÖNÜŞ (VİDEOYU DURDURUR)
    backToHome() {
        const player = document.getElementById('p-video');
        if(player) {
            player.pause();
            player.src = ""; // Belleği temizle
        }
        this.togglePage('home');
        this.loadFeed();
    },

    // LOGOUT (SİSTEMDEN TAM ÇIKIŞ)
    logout() {
        if(confirm("Çıkış yapmak istediğine emin misin?")) {
            localStorage.clear();
            location.href = location.pathname; // Sayfayı tertemiz baştan yükle
        }
    },

    // ... diğer fonksiyonlar (loadFeed, login, upload vb.) aynı kalacak ...
};

// --- KRİTİK: TELEFONUN GERİ TUŞUNU YAKALAMA ---
window.onpopstate = function(event) {
    if (event.state && event.state.page) {
        // Eğer geri basıldıysa ve bir önceki sayfa varsa oraya dön
        App.togglePage(event.state.page, false);
        if(event.state.page === 'home') {
            document.getElementById('p-video').pause();
        }
    } else {
        // Geçmiş bittiyse login veya home'a at
        userData ? App.togglePage('home', false) : App.togglePage('login', false);
    }
};

// Başlangıç
window.onload = () => {
    if(userData) {
        App.togglePage('home');
        App.loadFeed();
    } else {
        App.togglePage('login');
    }
};
