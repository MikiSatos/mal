const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = "12345";

// --- НАСТРОЙКИ (Берем из Render) ---
const MONGO_URI = process.env.MONGO_URL;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// Твой сайт на Render
const BASE_URL = "https://mal-usev.onrender.com"; 

// --- Cloudinary ---
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Настройка сессий (нужна для входа)
app.use(session({
    secret: 'secret_key_blog',
    resave: false,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

// --- MONGODB ---
if (!MONGO_URI) console.error("❌ No MONGO_URL");
else mongoose.connect(MONGO_URI).then(() => console.log('✅ MongoDB connected!'));

// --- SCHEMAS ---
const CommentSchema = new mongoose.Schema({ id: Number, author: String, authorAvatar: String, text: String, replies: [] });
const ArticleSchema = new mongoose.Schema({ id: Number, title: String, content: String, author: String, authorAvatar: String, imageUrl: String, comments: [CommentSchema] });
const Article = mongoose.model('Article', ArticleSchema);

// --- GOOGLE STRATEGY ---
if(GOOGLE_CLIENT_ID) {
    passport.use(new GoogleStrategy({
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: `${BASE_URL}/auth/google/callback`
      },
      function(accessToken, refreshToken, profile, done) {
        // Берем данные от Google
        const user = {
            first_name: profile.displayName,
            photo_url: profile.photos[0].value
        };
        return done(null, user);
      }
    ));

    passport.serializeUser((user, done) => done(null, user));
    passport.deserializeUser((obj, done) => done(null, obj));
}

// --- API ДЛЯ ВХОДА ---

// 1. Кнопка нажата -> идем в Google
app.get('/auth/google', passport.authenticate('google', { scope: ['profile'] }));

// 2. Google вернул пользователя обратно
app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    // Передаем данные на фронтенд
    const userData = JSON.stringify(req.user);
    res.redirect(`/?googleUser=${encodeURIComponent(userData)}`);
  }
);

// --- ЗАГРУЗКА ФАЙЛОВ ---
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: { folder: 'blog-uploads', allowed_formats: ['jpg', 'png', 'jpeg', 'webp'] },
});
const upload = multer({ storage: storage });

// --- ОБЫЧНОЕ API ---
app.get('/api/articles', async (req, res) => {
    const articles = await Article.find();
    res.json(articles);
});

app.get('/api/articles/:id', async (req, res) => {
    const article = await Article.findOne({ id: req.params.id });
    if(!article) return res.status(404).json({msg:"Not found"});
    res.json(article);
});

app.post('/api/articles', upload.single('imageFile'), async (req, res) => {
    const { title, content, author, authorAvatar } = req.body;
    let imageUrl = req.file ? req.file.path : "";
    const newArticle = new Article({ id: Date.now(), title, content, author, authorAvatar, imageUrl, comments: [] });
    await newArticle.save();
    res.status(201).json(newArticle);
});

app.delete('/api/articles/:id', async (req, res) => {
    if (req.headers['x-admin-password'] !== ADMIN_PASSWORD) return res.status(403).json({msg:"Wrong pass"});
    await Article.deleteOne({ id: req.params.id });
    res.json({msg:"Deleted"});
});

app.post('/api/articles/:id/comments', async (req, res) => {
    const article = await Article.findOne({ id: req.params.id });
    article.comments.push({ id: Date.now(), author: req.body.author, text: req.body.text, authorAvatar: req.body.authorAvatar, replies: [] });
    await article.save();
    res.status(201).json({msg:"OK"});
});

app.post('/api/articles/:artId/comments/:comId/replies', async (req, res) => {
    const article = await Article.findOne({ id: req.params.artId });
    const comment = article.comments.find(c => c.id == req.params.comId);
    comment.replies.push({ id: Date.now(), author: req.body.author, text: req.body.text, authorAvatar: req.body.authorAvatar });
    await article.save();
    res.json({msg:"OK"});
});

app.listen(PORT, () => console.log(`Server on ${PORT}`));