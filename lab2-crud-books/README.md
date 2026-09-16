# Лабораторная работа №2: HTTP-методы (GET, POST, PUT, DELETE)

**Студент:** Мержоев Ислам
**Группа:** ПИЖ-б-о-25-1
**Вариант:** 4  
**Сущность:** Книги (books)  
**Технология:** Node.js + Express  
**Уровень:** Продвинутый (закрывает базовый и средний)

## Содержание
- [Цель работы](#цель-работы)
- [Теоретическое обоснование](#теоретическое-обоснование)
- [Выполнение](#выполнение)
- [Эндпоинты](#эндпоинты)
- [Контрольные вопросы](#контрольные-вопросы)
- [Вывод](#вывод)
- [Источники](#источники)

---

## Цель работы
Освоить обработку HTTP-методов GET, POST, PUT, DELETE (и PATCH) в Express. Реализовать полноценные CRUD-операции над коллекцией объектов в памяти сервера с корректными кодами ответов (200, 201, 204, 400, 404, 500).

---

## Теоретическое обоснование

**CRUD** — Create, Read, Update, Delete — четыре базовые операции над данными:

| Операция | HTTP-метод | Код ответа |
|----------|------------|------------|
| Create   | POST       | 201 Created |
| Read     | GET        | 200 OK / 404 |
| Update   | PUT / PATCH| 200 OK / 404 |
| Delete   | DELETE     | 200 / 204 / 404 |

Данные хранятся в массиве в оперативной памяти. При перезапуске сервера данные сбрасываются — это нормально для учебной работы.

---

## Выполнение

### Установка и запуск

```bash
cd lab2-crud-books
npm install
npm run dev
```

Сервер: `http://localhost:3000`

### Код сервера

Полный код находится в файле `app.js` (более 300 строк). Реализовано:

**Базовый уровень**
- GET /books, GET /books/:id
- POST /books, PUT /books/:id, DELETE /books/:id
- 404 при отсутствии элемента

**Средний уровень**
- Поля: id, title, author, year, genre
- Валидация (400 Bad Request)
- Поиск `?search=`, сортировка `?sort=&order=`, пагинация `?page=&limit=`
- 201 при создании, 204 при удалении

**Продвинутый уровень**
- PATCH /books/:id (частичное обновление)
- DELETE /books (удалить все)
- POST /books/bulk (массовое создание)
- GET /books/stats (статистика по жанрам)
- GET /books/:id/related (книги того же автора)
- Логирование в `access.log`
- Глобальный обработчик ошибок 500

---

## Эндпоинты

| Метод | URL | Описание | Код |
|-------|-----|----------|-----|
| GET | /books | Список (+ search, sort, page, limit) | 200 |
| GET | /books/:id | Одна книга | 200 / 404 |
| GET | /books/stats | Статистика | 200 |
| GET | /books/:id/related | Связанные по автору | 200 / 404 |
| POST | /books | Создать книгу | 201 / 400 |
| POST | /books/bulk | Массовое создание | 201 / 400 |
| PUT | /books/:id | Полное обновление | 200 / 400 / 404 |
| PATCH | /books/:id | Частичное обновление | 200 / 400 / 404 |
| DELETE | /books/:id | Удалить одну | 204 / 404 |
| DELETE | /books | Удалить все | 200 |

### Примеры запросов (curl)

```bash
# Все книги
curl http://localhost:3000/books

# Поиск
curl "http://localhost:3000/books?search=война"

# Сортировка и пагинация
curl "http://localhost:3000/books?sort=year&order=desc&page=1&limit=3"

# Одна книга
curl http://localhost:3000/books/1

# Статистика
curl http://localhost:3000/books/stats

# Связанные
curl http://localhost:3000/books/1/related

# Создать
curl -X POST http://localhost:3000/books \
  -H "Content-Type: application/json" \
  -d '{"title":"Идиот","author":"Фёдор Достоевский","year":1869,"genre":"роман"}'

# Массовое создание
curl -X POST http://localhost:3000/books/bulk \
  -H "Content-Type: application/json" \
  -d '[{"title":"Книга 1","author":"Автор 1","year":2000,"genre":"детектив"},{"title":"Книга 2","author":"Автор 2","year":2010,"genre":"фантастика"}]'

# Полное обновление
curl -X PUT http://localhost:3000/books/1 \
  -H "Content-Type: application/json" \
  -d '{"title":"Война и мир (новое издание)","author":"Лев Толстой","year":1869,"genre":"роман"}'

# Частичное обновление
curl -X PATCH http://localhost:3000/books/1 \
  -H "Content-Type: application/json" \
  -d '{"year":1870}'

# Удалить одну
curl -X DELETE http://localhost:3000/books/5 -i

# Удалить все
curl -X DELETE http://localhost:3000/books
```

---

## Контрольные вопросы

1. **Что такое CRUD?**  
   Create, Read, Update, Delete — четыре базовые операции над данными.

2. **Какие HTTP-методы соответствуют CRUD?**  
   POST (Create), GET (Read), PUT/PATCH (Update), DELETE (Delete).

3. **Чем PUT отличается от PATCH?**  
   PUT — полное замещение ресурса. PATCH — частичное обновление только переданных полей.

4. **Какие коды состояния используются?**  
   200 OK, 201 Created, 204 No Content, 400 Bad Request, 404 Not Found, 500 Internal Server Error.

5. **Почему данные в памяти теряются при перезапуске?**  
   Потому что они хранятся в переменной JavaScript-процесса. При остановке процесса память очищается.

6. **Зачем нужна валидация?**  
   Чтобы отклонять некорректные данные (пустые поля, неверные типы) и возвращать 400 вместо создания «битых» объектов.

7. **Что такое идемпотентность?**  
   Повторный одинаковый запрос даёт тот же результат. GET, PUT, DELETE — идемпотентны; POST — нет.

8. **Зачем логирование в файл?**  
   Для аудита, отладки и анализа нагрузки после остановки сервера.

---

## Вывод

Реализован полноценный REST-подобный API для сущности «Книги» (вариант 4) на продвинутом уровне. Освоены все основные HTTP-методы, валидация, поиск/сортировка/пагинация, массовые операции, статистика, связанные ресурсы, логирование и обработка ошибок. Данные хранятся в памяти — этого достаточно для учебных целей.

---

## Источники

1. Express Routing — https://expressjs.com/en/guide/routing.html  
2. HTTP Methods (MDN) — https://developer.mozilla.org/ru/docs/Web/HTTP/Methods  
3. HTTP Status Codes (MDN) — https://developer.mozilla.org/ru/docs/Web/HTTP/Status  
4. REST API Tutorial — https://restfulapi.net/  
5. Postman Learning Center — https://learning.postman.com/
