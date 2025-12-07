const API_URL = '/api';
const app = document.getElementById('app');
let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
    // Проверка сохраненного входа
    const saved = localStorage.getItem('blog_user');
    if (saved) {
        currentUser = JSON.parse(saved);
        updateUI(true);
    } else {
        updateUI(false);
    }
    loadArticles(); // Загружаем главную при старте

    // Модалка
    const modal = document.getElementById('create-modal');
    const closeBtn = document.querySelector('.close');
    if(closeBtn) closeBtn.onclick = () => modal.classList.add('hidden');
    window.onclick = (e) => { if(e.target === modal) modal.classList.add('hidden'); };
});

// --- TELEGRAM AUTH ---
function onTelegramAuth(user) {
    currentUser = user;
    localStorage.setItem('blog_user', JSON.stringify(user));
    updateUI(true);
}

window.logout = function() {
    localStorage.removeItem('blog_user');
    currentUser = null;
    window.location.reload();
};

function updateUI(isLoggedIn) {
    const loginBtn = document.getElementById('tg-login-btn');
    const profile = document.getElementById('user-profile');
    const controls = document.getElementById('auth-controls');

    if (isLoggedIn && currentUser) {
        if(loginBtn) loginBtn.style.display = 'none';
        profile.style.display = 'flex';
        document.getElementById('user-name').innerText = currentUser.first_name;
        document.getElementById('user-avatar').src = currentUser.photo_url || '';
        
        controls.innerHTML = `<button onclick="document.getElementById('create-modal').classList.remove('hidden')">+ Новая статья</button>`;
    } else {
        if(loginBtn) loginBtn.style.display = 'block';
        profile.style.display = 'none';
        controls.innerHTML = '';
    }
}

// --- СТАТЬИ (ГЛАВНАЯ) ---
window.loadArticles = async function() {
    try {
        const res = await fetch(`${API_URL}/articles`);
        const articles = await res.json();
        
        let html = '<h2>Последние статьи</h2>';
        if (articles.length === 0) html += '<p>Пока нет статей. Будьте первым!</p>';

        articles.forEach(a => {
            const imgHtml = a.imageUrl ? `<img src="${a.imageUrl}" class="card-image">` : '';
            const avaHtml = a.authorAvatar ? `<img src="${a.authorAvatar}" class="mini-ava">` : '';
            
            html += `
                <div class="article-card">
                    <div onclick="loadArticleDetails(${a.id})" style="cursor: pointer;">
                        ${imgHtml}
                        <h2>${a.title}</h2>
                        <div class="meta" style="display:flex;align-items:center;gap:10px;">
                           ${avaHtml} <span>${a.author}</span>
                        </div>
                        <p>${a.excerpt}</p>
                    </div>
                    <button class="delete-btn" onclick="deleteArticle(${a.id})">Удалить</button>
                </div>
            `;
        });
        app.innerHTML = html;
    } catch (e) { console.error(e); }
}

// --- ДЕТАЛИ СТАТЬИ ---
window.loadArticleDetails = async function(id) {
    try {
        const res = await fetch(`${API_URL}/articles/${id}`);
        const article = await res.json();

        // Показываем кнопку Назад
        // (Она уже есть в HTML макета, но тут мы обновляем UI внутри статьи)
        
        const imgHtml = article.imageUrl ? `<img src="${article.imageUrl}" class="full-article-image">` : '';
        const avaHtml = article.authorAvatar ? `<img src="${article.authorAvatar}" class="mini-ava">` : '';

        let commentsHtml = '';
        if (article.comments) {
            article.comments.forEach(c => {
                const cAva = c.authorAvatar ? `<img src="${c.authorAvatar}" class="mini-ava" style="width:20px;height:20px;">` : '';
                
                let repliesHtml = '';
                if(c.replies) c.replies.forEach(r => {
                    const rAva = r.authorAvatar ? `<img src="${r.authorAvatar}" class="mini-ava" style="width:15px;height:15px;">` : '';
                    repliesHtml += `<div class="reply">${rAva} <strong>${r.author}</strong>: ${r.text}</div>`;
                });

                const replyBtn = currentUser ? `<button class="secondary" onclick="document.getElementById('reply-form-${c.id}').style.display='block'">Ответить</button>` : '';

                commentsHtml += `
                    <div class="comment">
                        <div style="display:flex;gap:10px;align-items:center;margin-bottom:5px;">
                            ${cAva} <strong>${c.author}</strong>
                        </div>
                        <div>${c.text}</div>
                        ${replyBtn}
                        <div id="reply-form-${c.id}" class="reply-form-container">
                            <input id="r-text-${c.id}" placeholder="Ответ...">
                            <button class="secondary" onclick="sendReply(${article.id}, ${c.id})">OK</button>
                        </div>
                        <div class="replies-list">${repliesHtml}</div>
                    </div>`;
            });
        }

        let formHtml = '<p>Войдите, чтобы комментировать</p>';
        if (currentUser) {
            formHtml = `
                <div style="display:flex;gap:10px;align-items:center;margin-bottom:10px;">
                    <img src="${currentUser.photo_url}" class="mini-ava"> <span>${currentUser.first_name}</span>
                </div>
                <textarea id="c-text" placeholder="Текст..."></textarea>
                <button onclick="sendComment(${article.id})">Отправить</button>
            `;
        }

        app.innerHTML = `
            <div class="full-article">
                <button class="btn-secondary" onclick="loadArticles()" style="margin-bottom:20px;">← Назад</button>
                ${imgHtml}
                <h1>${article.title}</h1>
                <div class="meta" style="display:flex;align-items:center;gap:10px;">${avaHtml} ${article.author}</div>
                <div class="article-body">${article.content}</div>
                <div class="comments-section">
                    <h3>Комментарии</h3>
                    ${commentsHtml}
                    <div style="margin-top:20px;border-top:1px solid #333;padding-top:20px;">${formHtml}</div>
                </div>
            </div>
        `;
    } catch (e) { console.error(e); }
};

// --- СОЗДАНИЕ (С файлом и юзером) ---
window.submitArticle = async function() {
    if(!currentUser) return alert("Войдите!");
    
    const title = document.getElementById('new-title').value;
    const content = document.getElementById('new-content').value;
    const file = document.getElementById('new-image-file').files[0];

    if(!title || !content) return alert("Заполните поля");

    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('author', currentUser.first_name);
    formData.append('authorAvatar', currentUser.photo_url || "");
    if(file) formData.append('imageFile', file);

    await fetch(`${API_URL}/articles`, { method: 'POST', body: formData });
    
    document.getElementById('create-modal').classList.add('hidden');
    document.getElementById('new-title').value = '';
    document.getElementById('new-content').value = '';
    // Сбрасываем файл
    document.getElementById('new-image-file').value = ''; 
    loadArticles();
};

// --- ФУНКЦИИ КОММЕНТАРИЕВ И УДАЛЕНИЯ ---
window.sendComment = async function(id) {
    if(!currentUser) return;
    const text = document.getElementById('c-text').value;
    if(!text) return;
    await fetch(`${API_URL}/articles/${id}/comments`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ author: currentUser.first_name, authorAvatar: currentUser.photo_url, text })
    });
    loadArticleDetails(id);
};

window.sendReply = async function(artId, comId) {
    if(!currentUser) return;
    const text = document.getElementById(`r-text-${comId}`).value;
    if(!text) return;
    await fetch(`${API_URL}/articles/${artId}/comments/${comId}/replies`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ author: currentUser.first_name, authorAvatar: currentUser.photo_url, text })
    });
    loadArticleDetails(artId);
};

window.deleteArticle = async function(id) {
    const p = prompt("Пароль (12345):");
    if(!p) return;
    const res = await fetch(`${API_URL}/articles/${id}`, { method: 'DELETE', headers: { 'x-admin-password': p }});
    if(res.ok) { alert("Deleted"); loadArticles(); } else { alert("Error"); }
};

// --- ЛОГИКА МЕНЮ (НОВОЕ) ---
window.highlightMenu = function(element) {
    document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
    element.classList.add('active');
}

window.loadFavorites = function() {
    app.innerHTML = `
        <div class="full-article">
            <h1>💎 Избранное</h1>
            <p>Этот раздел находится в разработке.</p>
            <p>Здесь вы сможете сохранять понравившиеся статьи.</p>
        </div>`;
}

window.loadDiscussions = function() {
    app.innerHTML = `
        <div class="full-article">
            <h1>💬 Обсуждения</h1>
            <p>Лента последних комментариев (в разработке).</p>
        </div>`;
}

window.loadAbout = function() {
    app.innerHTML = `
        <div class="full-article">
            <h1>О нас</h1>
            <p>Добро пожаловать в <strong>B&Y BLOG</strong>!</p>
            <p>Мы создали это пространство для обмена идеями, новостями и творчеством.</p>
            <p>Версия платформы: 1.0.0</p>
        </div>`;
}

window.loadRules = function() {
    app.innerHTML = `
        <div class="full-article">
            <h1>Правила сообщества</h1>
            <ul>
                <li>1. Уважайте других участников.</li>
                <li>2. Запрещен спам и реклама.</li>
                <li>3. Нецензурная лексика не приветствуется.</li>
                <li>4. Соблюдайте законы.</li>
            </ul>
        </div>`;
}