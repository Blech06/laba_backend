const express = require('express');
const app = express();
const port = 3000;

// ========== Middleware: консольное логирование всех запросов ==========
// (требование повышенного уровня)
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.url}`);
    next();
});

// ========== 1. Текстовый эндпоинт (корневой маршрут) ==========
// Вариант 4 (базовый уровень): "Welcome!"
app.get('/', (req, res) => {
    res.send('Welcome!');
});

// ========== 2. JSON-эндпоинт 1 (коллекция / сущность) ==========
// Вариант 4 (средний + повышенный): /api/cities → /api/books
app.get('/api/books', (req, res) => {
    res.json([
        { id: 1, title: 'Война и мир', author: 'Лев Толстой', year: 1869 },
        { id: 2, title: 'Преступление и наказание', author: 'Фёдор Достоевский', year: 1866 },
        { id: 3, title: 'Мастер и Маргарита', author: 'Михаил Булгаков', year: 1967 },
        { id: 4, title: 'Анна Каренина', author: 'Лев Толстой', year: 1877 },
        { id: 5, title: 'Идиот', author: 'Фёдор Достоевский', year: 1869 }
    ]);
});

// ========== 3. JSON-эндпоинт 2 (справочник) ==========
// Вариант 4 (средний + повышенный): /api/countries → /api/authors
app.get('/api/authors', (req, res) => {
    res.json([
        { id: 1, name: 'Лев Толстой', country: 'Россия', birthYear: 1828 },
        { id: 2, name: 'Фёдор Достоевский', country: 'Россия', birthYear: 1821 },
        { id: 3, name: 'Михаил Булгаков', country: 'Россия', birthYear: 1891 },
        { id: 4, name: 'Антон Чехов', country: 'Россия', birthYear: 1860 },
        { id: 5, name: 'Александр Пушкин', country: 'Россия', birthYear: 1799 }
    ]);
});

// ========== 4. JSON-эндпоинт с параметром в пути ==========
// Вариант 4 (повышенный уровень): /api/books/:id
app.get('/api/books/:id', (req, res) => {
    const bookId = req.params.id;
    res.json({
        requestedId: Number(bookId) || bookId,
        status: 'success',
        message: `Информация о книге с ID ${bookId}`,
        // Можно добавить заглушку данных
        book: {
            id: Number(bookId) || bookId,
            title: 'Книга (заглушка)',
            available: true
        }
    });
});

// ========== Дополнительно: эндпоинт из базового уровня (для полноты) ==========
// /api/health (вариант 4, базовый)
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        uptime: '100s'
    });
});

// ========== 5. Обработка 404 (средний + повышенный уровень) ==========
app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
});

// ========== Запуск сервера ==========
app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
    console.log('Режим: разработка (используйте npm run dev для авто-перезапуска)');
});
