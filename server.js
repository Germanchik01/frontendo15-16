const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = 3000;

// Настройка сессий
app.use(session({
    secret: crypto.randomBytes(32).toString('hex'),
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// Промежуточное ПО для проверки аутентификации
const requireAuth = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/');
    }
    next();
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// База данных пользователей
const users = [];

// Роуты
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Требуется имя пользователя и пароль' });
    }
    
    if (users.some(u => u.username === username)) {
        return res.status(400).json({ error: 'Пользователь уже существует' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    users.push({ username, password: hashedPassword });
    
    res.status(201).json({ message: 'Пользователь успешно зарегистрирован' });
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    const user = users.find(u => u.username === username);
    if (!user) {
        return res.status(401).json({ error: 'Неверные учетные данные' });
    }
    
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
        return res.status(401).json({ error: 'Неверные учетные данные' });
    }
    
    req.session.user = { username };
    res.json({ message: 'Вход выполнен успешно', username });
});

app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ error: 'Не удалось выйти' });
        }
        res.clearCookie('connect.sid');
        res.json({ message: 'Выход выполнен успешно' });
    });
});

app.get('/profile', requireAuth, (req, res) => {
    const profileHtml = fs.readFileSync(path.join(__dirname, 'public', 'profile.html'), 'utf8')
        .replace('{{username}}', req.session.user.username);
    res.send(profileHtml);
});

app.get('/user-data', requireAuth, (req, res) => {
    res.json({ username: req.session.user.username });
});

app.get('/data', requireAuth, (req, res) => {
    const cacheFile = path.join(__dirname, 'cache', 'data.json');
    
    if (fs.existsSync(cacheFile)) {
        const cacheStat = fs.statSync(cacheFile);
        const cacheAge = (new Date() - cacheStat.mtime) / 1000;
        
        if (cacheAge < 60) {
            const cachedData = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
            return res.json({ ...cachedData, cached: true });
        }
    }
    
    const newData = {
        timestamp: new Date().toISOString(),
        data: `Случайные данные: ${Math.random().toString(36).substring(2)}`
    };
    
    if (!fs.existsSync(path.join(__dirname, 'cache'))) {
        fs.mkdirSync(path.join(__dirname, 'cache'));
    }
    fs.writeFileSync(cacheFile, JSON.stringify(newData));
    
    res.json({ ...newData, cached: false });
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});