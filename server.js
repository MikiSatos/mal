const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = "12345";

// --- БЕЗОПАСНОЕ ПОДКЛЮЧЕНИЕ ---
// Мы берем ссылку из переменных окружения (настроек Render)
const MONGO_URI = process.env.MONGO_URL; 
// ------------------------------

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 1. Подключение к MongoDB
// Добавили проверку: если ссылки нет, пишем ошибку в консоль
if (!MONGO_URI) {
    console.error("❌ ОШИБКА: Не найдена переменная окружения MONGO_URL! Настрой её в Render.");
} else {
    mongoose.connect(MONGO_URI)
        .then(() => console.log('✅ MongoDB connected!'))
        .catch(err => console.error('❌ MongoDB error:', err));
}

// 2. Схемы данных
const CommentSchema = new mongoose.Schema({
    id: Number,
    author: String,
    authorAvatar: String,
    text: String,
    replies: [{
        id: Number,
        author: String,
        authorAvatar: String,
        text: String
    }]
});

const ArticleSchema = new mongoose.Schema({
    id: Number,
    title: String,
    content: String,
    author: String,
    authorAvatar: String,
    imageUrl: String,
    comments: [CommentSchema]
});

const Article = mongoose.model('Article', ArticleSchema);

// --- Папка для картинок ---
const uploadDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/uploads/'),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// --- API ---

app.get('/api/articles', async (req, res) => {
    try {
        const articles = await Article.find();
        res.json(articles.map(a => ({
            id: a.id,
            title: a.title,
            excerpt: a.content.substring(0, 100) + '...',
            author: a.author,
            authorAvatar: a.authorAvatar,
            imageUrl: a.imageUrl
        })));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/articles/:id', async (req, res) => {
    try {
        const article = await Article.findOne({ id: req.params.id });
        if (!article) return res.status(404).json({ message: "Not found" });
        res.json(article);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/articles', upload.single('imageFile'), async (req, res) => {
    try {
        const { title, content, author, authorAvatar } = req.body;
        if (!title || !content || !author) return res.status(400).json({ message: "Empty fields" });

        let imageUrl = "";
        if (req.file) imageUrl = `/uploads/${req.file.filename}`;

        const newArticle = new Article({
            id: Date.now(),
            title, content, author,
            authorAvatar: authorAvatar || "",
            imageUrl,
            comments: []
        });

        await newArticle.save();
        res.status(201).json(newArticle);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/articles/:id', async (req, res) => {
    if (req.headers['x-admin-password'] !== ADMIN_PASSWORD) return res.status(403).json({ message: "Wrong password" });
    try {
        await Article.deleteOne({ id: req.params.id });
        res.json({ message: "Deleted" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/articles/:id/comments', async (req, res) => {
    try {
        const article = await Article.findOne({ id: req.params.id });
        if (!article) return res.status(404).json({ message: "Not found" });

        const newComment = { 
            id: Date.now(), 
            author: req.body.author, 
            text: req.body.text, 
            authorAvatar: req.body.authorAvatar || "", 
            replies: [] 
        };
        article.comments.push(newComment);
        await article.save();
        res.status(201).json(newComment);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/articles/:artId/comments/:comId/replies', async (req, res) => {
    try {
        const article = await Article.findOne({ id: req.params.artId });
        if (!article) return res.status(404).json({ message: "Not found" });

        const comment = article.comments.find(c => c.id == req.params.comId);
        if (!comment) return res.status(404).json({ message: "Comment not found" });

        comment.replies.push({
            id: Date.now(),
            author: req.body.author,
            text: req.body.text,
            authorAvatar: req.body.authorAvatar || ""
        });
        await article.save();
        res.json({ message: "OK" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});