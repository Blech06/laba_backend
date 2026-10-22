const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

// ========== Логирование: метод + URL + время + IP (продвинутый) ==========
app.use((req, res, next) => {
    const ts = new Date().toISOString();
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    console.log(`[${ts}] ${req.method} ${req.url} — IP: ${ip}`);
    next();
});

// ========== Данные (на основе ЛР №2, вариант 4 — Книги) ==========
let books = [
    { id: 1, title: 'Война и мир', author: 'Лев Толстой', year: 1869, genre: 'роман' },
    { id: 2, title: 'Преступление и наказание', author: 'Фёдор Достоевский', year: 1866, genre: 'роман' },
    { id: 3, title: 'Мастер и Маргарита', author: 'Михаил Булгаков', year: 1967, genre: 'фантастика' },
    { id: 4, title: 'Анна Каренина', author: 'Лев Толстой', year: 1877, genre: 'роман' },
    { id: 5, title: 'Собачье сердце', author: 'Михаил Булгаков', year: 1925, genre: 'повесть' },
    { id: 6, title: 'Идиот', author: 'Фёдор Достоевский', year: 1869, genre: 'роман' }
];

// Главы книг (вложенный ресурс)
const chapters = {
    1: [
        { id: 1, title: 'Часть 1. Глава 1', pages: 24 },
        { id: 2, title: 'Часть 1. Глава 2', pages: 18 },
        { id: 3, title: 'Часть 2. Глава 1', pages: 30 }
    ],
    2: [
        { id: 1, title: 'Часть 1', pages: 40 },
        { id: 2, title: 'Часть 2', pages: 35 }
    ],
    3: [
        { id: 1, title: 'Глава 1. Никогда не разговаривайте с неизвестными', pages: 12 },
        { id: 2, title: 'Глава 2. Понтий Пилат', pages: 28 }
    ],
    4: [
        { id: 1, title: 'Часть первая', pages: 50 }
    ],
    5: [
        { id: 1, title: 'Глава I', pages: 15 },
        { id: 2, title: 'Глава II', pages: 20 }
    ],
    6: [
        { id: 1, title: 'Часть первая', pages: 45 }
    ]
};

const SORT_FIELDS = ['id', 'title', 'year', 'author', 'genre'];
const FILTER_FIELDS = ['genre', 'year', 'author'];

// ========== Вспомогательные ==========
function parseId(raw) {
    const id = parseInt(raw, 10);
    if (isNaN(id) || id < 1) return null;
    return id;
}

function findBook(id) {
    return books.find(b => b.id === id);
}

// ========== БАЗОВЫЙ + СРЕДНИЙ: GET /books ==========
// search, sort, order, page, limit, filter=field:value
app.get('/books', (req, res) => {
    let result = [...books];
    const { search, sort, order, page, limit, filter } = req.query;

    // Поиск по title
    if (search) {
        const q = String(search).toLowerCase();
        result = result.filter(b => b.title.toLowerCase().includes(q));
    }

    // Фильтрация filter=genre:роман или filter=year:1869
    if (filter) {
        const [field, ...rest] = String(filter).split(':');
        const value = rest.join(':');
        if (!FILTER_FIELDS.includes(field)) {
            return res.status(400).json({
                error: `Недопустимое поле фильтра. Разрешены: ${FILTER_FIELDS.join(', ')}`
            });
        }
        if (value === undefined || value === '') {
            return res.status(400).json({ error: 'Формат фильтра: filter=field:value' });
        }
        if (field === 'year') {
            const y = parseInt(value, 10);
            if (isNaN(y)) return res.status(400).json({ error: 'year должен быть числом' });
            result = result.filter(b => b.year === y);
        } else {
            result = result.filter(b => String(b[field]).toLowerCase() === value.toLowerCase());
        }
    }

    // Сортировка
    if (sort) {
        if (!SORT_FIELDS.includes(sort)) {
            return res.status(400).json({
                error: `Недопустимое поле сортировки. Разрешены: ${SORT_FIELDS.join(', ')}`
            });
        }
        const dir = (order || 'asc').toLowerCase();
        if (dir !== 'asc' && dir !== 'desc') {
            return res.status(400).json({ error: 'order должен быть asc или desc' });
        }
        result.sort((a, b) => {
            let va = a[sort], vb = b[sort];
            if (typeof va === 'string') va = va.toLowerCase();
            if (typeof vb === 'string') vb = vb.toLowerCase();
            if (va < vb) return dir === 'desc' ? 1 : -1;
            if (va > vb) return dir === 'desc' ? -1 : 1;
            return 0;
        });
    }

    // Пагинация
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    if (page && (isNaN(parseInt(page, 10)) || parseInt(page, 10) < 1)) {
        return res.status(400).json({ error: 'page должен быть целым числом ≥ 1' });
    }
    if (limit && (isNaN(parseInt(limit, 10)) || parseInt(limit, 10) < 1 || parseInt(limit, 10) > 100)) {
        return res.status(400).json({ error: 'limit должен быть числом от 1 до 100' });
    }

    const total = result.length;
    const start = (pageNum - 1) * limitNum;
    const items = result.slice(start, start + limitNum);

    res.json({
        count: total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
        books: items
    });
});

// ========== ПРОДВИНУТЫЙ: GET /books/stats ==========
// (до /books/:id, иначе "stats" попадёт в :id)
app.get('/books/stats', (req, res) => {
    const byGenre = {};
    books.forEach(b => {
        byGenre[b.genre] = (byGenre[b.genre] || 0) + 1;
    });
    const years = books.map(b => b.year);
    res.json({
        total: books.length,
        byGenre,
        averageYear: years.length
            ? Math.round(years.reduce((s, y) => s + y, 0) / years.length)
            : null,
        oldest: years.length ? Math.min(...years) : null,
        newest: years.length ? Math.max(...years) : null
    });
});

// ========== БАЗОВЫЙ: GET /books/:id ==========
app.get('/books/:id', (req, res) => {
    const id = parseId(req.params.id);
    if (id === null) {
        return res.status(400).json({ error: 'ID должен быть положительным числом' });
    }
    const book = findBook(id);
    if (!book) {
        return res.status(404).json({ error: 'Книга не найдена' });
    }
    res.json(book);
});

// ========== БАЗОВЫЙ: вложенный ресурс GET /books/:id/chapters ==========
app.get('/books/:id/chapters', (req, res) => {
    const id = parseId(req.params.id);
    if (id === null) {
        return res.status(400).json({ error: 'ID должен быть положительным числом' });
    }
    const book = findBook(id);
    if (!book) {
        return res.status(404).json({ error: 'Книга не найдена' });
    }
    const list = chapters[id] || [];
    res.json({
        bookId: id,
        title: book.title,
        chaptersCount: list.length,
        chapters: list
    });
});

// ========== ПРОДВИНУТЫЙ: множественные params ==========
// GET /books/:bookId/chapters/:chapterId
app.get('/books/:bookId/chapters/:chapterId', (req, res) => {
    const bookId = parseId(req.params.bookId);
    const chapterId = parseId(req.params.chapterId);
    if (bookId === null) {
        return res.status(400).json({ error: 'bookId должен быть положительным числом' });
    }
    if (chapterId === null) {
        return res.status(400).json({ error: 'chapterId должен быть положительным числом' });
    }
    const book = findBook(bookId);
    if (!book) {
        return res.status(404).json({ error: 'Книга не найдена' });
    }
    const list = chapters[bookId] || [];
    const chapter = list.find(c => c.id === chapterId);
    if (!chapter) {
        return res.status(404).json({ error: 'Глава не найдена' });
    }
    res.json({ bookId, bookTitle: book.title, chapter });
});

// ========== БАЗОВЫЙ: категория GET /authors/:author/books ==========
app.get('/authors/:author/books', (req, res) => {
    const author = decodeURIComponent(req.params.author);
    const list = books.filter(
        b => b.author.toLowerCase() === author.toLowerCase()
    );
    res.json({
        author,
        count: list.length,
        books: list
    });
});

// ========== ПРОДВИНУТЫЙ: вложенный GET /authors/:author/books/:bookId ==========
app.get('/authors/:author/books/:bookId', (req, res) => {
    const author = decodeURIComponent(req.params.author);
    const bookId = parseId(req.params.bookId);
    if (bookId === null) {
        return res.status(400).json({ error: 'bookId должен быть положительным числом' });
    }
    const book = findBook(bookId);
    if (!book) {
        return res.status(404).json({ error: 'Книга не найдена' });
    }
    if (book.author.toLowerCase() !== author.toLowerCase()) {
        return res.status(404).json({
            error: `Книга ${bookId} не принадлежит автору «${author}»`
        });
    }
    res.json(book);
});

// ========== Wildcard 404 (продвинутый) ==========
app.use((req, res) => {
    res.status(404).json({
        error: 'Маршрут не найден',
        path: req.url,
        method: req.method
    });
});

// ========== Глобальный обработчик 500 ==========
app.use((err, req, res, next) => {
    console.error('[ERROR]', err.stack || err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

app.listen(port, () => {
    console.log(`ЛР №3 | Вариант 4 (Книги) | http://localhost:${port}`);
    console.log('Уровень: продвинутый (params + query + nested + stats + logging)');
});
