const API_URL = '/api';
const app = document.getElementById('app');
let currentUser = null;

// --- СЛОВАРЬ ПЕРЕВОДОВ ---
const translations = {
    ru: {
        menu_home: "🔥 Главная",
        menu_fav: "💎 Избранное",
        menu_discuss: "💬 Обсуждения",
        menu_resources: "РЕСУРСЫ",
        menu_about: "О нас",
        menu_rules: "Правила",
        btn_logout: "Выйти",
        btn_new_article: "+ Новая статья",
        btn_back: "← Назад",
        btn_delete: "Удалить",
        modal_title: "Написать статью",
        modal_image: "Картинка (файл):",
        modal_publish: "Опубликовать",
        text_empty: "Пока нет статей. Будьте первым!",
        text_comments: "Комментарии",
        text_login_comment: "Войдите, чтобы комментировать",
        placeholder_title: "Заголовок...",
        placeholder_content: "Текст статьи...",
        placeholder_comment: "Текст комментария...",
        page_fav_title: "💎 Избранное",
        page_fav_desc: "Этот раздел находится в разработке.",
        page_disc_title: "💬 Обсуждения",
        page_disc_desc: "Лента последних комментариев (в разработке).",
        page_about_title: "О нас",
        page_about_desc: "Добро пожаловать в B&Y BLOG! Мы делимся идеями.",
        page_rules_title: "Правила",
        list_rules: "<li>1. Уважайте других.</li><li>2. Без спама.</li>"
    },
    en: {
        menu_home: "🔥 Home",
        menu_fav: "💎 Favorites",
        menu_discuss: "💬 Discussions",
        menu_resources: "RESOURCES",
        menu_about: "About Us",
        menu_rules: "Rules",
        btn_logout: "Log out",
        btn_new_article: "+ New Article",
        btn_back: "← Back",
        btn_delete: "Delete",
        modal_title: "Write an Article",
        modal_image: "Image (file):",
        modal_publish: "Publish",
        text_empty: "No articles yet. Be the first!",
        text_comments: "Comments",
        text_login_comment: "Log in to comment",
        placeholder_title: "Title...",
        placeholder_content: "Article text...",
        placeholder_comment: "Comment text...",
        page_fav_title: "💎 Favorites",
        page_fav_desc: "This section is under development.",
        page_disc_title: "💬 Discussions",
        page_disc_desc: "Latest comments feed (under development).",
        page_about_title: "About Us",
        page_about_desc: "Welcome to B&Y BLOG! We share ideas.",
        page_rules_title: "Rules",
        list_rules: "<li>1. Respect others.</li><li>2. No spam.</li>"
    },
    pl: {
        menu_home: "🔥 Strona główna",
        menu_fav: "💎 Ulubione",
        menu_discuss: "💬 Dyskusje",
        menu_resources: "ZASOBY",
        menu_about: "O nas",
        menu_rules: "Zasady",
        btn_logout: "Wyloguj",
        btn_new_article: "+ Nowy artykuł",
        btn_back: "← Wróć",
        btn_delete: "Usuń",
        modal_title: "Napisz artykuł",
        modal_image: "Obraz (plik):",
        modal_publish: "Opublikuj",
        text_empty: "Brak artykułów. Bądź pierwszy!",
        text_comments: "Komentarze",
        text_login_comment: "Zaloguj się, aby skomentować",
        placeholder_title: "Tytuł...",
        placeholder_content: "Treść artykułu...",
        placeholder_comment: "Treść komentarza...",
        page_fav_title: "💎 Ulubione",
        page_fav_desc: "Ta sekcja jest w budowie.",
        page_disc_title: "💬 Dyskusje",
        page_disc_desc: "Kanał komentarzy (w budowie).",
        page_about_title: "O nas",
        page_about_desc: "Witamy w B&Y BLOG! Dzielimy się pomysłami.",
        page_rules_title: "Zasady",
        list_rules: "<li>1. Szanuj innych.</li><li>2. Bez spamu.</li>"
    }
};

let currentLang = localStorage.getItem('blog_lang') || 'ru';

// --- ФУНКЦИЯ СМЕНЫ ЯЗЫКА ---
function changeLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('blog_lang', lang);
    
    // Обновляем выпадающий список
    document.getElementById('lang-switch').value = lang;

    // Обновляем все элементы с атрибутом data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang][key]) {
            el.innerHTML = translations[lang][key];
        }
    });

    // Обновляем плейсхолдеры (поля ввода)
    const tTitle = document.getElementById('new-title');
    const tContent = document.getElementById('new-content');
    if(tTitle) tTitle.placeholder = translations[lang].placeholder_title;
    if(tContent) tContent.placeholder = translations[lang].placeholder_content;

    // Перерисовываем текущий интерфейс (если надо)
    updateUI(!!currentUser);
}

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
    // Восстанавливаем язык
    changeLanguage(currentLang);

    const saved = localStorage.getItem('blog_user');
    if (saved) {
        currentUser = JSON.parse(saved);
        updateUI(true);
    } else {
        updateUI(false);
    }
    loadArticles();

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
    
    // Получаем текст кнопки из словаря
    const btnText = translations[currentLang].btn_new_article;

    if (isLoggedIn && currentUser) {
        if(loginBtn) loginBtn.style.display = 'none';
        profile.style.display = 'flex';
        document.getElementById('user-name').innerText = currentUser.first_name;
        document.getElementById('user-avatar').src = currentUser.photo_url || '';
        
        controls.innerHTML = `<button onclick="document.getElementById('create-modal').classList.remove('hidden')">${btnText}</button>`;
    } else {
        if(loginBtn) loginBtn.style.display = 'block';
        profile.style.display = 'none';
        controls.innerHTML = '';
    }
}

// --- СТАТЬИ ---
window.loadArticles = async function() {
    try {
        const res = await fetch(`${API_URL}/articles`);
        const articles = await res.json();
        
        let html = `<h2>${translations[currentLang].menu_home}</h2>`;
        if (articles.length === 0) html += `<p>${translations[currentLang].text_empty}</p>`;

        articles.forEach(a => {
            const imgHtml = a.imageUrl ? `<img src="${a.imageUrl}" class="card-image">` : '';
            const avaHtml = a.authorAvatar ? `<img src="${a.authorAvatar}" class="mini-ava">` : '';
            const delText = translations[currentLang].btn_delete;
            
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
                    <button class="delete-btn" onclick="deleteArticle(${a.id})">${delText}</button>
                </div>
            `;
        });
        app.innerHTML = html;
    } catch (e) { console.error(e); }
}

// --- ДЕТАЛИ ---
window.loadArticleDetails = async function(id) {
    try {
        const res = await fetch(`${API_URL}/articles/${id}`);
        const article = await res.json();
        const imgHtml = article.imageUrl ? `<img src="${article.imageUrl}" class="full-article-image">` : '';
        const avaHtml = article.authorAvatar ? `<img src="${article.authorAvatar}" class="mini-ava">` : '';

        // Переводы
        const t = translations[currentLang];

        let commentsHtml = '';
        if (article.comments) {
            article.comments.forEach(c => {
                const cAva = c.authorAvatar ? `<img src="${c.authorAvatar}" class="mini-ava" style="width:20px;height:20px;">` : '';
                let repliesHtml = '';
                if(c.replies) c.replies.forEach(r => {
                    const rAva = r.authorAvatar ? `<img src="${r.authorAvatar}" class="mini-ava" style="width:15px;height:15px;">` : '';
                    repliesHtml += `<div class="reply">${rAva} <strong>${r.author}</strong>: ${r.text}</div>`;
                });

                const replyBtn = currentUser ? `<button class="secondary" onclick="document.getElementById('reply-form-${c.id}').style.display='block'">Reply</button>` : '';

                commentsHtml += `
                    <div class="comment">
                        <div style="display:flex;gap:10px;align-items:center;margin-bottom:5px;">
                            ${cAva} <strong>${c.author}</strong>
                        </div>
                        <div>${c.text}</div>
                        ${replyBtn}
                        <div id="reply-form-${c.id}" class="reply-form-container">
                            <input id="r-text-${c.id}" placeholder="${t.placeholder_comment}">
                            <button class="secondary" onclick="sendReply(${article.id}, ${c.id})">OK</button>
                        </div>
                        <div class="replies-list">${repliesHtml}</div>
                    </div>`;
            });
        }

        let formHtml = `<p>${t.text_login_comment}</p>`;
        if (currentUser) {
            formHtml = `
                <div style="display:flex;gap:10px;align-items:center;margin-bottom:10px;">
                    <img src="${currentUser.photo_url}" class="mini-ava"> <span>${currentUser.first_name}</span>
                </div>
                <textarea id="c-text" placeholder="${t.placeholder_comment}"></textarea>
                <button onclick="sendComment(${article.id})">OK</button>
            `;
        }

        app.innerHTML = `
            <div class="full-article">
                <button class="btn-secondary" onclick="loadArticles()" style="margin-bottom:20px;">${t.btn_back}</button>
                ${imgHtml}
                <h1>${article.title}</h1>
                <div class="meta" style="display:flex;align-items:center;gap:10px;">${avaHtml} ${article.author}</div>
                <div class="article-body">${article.content}</div>
                <div class="comments-section">
                    <h3>${t.text_comments}</h3>
                    ${commentsHtml}
                    <div style="margin-top:20px;border-top:1px solid #333;padding-top:20px;">${formHtml}</div>
                </div>
            </div>
        `;
    } catch (e) { console.error(e); }
};

// --- СОЗДАНИЕ ---
window.submitArticle = async function() {
    if(!currentUser) return alert("Log in!");
    const title = document.getElementById('new-title').value;
    const content = document.getElementById('new-content').value;
    const file = document.getElementById('new-image-file').files[0];

    if(!title || !content) return alert("Empty fields");

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
    document.getElementById('new-image-file').value = ''; 
    loadArticles();
};

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
    const p = prompt("Password (12345):");
    if(!p) return;
    const res = await fetch(`${API_URL}/articles/${id}`, { method: 'DELETE', headers: { 'x-admin-password': p }});
    if(res.ok) { alert("Deleted"); loadArticles(); } else { alert("Error"); }
};

// --- МЕНЮ ---
window.highlightMenu = function(element) {
    document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
    element.classList.add('active');
}

window.loadFavorites = function() {
    const t = translations[currentLang];
    app.innerHTML = `
        <div class="full-article">
            <h1>${t.page_fav_title}</h1>
            <p>${t.page_fav_desc}</p>
        </div>`;
}

window.loadDiscussions = function() {
    const t = translations[currentLang];
    app.innerHTML = `
        <div class="full-article">
            <h1>${t.page_disc_title}</h1>
            <p>${t.page_disc_desc}</p>
        </div>`;
}

window.loadAbout = function() {
    const t = translations[currentLang];
    app.innerHTML = `
        <div class="full-article">
            <h1>${t.page_about_title}</h1>
            <p>${t.page_about_desc}</p>
        </div>`;
}

window.loadRules = function() {
    const t = translations[currentLang];
    app.innerHTML = `
        <div class="full-article">
            <h1>${t.page_rules_title}</h1>
            <ul>${t.list_rules}</ul>
        </div>`;
}