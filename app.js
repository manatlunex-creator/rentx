// Firebase Konfiqurasiyası
const firebaseConfig = {
    databaseURL: "https://rentx-8849b-default-rtdb.firebaseio.com/"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Arxa fonda hərəkət edən PUBG elementləri
function createFloatingPUBGElements() {
    const container = document.getElementById('bg-animations');
    const pubgTexts = ['M416 🔥', 'AWM 🎯', 'UC 💎', 'LEVEL 3 🛡️', 'PUBG MOBILE 🎮', 'KILL 💀', 'AIRDROP 📦', 'PAN 🍳'];
    setInterval(() => {
        const span = document.createElement('span');
        span.className = 'floating-pubg';
        span.innerText = pubgTexts[Math.floor(Math.random() * pubgTexts.length)];
        span.style.left = Math.random() * 90 + 'vw';
        span.style.animationDuration = (8 + Math.random() * 6) + 's';
        container.appendChild(span);
        setTimeout(() => span.remove(), 14000);
    }, 1500);
}
createFloatingPUBGElements();

// Xüsusi Sayt Bildirişi
function showCustomAlert(text) {
    let alertBox = document.getElementById('custom-alert');
    alertBox.innerText = text;
    alertBox.classList.add('show');
    setTimeout(() => {
        alertBox.classList.remove('show');
    }, 3000);
}

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
    joinDate: '23.01.2026',
    avatar: ''
};

if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe?.user) {
    let tgUser = window.Telegram.WebApp.initDataUnsafe.user;
    currentUser.id = 'tg_' + tgUser.id;
    currentUser.name = tgUser.first_name + (tgUser.last_name ? ' ' + tgUser.last_name : '');
}

// Real-time User Data Sync
db.ref('users/' + currentUser.id).on('value', (snapshot) => {
    let data = snapshot.val();
    if (data) {
        currentUser.balance = data.balance || 0;
        currentUser.bonus = data.bonus || 0;
        currentUser.avatar = data.avatar || '';
        currentUser.name = data.name || currentUser.name;
        document.getElementById('profile-name').innerText = currentUser.name;
        document.getElementById('user-balance').innerText = '₼ ' + currentUser.balance.toFixed(2);
        document.getElementById('home-user-balance').innerText = '₼ ' + currentUser.balance.toFixed(2);
        document.getElementById('user-bonus').innerText = '₼ ' + currentUser.bonus.toFixed(2);
        if(currentUser.avatar) {
            document.getElementById('user-avatar').src = currentUser.avatar;
        }
    } else {
        db.ref('users/' + currentUser.id).set({
            name: currentUser.name,
            balance: 0,
            bonus: 0,
            joinDate: currentUser.joinDate,
            avatar: ''
        });
    }
    document.getElementById('join-date').innerText = currentUser.joinDate;
});

// İstifadəçi adını dəyişmək (Eyni adı başqasının qoymasını yoxlamaqla)
function changeUsernamePrompt() {
    let newName = prompt("Yeni istifadəçi adınızı daxil edin:", currentUser.name);
    if (!newName || newName.trim() === "") return;
    newName = newName.trim();

    if(newName === currentUser.name) return;

    // Bütün istifadəçiləri yoxla ki, bu ad başqasında var ya yox
    db.ref('users').once('value', snapshot => {
        let allUsers = snapshot.val();
        let nameExists = false;
        if(allUsers) {
            Object.values(allUsers).forEach(u => {
                if(u.name && u.name.toLowerCase() === newName.toLowerCase()) {
                    nameExists = true;
                }
            });
        }

        if(nameExists) {
            showCustomAlert('Bu istifadəçi adı artıq başqası tərəfindən istifadə olunur! Başqa ad seçin.');
        } else {
            db.ref('users/' + currentUser.id + '/name').set(newName).then(() => {
                currentUser.name = newName;
                document.getElementById('profile-name').innerText = newName;
                showCustomAlert('İstifadəçi adı uğurla dəyişdirildi!');
            });
        }
    });
}

// Profil Şəklini Qalereyadan Seçib Yükləmək
function updateProfileAvatar(input) {
    if (input.files && input.files[0]) {
        let reader = new FileReader();
        reader.onload = function(e) {
            let base64Img = e.target.result;
            db.ref('users/' + currentUser.id + '/avatar').set(base64Img).then(() => {
                showCustomAlert('Profil şəkli yeniləndi!');
            });
        }
        reader.readAsDataURL(input.files[0]);
    }
}

// Modal Pəncərə İdarəsi
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Balans Əlavə Et Mərhələləri (Random Kart Seçimi)
let selectedDepositCard = "";
let currentDepositAmount = 0;

function proceedToCard() {
    let amount = parseFloat(document.getElementById('deposit-amount').value);
    if(!amount || amount < 1 || amount > 100) {
        showCustomAlert('Minimum 1 AZN, maksimum 100 AZN daxil edin!');
        return;
    }
    currentDepositAmount = amount;

    // Admin kartlarından random birini seçmək
    db.ref('admin_cards').once('value', (snapshot) => {
        let cards = snapshot.val();
        if (cards) {
            let cardList = Object.values(cards);
            if (cardList.length > 0) {
                let randomIndex = Math.floor(Math.random() * cardList.length);
                selectedDepositCard = cardList[randomIndex].title;
                document.getElementById('target-card-info').innerText = selectedDepositCard;
                document.getElementById('step-amount-box').style.display = 'none';
                document.getElementById('step-card-box').style.display = 'block';
            } else {
                showCustomAlert('Hazırda aktiv ödəniş kartı mövcud deyil. Adminə müraciət edin.');
            }
        } else {
            showCustomAlert('Hazırda aktiv ödəniş kartı mövcud deyil. Adminə müraciət edin.');
        }
    });
}

function makeDeposit() {
    let receipt = document.getElementById('deposit-receipt').value;
    if(!receipt) {
        showCustomAlert('Zəhmət olmasa ödəniş qəbzini daxil edin!');
        return;
    }
    let depId = 'dep_' + Date.now();
    db.ref('deposits/' + depId).set({
        id: depId,
        userId: currentUser.id,
        userName: currentUser.name,
        amount: currentDepositAmount,
        cardUsed: selectedDepositCard,
        receipt: receipt,
        status: 'Gözləmədədir',
        date: new Date().toLocaleString()
    }).then(() => {
        showCustomAlert('Depozit sorğusu yaradıldı!');
        closeModal('deposit-modal');
        document.getElementById('deposit-amount').value = '';
        document.getElementById('deposit-receipt').value = '';
        document.getElementById('step-amount-box').style.display = 'block';
        document.getElementById('step-card-box').style.display = 'none';
    });
}

// Çıxarış Etmək
function makeWithdraw() {
    let amount = parseFloat(document.getElementById('withdraw-amount').value);
    let card = document.getElementById('withdraw-card').value;
    
    if(!amount || amount < 3 || amount > 50) {
        showCustomAlert('Minimum 3 AZN, maksimum 50 AZN çıxara bilərsiniz!');
        return;
    }
    if(amount > currentUser.balance) {
        showCustomAlert('Balansda kifayət qədər vəsait yoxdur!');
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
        showCustomAlert('Çıxarış sorğusu göndərildi!');
        closeModal('withdraw-modal');
        document.getElementById('withdraw-amount').value = '';
        document.getElementById('withdraw-card').value = '';
    });
}

// Tab Switching
function switchTab(tabName, element) {
    document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    
    document.getElementById(tabName + '-section').classList.add('active');
    element.classList.add('active');
}

// Elan Əlavə Etmək (Təsdiqlə düyməsi problemi həll olundu)
document.getElementById('ad-form').addEventListener('submit', function(e) {
    e.preventDefault();
    let fileInput = document.getElementById('ad-images-file');
    
    if(fileInput.files && fileInput.files[0]) {
        let reader = new FileReader();
        reader.onload = function(event) {
            let base64Image = event.target.result;
            saveAdToDB(base64Image);
        }
        reader.readAsDataURL(fileInput.files[0]);
    } else {
        saveAdToDB('');
    }
});

function saveAdToDB(imgData) {
    let adId = Math.floor(100000 + Math.random() * 900000);
    let adData = {
        id: adId,
        userId: currentUser.id,
        userName: currentUser.name,
        game: document.getElementById('ad-game').value,
        durationType: document.getElementById('ad-duration-type').value,
        price: document.getElementById('ad-price').value,
        notes: document.getElementById('ad-notes').value,
        image: imgData,
        status: 'Elan baxışdadır',
        views: 0,
        isRented: false,
        date: new Date().toLocaleString()
    };

    db.ref('ads/' + adId).set(adData).then(() => {
        showCustomAlert('Elanınız təsdiq üçün göndərildi!');
        document.getElementById('ad-form').reset();
        switchTab('home', document.querySelector('.nav-item'));
    });
}

// Elanları Dinləmək və Göstərmək (Sayt xəbərdarlığı ilə)
db.ref('ads').on('value', (snapshot) => {
    let adsList = document.getElementById('ads-list');
    adsList.innerHTML = '';
    let ads = snapshot.val();
    if (ads) {
        Object.values(ads).forEach(ad => {
            if (ad.status === 'Elan əlavə edildi') {
                adsList.innerHTML += `
                    <div class="card" onclick="viewAd(${ad.id})" style="cursor:pointer;">
                        <span class="badge">Elan №: ${ad.id}</span>
                        ${ad.image ? `<img src="${ad.image}" style="width:100%; height:140px; object-fit:cover; border-radius:8px; margin-top:8px;" onerror="this.style.display='none'">` : ''}
                        <h4 style="margin-top: 8px;">${ad.game} (${ad.durationType}) - ${ad.price} AZN</h4>
                        <p style="font-size: 13px; color: var(--text-gray); margin: 5px 0;">${ad.notes}</p>
                        <p style="font-size: 11px;">Paylaşdı: ${ad.userName} | Baxış: ${ad.views}</p>
                        ${ad.userId === currentUser.id ? `<button onclick="event.stopPropagation(); deleteAd(${ad.id})" style="background:var(--primary-red); border:none; color:white; padding:5px 10px; border-radius:4px; margin-top:8px; cursor:pointer;">Sil</button>` : ''}
                    </div>
                `;
            }
        });
    }
});

function viewAd(id) {
    showCustomAlert("Diqqət: Sayt içi alışverişə zəmanət verilir, kənar tətbiqlərdə alışverişə cavabdeh deyilik!");
    db.ref('ads/' + id + '/views').transaction(views => (views || 0) + 1);
}

function deleteAd(id) {
    if(confirm('Elanı silmək istədiyinizə əminsiniz?')) {
        db.ref('ads/' + id).remove();
        showCustomAlert('Elan silindi.');
    }
}

// Dəstək Sorğusu
document.getElementById('support-form').addEventListener('submit', function(e) {
    e.preventDefault();
    let category = document.getElementById('support-category').value;
    let msg = document.getElementById('support-message').value;
    let ticketId = 'tic_' + Date.now();
    
    db.ref('support/' + ticketId).set({
        id: ticketId,
        userId: currentUser.id,
        userName: currentUser.name,
        category: category,
        message: msg,
        reply: 'Hələ cavab verilməyib',
        status: 'Gözləmədədir',
        date: new Date().toLocaleString()
    }).then(() => {
        showCustomAlert('Dəstək sorğunuz göndərildi!');
        document.getElementById('support-message').value = '';
    });
});

// Dəvət Linki
function copyInviteLink() {
    let inviteUrl = `https://t.me/RentXBot?start=${currentUser.id}`;
    navigator.clipboard.writeText(inviteUrl);
    showCustomAlert('Dəvət linki kopyalandı! Hər dost üçün 5 ₼ bonus balansına toplanacaq.');
}

function rateSeller(stars) {
    showCustomAlert(`Təşəkkürlər! Satıcıya ${stars} ulduz verdiniz.`);
}
