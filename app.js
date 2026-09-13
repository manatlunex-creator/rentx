// Firebase Konfiqurasiyası
const firebaseConfig = {
    databaseURL: "https://rentx-8849b-default-rtdb.firebaseio.com/"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Splash Screen Animation removal
setTimeout(() => {
    const splash = document.getElementById('splash-screen');
    splash.style.opacity = '0';
    setTimeout(() => splash.style.display = 'none', 500);
}, 2000);

let currentUser = {
    id: 'user_' + Math.floor(Math.random() * 1000000),
    name: 'İstifadəçi ' + Math.floor(Math.random() * 1000),
    balance: 0,
    bonus: 0,
    joinDate: '23.01.2026'
};

if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe?.user) {
    let tgUser = window.Telegram.WebApp.initDataUnsafe.user;
    currentUser.id = tgUser.id;
    currentUser.name = tgUser.first_name + (tgUser.last_name ? ' ' + tgUser.last_name : '');
}

document.getElementById('profile-name').innerText = currentUser.name;
document.getElementById('join-date').innerText = currentUser.joinDate;

// Real-time User Data Sync
db.ref('users/' + currentUser.id).on('value', (snapshot) => {
    let data = snapshot.val();
    if (data) {
        currentUser.balance = data.balance || 0;
        currentUser.bonus = data.bonus || 0;
        document.getElementById('user-balance').innerText = currentUser.balance.toFixed(2) + ' ₼';
        document.getElementById('user-bonus').innerText = currentUser.bonus.toFixed(2) + ' ₼';
    } else {
        db.ref('users/' + currentUser.id).set({
            name: currentUser.name,
            balance: 0,
            bonus: 0,
            joinDate: currentUser.joinDate
        });
    }
});

// Admin Kartlarını Çəkib Random Biri Seçmək
let selectedDepositCard = "";
db.ref('admin_cards').on('value', (snapshot) => {
    let cards = snapshot.val();
    let cardInfoEl = document.getElementById('target-card-info');
    if (cards) {
        let cardList = Object.values(cards);
        if (cardList.length > 0) {
            let randomIndex = Math.floor(Math.random() * cardList.length);
            selectedDepositCard = cardList[randomIndex].title;
            cardInfoEl.innerText = selectedDepositCard;
        } else {
            selectedDepositCard = "Təyin olunmuş kart yoxdur";
            cardInfoEl.innerText = "Hazırda aktiv kart mövcud deyil.";
        }
    } else {
        selectedDepositCard = "Təyin olunmuş kart yoxdur";
        cardInfoEl.innerText = "Hazırda aktiv kart mövcud deyil.";
    }
});

// Tab Switching
function switchTab(tabName, element) {
    document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    
    document.getElementById(tabName + '-section').classList.add('active');
    element.classList.add('active');
}

// Elan Əlavə Etmək
document.getElementById('ad-form').addEventListener('submit', function(e) {
    e.preventDefault();
    let adId = Math.floor(100000 + Math.random() * 900000);
    let adData = {
        id: adId,
        userId: currentUser.id,
        userName: currentUser.name,
        game: document.getElementById('ad-game').value,
        durationType: document.getElementById('ad-duration-type').value,
        price: document.getElementById('ad-price').value,
        notes: document.getElementById('ad-notes').value,
        images: document.getElementById('ad-images').value,
        status: 'Elan baxışdadır',
        views: 0,
        isRented: false,
        date: new Date().toLocaleString()
    };

    db.ref('ads/' + adId).set(adData).then(() => {
        alert('Elanınız təsdiq üçün göndərildi!');
        document.getElementById('ad-form').reset();
        switchTab('home', document.querySelector('.nav-item'));
    });
});

// Elanları Dinləmək və Göstərmək
db.ref('ads').on('value', (snapshot) => {
    let adsList = document.getElementById('ads-list');
    adsList.innerHTML = '';
    let ads = snapshot.val();
    if (ads) {
        Object.values(ads).forEach(ad => {
            if (ad.status === 'Elan əlavə edildi') {
                adsList.innerHTML += `
                    <div class="card">
                        <span class="badge">Elan №: ${ad.id}</span>
                        <h4 style="margin-top: 8px;">${ad.game} (${ad.durationType}) - ${ad.price} AZN</h4>
                        <p style="font-size: 13px; color: var(--text-gray); margin: 5px 0;">${ad.notes}</p>
                        <p style="font-size: 11px;">Paylaşdı: ${ad.userName} | Baxış: ${ad.views}</p>
                        ${ad.userId === currentUser.id ? `<button onclick="deleteAd(${ad.id})" style="background:var(--primary-red); border:none; color:white; padding:5px 10px; border-radius:4px; margin-top:8px; cursor:pointer;">Sil</button>` : ''}
                    </div>
                `;
            }
        });
    }
});

function deleteAd(id) {
    if(confirm('Elanı silmək istədiyinizə əminsiniz?')) {
        db.ref('ads/' + id).remove();
    }
}

// Depozit Göndərmək
function makeDeposit() {
    let amount = parseFloat(document.getElementById('deposit-amount').value);
    let receipt = document.getElementById('deposit-receipt').value;
    if(!amount || amount < 1 || amount > 100) {
        alert('Minimum 1 AZN, maksimum 100 AZN daxil edin!');
        return;
    }
    if(!selectedDepositCard || selectedDepositCard.includes("yoxdur")) {
        alert('Ödəniş üçün kart təyin edilməyib!');
        return;
    }
    let depId = 'dep_' + Date.now();
    db.ref('deposits/' + depId).set({
        id: depId,
        userId: currentUser.id,
        userName: currentUser.name,
        amount: amount,
        cardUsed: selectedDepositCard,
        receipt: receipt,
        status: 'Gözləmədədir',
        date: new Date().toLocaleString()
    }).then(() => {
        alert('Depozit sorğusu yaradıldı!');
        document.getElementById('deposit-amount').value = '';
        document.getElementById('deposit-receipt').value = '';
    });
}

// Çıxarış Etmək
function makeWithdraw() {
    let amount = parseFloat(document.getElementById('withdraw-amount').value);
    let card = document.getElementById('withdraw-card').value;
    
    if(!amount || amount < 3 || amount > 50) {
        alert('Minimum 3 AZN, maksimum 50 AZN çıxara bilərsiniz!');
        return;
    }
    if(amount > currentUser.balance) {
        alert('Balansda kifayət qədər vəsait yoxdur!');
        return;
    }

    let withId = 'with_' + Date.now();
    db.ref('withdrawals/' + withId).set({
        id: withId,
        userId: currentUser.id,
        userName: currentUser.name,
        amount: amount,
        card: card,
        status: 'Emal edilir',
        date: new Date().toLocaleString()
    }).then(() => {
        alert('Çıxarış sorğusu göndərildi!');
        document.getElementById('withdraw-amount').value = '';
        document.getElementById('withdraw-card').value = '';
    });
}

// Dəstək Sorğusu
document.getElementById('support-form').addEventListener('submit', function(e) {
    e.preventDefault();
    let msg = document.getElementById('support-message').value;
    let ticketId = 'tic_' + Date.now();
    
    db.ref('support/' + ticketId).set({
        id: ticketId,
        userId: currentUser.id,
        userName: currentUser.name,
        message: msg,
        reply: 'Hələ cavab verilməyib',
        status: 'Gözləmədədir',
        date: new Date().toLocaleString()
    }).then(() => {
        alert('Sorğu göndərildi!');
        document.getElementById('support-message').value = '';
    });
});

function copyInviteLink() {
    navigator.clipboard.writeText(`https://t.me/RentXBot?start=${currentUser.id}`);
    alert('Dəvət linki kopyalandı!');
}

function rateApp(stars) {
    alert(`Təşəkkürlər! ${stars} ulduz qeydə alındı.`);
}
