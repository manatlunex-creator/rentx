const firebaseConfig = {
    databaseURL: "https://rentx-8849b-default-rtdb.firebaseio.com/"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

function showCustomAlert(text) {
    let alertBox = document.getElementById('custom-alert');
    alertBox.innerText = text;
    alertBox.classList.add('show');
    setTimeout(() => { alertBox.classList.remove('show'); }, 3000);
}

setTimeout(() => {
    const splash = document.getElementById('splash-screen');
    splash.style.opacity = '0';
    setTimeout(() => splash.style.display = 'none', 500);
}, 1500);

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
        if(currentUser.avatar) document.getElementById('user-avatar').src = currentUser.avatar;
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

function changeUsernamePrompt() {
    let newName = prompt("Yeni istifadəçi adınızı daxil edin:", currentUser.name);
    if (!newName || newName.trim() === "") return;
    newName = newName.trim();
    if(newName === currentUser.name) return;

    db.ref('users').once('value', snapshot => {
        let allUsers = snapshot.val();
        let nameExists = false;
        if(allUsers) {
            Object.values(allUsers).forEach(u => {
                if(u.name && u.name.toLowerCase() === newName.toLowerCase()) nameExists = true;
            });
        }
        if(nameExists) {
            showCustomAlert('Bu istifadəçi adı artıq başqası tərəfindən istifadə olunur!');
        } else {
            db.ref('users/' + currentUser.id + '/name').set(newName).then(() => {
                currentUser.name = newName;
                document.getElementById('profile-name').innerText = newName;
                showCustomAlert('İstifadəçi adı dəyişdirildi!');
            });
        }
    });
}

function updateProfileAvatar(input) {
    if (input.files && input.files[0]) {
        let reader = new FileReader();
        reader.onload = function(e) {
            db.ref('users/' + currentUser.id + '/avatar').set(e.target.result).then(() => {
                showCustomAlert('Profil şəkli yeniləndi!');
            });
        }
        reader.readAsDataURL(input.files[0]);
    }
}

function openModal(modalId) { document.getElementById(modalId).style.display = 'flex'; }
function closeModal(modalId) { document.getElementById(modalId).style.display = 'none'; }

let selectedDepositCard = "";
let currentDepositAmount = 0;

function proceedToCard() {
    let amount = parseFloat(document.getElementById('deposit-amount').value);
    if(!amount || amount < 1 || amount > 100) {
        showCustomAlert('Minimum 1 AZN, maksimum 100 AZN daxil edin!');
        return;
    }
    currentDepositAmount = amount;
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
                showCustomAlert('Aktiv ödəniş kartı yoxdur.');
            }
        } else {
            showCustomAlert('Aktiv ödəniş kartı yoxdur.');
        }
    });
}

function makeDeposit() {
    let receipt = document.getElementById('deposit-receipt').value;
    if(!receipt) { showCustomAlert('Qəbzi daxil edin!'); return; }
    let depId = 'dep_' + Date.now();
    db.ref('deposits/' + depId).set({
        id: depId, userId: currentUser.id, userName: currentUser.name,
        amount: currentDepositAmount, cardUsed: selectedDepositCard,
        receipt: receipt, status: 'Gözləmədədir', date: new Date().toLocaleString()
    }).then(() => {
        showCustomAlert('Depozit sorğusu yaradıldı!');
        closeModal('deposit-modal');
        document.getElementById('deposit-amount').value = '';
        document.getElementById('deposit-receipt').value = '';
        document.getElementById('step-amount-box').style.display = 'block';
        document.getElementById('step-card-box').style.display = 'none';
    });
}

function makeWithdraw() {
    let amount = parseFloat(document.getElementById('withdraw-amount').value);
    let card = document.getElementById('withdraw-card').value;
    if(!amount || amount < 3 || amount > 50) { showCustomAlert('3 - 50 AZN arası daxil edin!'); return; }
    if(amount > currentUser.balance) { showCustomAlert('Balansda kifayət qədər vəsait yoxdur!'); return; }

    let withId = 'with_' + Date.now();
    db.ref('withdrawals/' + withId).set({
        id: withId, userId: currentUser.id, userName: currentUser.name,
        amount: amount, card: card, status: 'Emal edilir', date: new Date().toLocaleString()
    }).then(() => {
        showCustomAlert('Çıxarış sorğusu göndərildi!');
        closeModal('withdraw-modal');
        document.getElementById('withdraw-amount').value = '';
        document.getElementById('withdraw-card').value = '';
    });
}

function switchTab(tabName, element) {
    document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    document.getElementById(tabName + '-section').classList.add('active');
    element.classList.add('active');
}

// Elan Əlavə Etmə
document.getElementById('ad-form').addEventListener('submit', function(e) {
    e.preventDefault();
    let fileInput = document.getElementById('ad-images-file');
    if(fileInput.files && fileInput.files[0]) {
        let reader = new FileReader();
        reader.onload = function(event) { saveAdToDB(event.target.result); }
        reader.readAsDataURL(fileInput.files[0]);
    } else { saveAdToDB(''); }
});

function saveAdToDB(imgData) {
    let adId = Math.floor(100000 + Math.random() * 900000);
    let adData = {
        id: adId, userId: currentUser.id, userName: currentUser.name,
        game: document.getElementById('ad-game').value,
        durationType: document.getElementById('ad-duration-type').value,
        price: document.getElementById('ad-price').value,
        notes: document.getElementById('ad-notes').value,
        image: imgData, status: 'Elan baxışdadır', views: 0,
        date: new Date().toLocaleString()
    };
    db.ref('ads/' + adId).set(adData).then(() => {
        showCustomAlert('Elan təsdiqə göndərildi!');
        document.getElementById('ad-form').reset();
        switchTab('home', document.querySelector('.nav-item'));
    });
}

// Canlı Elanlar və Tap.az Stilində Detal Açılması
db.ref('ads').on('value', (snapshot) => {
    let adsList = document.getElementById('ads-list');
    adsList.innerHTML = '';
    let ads = snapshot.val();
    if (ads) {
        Object.values(ads).forEach(ad => {
            if (ad.status === 'Elan əlavə edildi') {
                adsList.innerHTML += `
                    <div class="card" onclick="openAdDetail('${ad.id}')" style="cursor:pointer;">
                        <span class="badge">Elan №: ${ad.id}</span>
                        ${ad.image ? `<img src="${ad.image}" style="width:100%; height:140px; object-fit:cover; border-radius:8px; margin-top:8px;" onerror="this.style.display='none'">` : ''}
                        <h4 style="margin-top: 8px;">${ad.game} (${ad.durationType}) - ${ad.price} AZN</h4>
                        <p style="font-size: 13px; color: var(--text-gray); margin: 5px 0;">${ad.notes}</p>
                        <p style="font-size: 11px;">Satıcı: <b style="color:var(--primary-red);">${ad.userName}</b> | Baxış: ${ad.views}</p>
                    </div>
                `;
            }
        });
    }
});

function openAdDetail(id) {
    db.ref('ads/' + id).once('value', snapshot => {
        let ad = snapshot.val();
        if(!ad) return;
        db.ref('ads/' + id + '/views').transaction(v => (v || 0) + 1);

        let modalBody = document.getElementById('ad-detail-body');
        modalBody.innerHTML = `
            <span class="badge">Elan №: ${ad.id}</span>
            <h3 style="margin-top:10px; color:var(--primary-red);">${ad.game} - ${ad.price} AZN (${ad.durationType})</h3>
            ${ad.image ? `<img src="${ad.image}" style="width:100%; height:200px; object-fit:cover; border-radius:8px; margin-top:10px;">` : ''}
            <p style="margin-top:10px; font-size:14px;"><b>Məlumat:</b> ${ad.notes}</p>
            <div style="background:#1a1a1a; padding:12px; border-radius:8px; margin-top:15px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <p style="font-size:12px; color:var(--text-gray);">Satıcı:</p>
                    <h4 style="cursor:pointer; color:var(--primary-red);" onclick="contactSeller('${ad.userId}', '${ad.userName}')">${ad.userName} <i class="fa-solid fa-message"></i></h4>
                </div>
                <button onclick="buyAccount('${ad.id}', '${ad.userName}', '${ad.game}', ${ad.price})" class="neon-btn" style="width:auto; padding:8px 15px;">Hesabı Al</button>
            </div>
        `;
        openModal('ad-detail-modal');
    });
}

function contactSeller(sellerId, sellerName) {
    if(sellerId === currentUser.id) {
        showCustomAlert('Bu sizin öz elanınızdır!');
        return;
    }
    closeModal('ad-detail-modal');
    switchTab('chat', document.querySelectorAll('.nav-item')[3]);
    document.getElementById('chat-status-text').style.display = 'none';
    document.getElementById('chat-box').style.display = 'block';
    document.getElementById('chat-with-user').innerText = 'Söhbət: ' + sellerName;
    window.activeChatId = [currentUser.id, sellerId].sort().join('_');
    loadMessages();
}

function buyAccount(adId, sellerName, gameName, price) {
    if(currentUser.balance < price) {
        showCustomAlert('Balansınızda kifayət qədər vəsait yoxdur! Balans artırın.');
        return;
    }
    if(confirm(`${price} AZN ödəniş edərək bu hesabı almaq istədiyinizə əminsiniz?`)) {
        let orderId = 'ord_' + Date.now();
        let orderData = {
            id: orderId,
            adId: adId,
            sellerName: sellerName,
            game: gameName,
            price: price,
            date: new Date().toLocaleString(),
            userId: currentUser.id
        };
        db.ref('users/' + currentUser.id + '/balance').transaction(b => b - price);
        db.ref('orders/' + currentUser.id + '/' + orderId).set(orderData).then(() => {
            showCustomAlert('Hesab uğurla alındı! Sifarişlərim bölməsinə əlavə olundu.');
            closeModal('ad-detail-modal');
            db.ref('ads/' + adId).remove();
        });
    }
}

// Sifarişlərimi Real-time izləmək
db.ref('orders').on('value', () => {
    loadMyOrders();
});

function loadMyOrders() {
    db.ref('orders/' + currentUser.id).on('value', snapshot => {
        let container = document.getElementById('my-orders-list');
        container.innerHTML = '';
        let orders = snapshot.val();
        if(orders) {
            Object.values(orders).forEach(ord => {
                container.innerHTML += `
                    <div style="background:#1a1a1a; padding:10px; margin-top:8px; border-radius:6px; font-size:13px;">
                        <p><b>Oyun:</b> ${ord.game} | <b>Qiymət:</b> ${ord.price} AZN</p>
                        <p><b>Satıcı:</b> ${ord.sellerName}</p>
                        <p style="color:var(--text-gray); font-size:11px; margin-top:4px;">Tarix: ${ord.date}</p>
                    </div>
                `;
            });
        } else {
            container.innerHTML = '<p style="color:var(--text-gray); font-size:13px;">Hələ heç bir sifarişiniz yoxdur.</p>';
        }
    });
}

// Chat Mesajlaşma Məntiqi
function loadMessages() {
    if(!window.activeChatId) return;
    db.ref('chats/' + window.activeChatId).on('value', snapshot => {
        let msgList = document.getElementById('messages-list');
        msgList.innerHTML = '';
        let msgs = snapshot.val();
        if(msgs) {
            Object.values(msgs).forEach(m => {
                let isMe = m.senderId === currentUser.id;
                msgList.innerHTML += `
                    <div style="margin-bottom:8px; text-align:${isMe ? 'right' : 'left'};">
                        <span style="background:${isMe ? '#8b0000' : '#222'}; padding:6px 10px; border-radius:6px; display:inline-block; font-size:13px;">${m.text}</span>
                        <div style="font-size:9px; color:#aaa; margin-top:2px;">${m.time}</div>
                    </div>
                `;
            });
            msgList.scrollTop = msgList.scrollHeight;
        }
    });
}

function sendChatMessage() {
    let input = document.getElementById('chat-input');
    let text = input.value.trim();
    if(!text || !window.activeChatId) return;
    let msgId = 'msg_' + Date.now();
    db.ref('chats/' + window.activeChatId + '/' + msgId).set({
        senderId: currentUser.id,
        text: text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }).then(() => { input.value = ''; });
}

// Satıcı Qiymətləndirmə
function rateSeller(stars) {
    let sellerName = document.getElementById('rate-seller-name').value.trim();
    if(!sellerName) {
        showCustomAlert('Zəhmət olmasa yuxarıda satıcının istifadəçi adını daxil edin!');
        return;
    }
    showCustomAlert(`Təşəkkürlər! "${sellerName}" adlı satıcıya ${stars} ulduz verildi.`);
    document.getElementById('rate-seller-name').value = '';
}

// Dəstək Sorğusu
document.getElementById('support-form').addEventListener('submit', function(e) {
    e.preventDefault();
    let category = document.getElementById('support-category').value;
    let msg = document.getElementById('support-message').value;
    let ticketId = 'tic_' + Date.now();
    db.ref('support/' + ticketId).set({
        id: ticketId, userId: currentUser.id, userName: currentUser.name,
        category: category, message: msg, reply: 'Hələ cavab verilməyib',
        status: 'Gözləmədədir', date: new Date().toLocaleString()
    }).then(() => {
        showCustomAlert('Dəstək sorğunuz göndərildi!');
        document.getElementById('support-message').value = '';
    });
});

db.ref('support').on('value', snapshot => {
    let container = document.getElementById('my-tickets');
    if(!container) return;
    container.innerHTML = '';
    snapshot.forEach(child => {
        let s = child.val();
        if(s.userId === currentUser.id) {
            container.innerHTML += `
                <div style="background:#1a1a1a; padding:10px; margin-top:8px; border-radius:6px; font-size:13px;">
                    <p><b>[${s.category}]</b> ${s.message}</p>
                    <p style="color:var(--primary-red); margin-top:4px;"><b>Admin cavabı:</b> ${s.reply}</p>
                </div>
            `;
        }
    });
});
                                      
