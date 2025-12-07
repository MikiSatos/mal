const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');
const ADMIN_PASSWORD = "12345";

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// --- ЗАГРУЗКА ФАЙЛОВ ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/uploads/'),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// --- ФАЙЛ БД ---
const readData = () => {
    try {
        if (!fs.existsSync(DATA_FILE)) return [];
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch (error) { return []; }
};
const writeData = (data) => fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

// --- API ---

// 1. Список
app.get('/api/articles', (req, res) => {
    const articles = readData();
    const summary = articles.map(a => ({
        id: a.id,
        title: a.title,
        excerpt: a.content.substring(0, 100) + '...',
        author: a.author,
        authorAvatar: a.authorAvatar, // Отдаем аватарку
        imageUrl: a.imageUrl
    }));
    res.json(summary);
});

// 2. Детали
app.get('/api/articles/:id', (req, res) => {
    const articles = readData();
    const article = articles.find(a => a.id === parseInt(req.params.id));
    if (!article) return res.status(404).json({ message: "Not found" });
    res.json(article);
});

// 3. СОЗДАТЬ (Файл + Данные из ТГ)
app.post('/api/articles', upload.single('imageFile'), (req, res) => {
    const { title, content, author, authorAvatar } = req.body;
    
    if (!title || !content || !author) return res.status(400).json({ message: "Empty fields" });

    let imageUrl = "";
    if (req.file) imageUrl = `/uploads/${req.file.filename}`;

    const articles = readData();
    const newArticle = {
        id: Date.now(),
        title, content, author,
        authorAvatar: authorAvatar || "",
        imageUrl,
        comments: []
    };
    articles.push(newArticle);
    writeData(articles);
    res.status(201).json(newArticle);
});

// 4. Удалить
app.delete('/api/articles/:id', (req, res) => {
    if (req.headers['x-admin-password'] !== ADMIN_PASSWORD) return res.status(403).json({ message: "Wrong password" });
    const id = parseInt(req.params.id);
    let articles = readData();
    articles = articles.filter(a => a.id !== id);
    writeData(articles);
    res.json({ message: "Deleted" });
});

// 5. Комментарии
app.post('/api/articles/:id/comments', (req, res) => {
    const { author, text, authorAvatar } = req.body;
    const articles = readData();
    const article = articles.find(a => a.id === parseInt(req.params.id));
    if (!article) return res.status(404).json({ message: "Error" });

    const newComment = { id: Date.now(), author, text, authorAvatar: authorAvatar || "", replies: [] };
    article.comments.push(newComment);
    writeData(articles);
    res.status(201).json(newComment);
});

// 6. Ответы
app.post('/api/articles/:artId/comments/:comId/replies', (req, res) => {
    const { author, text, authorAvatar } = req.body;
    const articles = readData();
    const article = articles.find(a => a.id === parseInt(req.params.artId));
    if (!article) return res.status(404).json({ message: "Error" });
    const comment = article.comments.find(c => c.id === parseInt(req.params.comId));
    
    if (!comment.replies) comment.replies = [];
    comment.replies.push({ id: Date.now(), author, text, authorAvatar: authorAvatar || "" });
    writeData(articles);
    res.status(201).json({ message: "OK" });
});

app.listen(PORT, () => {
    console.log(`Server running on http://127.0.0.1:${PORT}`);
});