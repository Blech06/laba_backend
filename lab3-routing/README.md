# Лабораторная работа №3: Маршрутизация, параметры пути и query-параметры

**Студент:** [ФИО]  
**Группа:** [Группа]  
**Вариант:** 4  
**Сущность:** Книги (books)  
**Технология:** Node.js + Express  
**Уровень:** Продвинутый (60 баллов)

---

## Цель работы

Освоить передачу данных через URL: параметры пути (`req.params`), query-параметры (`req.query`), вложенные маршруты, валидацию входных данных и построение гибкого REST-подобного API на основе данных ЛР №2.

---

## Теоретическое обоснование

**Маршрутизация** — сопоставление HTTP-запроса (метод + URL) с функцией-обработчиком. В Express: `app.METHOD(PATH, HANDLER)`.

Три источника данных в запросе:

| Источник | Где | Express |
|----------|-----|---------|
| Параметры пути | `/books/42` | `req.params.id` |
| Query-параметры | `?search=мир&page=1` | `req.query.search` |
| Тело запроса | JSON в POST/PUT | `req.body` |

Параметры пути и query всегда приходят **строками** — нужна валидация и `parseInt`.  
Вложенные маршруты отражают иерархию: `/books/:id/chapters`, `/authors/:author/books`.  
Более специфичные маршруты объявляют **раньше** общих; wildcard (404) — в конце.

---

## Запуск

```bash
cd lab3-routing
npm install
npm run dev
```

Сервер: http://localhost:3000

---

## Эндпоинты (вариант 4)

### Базовый уровень

| Метод | URL | Описание | Коды |
|-------|-----|----------|------|
| GET | `/books` | Все книги | 200 |
| GET | `/books/:id` | Одна книга | 200 / 400 / 404 |
| GET | `/books/:id/chapters` | Главы книги (вложенный) | 200 / 400 / 404 |
| GET | `/authors/:author/books` | Книги автора (категория) | 200 |

### Средний уровень (query)

| Параметр | Пример | Описание |
|----------|--------|----------|
| `search` | `?search=мир` | Поиск по title |
| `sort` + `order` | `?sort=year&order=desc` | Сортировка (id, title, year, author, genre) |
| `page` + `limit` | `?page=1&limit=3` | Пагинация (limit 1–100) |
| `filter` | `?filter=genre:роман` | Фильтр (genre, year, author) |

Ответ списка: `{ count, page, limit, totalPages, books }`.  
Невалидные sort/order/page/limit → **400**.

### Продвинутый уровень

| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/books/stats` | Статистика: total, byGenre, averageYear, oldest, newest |
| GET | `/books/:bookId/chapters/:chapterId` | Глава книги (множественные params) |
| GET | `/authors/:author/books/:bookId` | Книга автора (вложенный) |
| * | любой неизвестный | Wildcard 404 |
| — | — | Логирование: метод + URL + время + IP |
| — | — | Глобальный обработчик 500 |

---

## Примеры ответов

**GET /books/1**
```json
{ "id": 1, "title": "Война и мир", "author": "Лев Толстой", "year": 1869, "genre": "роман" }
```

**GET /books?filter=genre:роман&sort=year&order=asc&page=1&limit=2**
```json
{
  "count": 4,
  "page": 1,
  "limit": 2,
  "totalPages": 2,
  "books": [ ... ]
}
```

**GET /books/stats**
```json
{
  "total": 6,
  "byGenre": { "роман": 4, "фантастика": 1, "повесть": 1 },
  "averageYear": 1895,
  "oldest": 1866,
  "newest": 1967
}
```

**GET /books/abc** → `400` `{ "error": "ID должен быть положительным числом" }`  
**GET /books/999** → `404` `{ "error": "Книга не найдена" }`  
**GET /unknown** → `404` `{ "error": "Маршрут не найден", "path": "/unknown", "method": "GET" }`

---

## Команды curl

См. файл `curl_commands.txt`.

---

## Контрольные вопросы (ответы)

**1. Что такое маршрутизация?**  
Механизм сопоставления HTTP-запроса (метод + URL) с кодом-обработчиком. В Express: `app.get('/path', handler)`.

**2. Чем отличаются req.params, req.query и req.body?**  
- `req.params` — части пути (`/books/:id` → `req.params.id`)  
- `req.query` — параметры после `?` (`?page=1` → `req.query.page`)  
- `req.body` — тело POST/PUT/PATCH (нужен `express.json()`)

**3. Как получить параметр пути в Express?**  
`req.params.имя`. Значение всегда строка → обычно `parseInt(req.params.id)`.

**4. Что если не преобразовать параметр пути в число?**  
Сравнение `"1" === 1` даст false; поиск по id в массиве чисел не сработает.

**5. Как обработать отсутствие параметра / неверный id?**  
Проверить `isNaN` / `id < 1` → 400; если объект не найден → 404.

**6. Зачем порядок объявления маршрутов?**  
Express идёт сверху вниз. `/books/stats` должен быть **до** `/books/:id`, иначе `stats` попадёт в `:id`.

**7. Что такое вложенные маршруты?**  
URL, отражающие иерархию: `/books/:id/chapters`, `/authors/:author/books/:bookId`.

**8. Для чего wildcard-маршрут?**  
Обработка всех несовпавших путей (кастомный 404). Ставится последним.

---

## Вывод

Реализована гибкая маршрутизация для сущности «Книги»: параметры пути, query (поиск, сортировка, фильтр, пагинация), вложенные ресурсы (главы, книги автора), множественные params, stats, логирование с IP, валидация 400 и обработка 404/500. Освоена разница между `req.params`, `req.query` и важность порядка маршрутов.

---

## Источники

1. Express Routing — https://expressjs.com/en/guide/routing.html  
2. req.params / req.query — https://expressjs.com/en/4x/api.html#req.params  
3. HTTP Status Codes (MDN) — https://developer.mozilla.org/ru/docs/Web/HTTP/Status  
4. REST nested resources — https://restfulapi.net/resource-naming/
