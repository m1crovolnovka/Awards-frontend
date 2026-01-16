# Инструкция по деплою приложения

## Настройка переменной окружения NEXT_PUBLIC_API_URL

Переменная `NEXT_PUBLIC_API_URL` определяет URL бэкенд API. Она должна быть установлена на этапе сборки приложения.

### ⚠️ Важно для Next.js

Переменные с префиксом `NEXT_PUBLIC_` встраиваются в клиентский бандл **во время сборки** (build time), а не во время выполнения (runtime). Это означает:

- ✅ Изменение переменной требует **пересборки** приложения
- ✅ Переменная будет доступна в браузере пользователя
- ✅ Не храните секреты в `NEXT_PUBLIC_` переменных!

---

## Деплой на различных хостингах

### Vercel

1. Импортируйте проект в Vercel
2. Перейдите в **Settings → Environment Variables**
3. Добавьте переменную:
   - **Name**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://your-backend-api.com`
   - **Environments**: Production, Preview, Development
4. Нажмите **Save**
5. Пересоберите приложение (автоматически при следующем деплое или вручную)

**Vercel автоматически использует переменные окружения при сборке!**

---

### Netlify

1. Перейдите в **Site settings → Environment variables**
2. Добавьте переменную:
   - **Key**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://your-backend-api.com`
   - **Scopes**: Production, Deploy previews, Branch deploys
3. Сохраните
4. Пересоберите приложение через **Deploys → Trigger deploy**

---

### Railway

1. В настройках проекта перейдите в **Variables**
2. Добавьте переменную:
   - **Name**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://your-backend-api.com`
3. Сохраните
4. Railway автоматически пересоберет приложение

---

### Render

1. В настройках сервиса перейдите в **Environment**
2. Добавьте переменную:
   - **Key**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://your-backend-api.com`
3. Сохраните
4. Render автоматически пересоберет приложение

---

### Docker (локально или на сервере)

#### Используя docker-compose:

Создайте файл `.env` в корне проекта:
```env
NEXT_PUBLIC_API_URL=https://your-backend-api.com
```

Затем запустите:
```bash
docker-compose build
docker-compose up
```

#### Используя docker build:

```bash
docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://your-backend-api.com \
  -t new-year-voting-app .
  
docker run -p 3000:3000 new-year-voting-app
```

---

### Другие хостинги (Node.js)

1. Установите переменную окружения в настройках хостинга
2. **Обязательно пересоберите** приложение после изменения переменной:
   ```bash
   npm run build
   npm start
   ```

---

## Проверка правильности настройки

После деплоя проверьте в консоли браузера (F12 → Console):
```javascript
// Должен показать ваш URL API
console.log(process.env.NEXT_PUBLIC_API_URL)
```

Или проверьте Network вкладку - все запросы к API должны идти на ваш бэкенд.

---

## Локальная разработка

Создайте файл `.env.local` в корне проекта:
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

Перезапустите dev сервер:
```bash
npm run dev
```

---

## Примеры значений

- Локальная разработка: `http://localhost:8080`
- Продакшн: `https://api.yourdomain.com`
- Без протокола (если API на том же домене): `/api` (не рекомендуется для этого проекта)

