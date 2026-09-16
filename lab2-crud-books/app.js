const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// ========== Middleware ==========
app.use(express.json());

// Логирование в консоль + в файл access.log (продвинутый уровень)
const logStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });

app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] ${req.method} ${req.url}\n`;
    console.log(logLine.trim());
    logStream.write(logLine);
    next();
});

// ========== Хранилище в памяти (Вариант 4 — Книги) ==========
// Поля: id, title, author + year, genre (средний уровень)
let books = [
    { id: 1, title: 'Война и мир', author: 'Лев Толстой', year: 1869, genre: 'роман' },
    { id: 2, title: 'Преступление и наказание', author: 'Фёдор Достоевский', year: 1866, genre: 'роман' },
    { id: 3, title: 'Мастер и Маргарита', author: 'Михаил Булгаков', year: 1967, genre: 'фантастика' },
    { id: 4, title: 'Анна Каренина', author: 'Лев Толстой', year: 1877, genre: 'роман' },
    { id: 5, title: 'Собачье сердце', author: 'Михаил Булгаков', year: 1925, genre: 'повесть' }
];
let nextId = 6;

// ========== Вспомогательные функции ==========
function findBookIndex(id) {
    return books.findIndex(b => b.id === id);
}

function validateBook(body, isPartial = false) {
    const errors = [];

    if (!isPartial) {
        if (!body.title || typeof body.title !== 'string' || body.title.trim() === '') {
            errors.push('Поле title обязательно и должно быть непустой строкой');
        }
        if (!body.author || typeof body.author !== 'string' || body.author.trim() === '') {
            errors.push('Поле author обязательно и должно быть непустой строкой');
        }
    } else {
        if (body.title !== undefined && (typeof body.title !== 'string' || body.title.trim() === '')) {
            errors.push('Поле title должно быть непустой строкой');
        }
        if (body.author !== undefined && (typeof body.author !== 'string' || body.author.trim() === '')) {
            errors.push('Поле author должно быть непустой строкой');
        }
    }

    if (body.year !== undefined) {
        if (typeof body.year !== 'number' || !Number.isInteger(body.year) || body.year < 0 || body.year > 2100) {
            errors.push('Поле year должно быть целым числом от 0 до 2100');
        }
    }

    if (body.genre !== undefined && (typeof body.genre !== 'string' || body.genre.trim() === '')) {
        errors.push('Поле genre должно быть непустой строкой');
    }

    return errors;
}

// ========== CRUD + дополнительные эндпоинты ==========

// GET /books — список с поиском, сортировкой и пагинацией
app.get('/books', (req, res) => {
    let result = [...books];

    // Поиск по title
    if (req.query.search) {
        const q = req.query.search.toLowerCase();
        result = result.filter(b => b.title.toLowerCase().includes(q));
    }

    // Сортировка
    if (req.query.sort) {
        const field = req.query.sort;
        const order = (req.query.order || 'asc').toLowerCase();
        const allowed = ['id', 'title', 'author', 'year', 'genre'];
        if (allowed.includes(field)) {
            result.sort((a, b) => {
                let valA = a[field];
                let valB = b[field];
                if (typeof valA === 'string') valA = valA.toLowerCase();
                if (typeof valB === 'string') valB = valB.toLowerCase();
                if (valA < valB) return order === 'desc' ? 1 : -1;
                if (valA > valB) return order === 'desc' ? -1 : 1;
                return 0;
            });
        }
    }

    // Пагинация
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 10));
    const total = result.length;
    const start = (page - 1) * limit;
    const paginated = result.slice(start, start + limit);

    res.json({
        count: total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
        books: paginated
    });
});

// GET /books/stats — статистика (продвинутый)
app.get('/books/stats', (req, res) => {
    const byGenre = {};
    books.forEach(b => {
        byGenre[b.genre] = (byGenre[b.genre] || 0) + 1;
    });

    const years = books.map(b => b.year).filter(y => typeof y === 'number');
    const avgYear = years.length
        ? Math.round(years.reduce((s, y) => s + y, 0) / years.length)
        : null;

    res.json({
        total: books.length,
        byGenre,
        averageYear: avgYear,
        oldest: years.length ? Math.min(...years) : null,
        newest: years.length ? Math.max(...years) : null
    });
});

// GET /books/:id — один элемент
app.get('/books/:id', (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'ID должен быть числом' });
    }
    const book = books.find(b => b.id === id);
    if (!book) {
        return res.status(404).json({ error: 'Книга не найдена' });
    }
    res.json(book);
});

// GET /books/:id/related — связанные по автору (продвинутый)
app.get('/books/:id/related', (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'ID должен быть числом' });
    }
    const book = books.find(b => b.id === id);
    if (!book) {
        return res.status(404).json({ error: 'Книга не найдена' });
    }
    const related = books.filter(b => b.author === book.author && b.id !== id);
    res.json({
        bookId: id,
        author: book.author,
        relatedCount: related.length,
        related
    });
});

// POST /books — создание
app.post('/books', (req, res) => {
    const errors = validateBook(req.body, false);
    if (errors.length) {
        return res.status(400).json({ error: 'Ошибка валидации', details: errors });
    }

    const newBook = {
        id: nextId++,
        title: req.body.title.trim(),
        author: req.body.author.trim(),
        year: req.body.year !== undefined ? req.body.year : null,
        genre: req.body.genre ? req.body.genre.trim() : 'не указан'
    };

    books.push(newBook);
    res.status(201).json(newBook);
});

// POST /books/bulk — массовое создание (продвинутый)
app.post('/books/bulk', (req, res) => {
    if (!Array.isArray(req.body) || req.body.length === 0) {
        return res.status(400).json({ error: 'Ожидается непустой массив книг' });
    }

    const created = [];
    const failed = [];

    req.body.forEach((item, index) => {
        const errors = validateBook(item, false);
        if (errors.length) {
            failed.push({ index, errors });
        } else {
            const newBook = {
                id: nextId++,
                title: item.title.trim(),
                author: item.author.trim(),
                year: item.year !== undefined ? item.year : null,
                genre: item.genre ? item.genre.trim() : 'не указан'
            };
            books.push(newBook);
            created.push(newBook);
        }
    });

    res.status(201).json({
        createdCount: created.length,
        failedCount: failed.length,
        created,
        failed
    });
});

// PUT /books/:id — полное обновление
app.put('/books/:id', (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'ID должен быть числом' });
    }
    const index = findBookIndex(id);
    if (index === -1) {
        return res.status(404).json({ error: 'Книга не найдена' });
    }

    const errors = validateBook(req.body, false);
    if (errors.length) {
        return res.status(400).json({ error: 'Ошибка валидации', details: errors });
    }

    books[index] = {
        id,
        title: req.body.title.trim(),
        author: req.body.author.trim(),
        year: req.body.year !== undefined ? req.body.year : books[index].year,
        genre: req.body.genre ? req.body.genre.trim() : books[index].genre
    };

    res.json(books[index]);
});

// PATCH /books/:id — частичное обновление (продвинутый)
app.patch('/books/:id', (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'ID должен быть числом' });
    }
    const index = findBookIndex(id);
    if (index === -1) {
        return res.status(404).json({ error: 'Книга не найдена' });
    }

    const errors = validateBook(req.body, true);
    if (errors.length) {
        return res.status(400).json({ error: 'Ошибка валидации', details: errors });
    }

    const book = books[index];
    if (req.body.title !== undefined) book.title = req.body.title.trim();
    if (req.body.author !== undefined) book.author = req.body.author.trim();
    if (req.body.year !== undefined) book.year = req.body.year;
    if (req.body.genre !== undefined) book.genre = req.body.genre.trim();

    res.json(book);
});

// DELETE /books/:id — удаление одного
app.delete('/books/:id', (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'ID должен быть числом' });
    }
    const index = findBookIndex(id);
    if (index === -1) {
        return res.status(404).json({ error: 'Книга не найдена' });
    }

    books.splice(index, 1);
    // 204 No Content (средний/продвинутый уровень)
    res.status(204).send();
});

// DELETE /books — удалить все (продвинутый)
app.delete('/books', (req, res) => {
    const count = books.length;
    books = [];
    res.json({ message: 'Все книги удалены', deletedCount: count });
});

// ========== 404 ==========
app.use((req, res) => {
    res.status(404).json({ error: 'Маршрут не найден' });
});

// ========== Глобальный обработчик ошибок 500 (продвинутый) ==========
app.use((err, req, res, next) => {
    console.error('Internal error:', err);
    logStream.write(`[ERROR] ${new Date().toISOString()} ${err.stack}\n`);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

// ========== Запуск ==========
app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
    console.log('Сущность: Книги (вариант 4). Уровень: продвинутый.');
});
