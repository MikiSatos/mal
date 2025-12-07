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
    loadArticles();

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

// --- СТАТЬИ ---
async function loadArticles() {
    try {
        const res = await fetch(`${API_URL}/articles`);
        const articles = await res.json();
        
        // Убираем кнопку "Назад"
        const btnHome = document.getElementById('btn-home-view');
        if(btnHome) btnHome.style.display = 'none';

        let html = '<h2>Последние статьи</h2>';
        if (articles.length === 0) html += '<p>Пусто.</p>';

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
        if(currentUser) updateUI(true);
    } catch (e) { console.error(e); }
}

// --- ДЕТАЛИ ---
window.loadArticleDetails = async function(id) {
    try {
        const res = await fetch(`${API_URL}/articles/${id}`);
        const article = await res.json();

        // Показываем кнопку Назад
        document.getElementById('auth-controls').innerHTML = `<button class="btn-secondary" onclick="loadArticles()">← Назад</button>`;

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
    loadArticles();
};

// --- ОСТАЛЬНОЕ ---
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