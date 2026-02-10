# Публикация NestedParser в npm

## Подготовка к публикации

### 1. Проверьте package.json

Убедитесь, что в `package.json` указаны:
- ✅ `name` - имя пакета (может быть занято, рассмотрите scoped package)
- ✅ `version` - версия пакета
- ✅ `description` - описание
- ✅ `main`, `module`, `types` - точки входа
- ✅ `exports` - экспорты для разных форматов
- ✅ `files` - какие файлы включать в пакет
- ✅ `license` - лицензия
- ✅ `author` - автор

### 2. Проверьте доступность имени пакета

```bash
npm view nested-parser
```

Если пакет существует, рассмотрите:
- Использование scoped package: `@your-username/nested-parser`
- Или другое имя: `nested-parser-pan` (или другое уникальное)

### 3. Scoped package (рекомендуется)

Если имя занято, используйте scoped package:

```json
{
  "name": "@panko/nested-parser",
  ...
}
```

### 4. Соберите проект

```bash
bun run build
# или
npm run build
```

Убедитесь, что директория `lib/` содержит все необходимые файлы:
- `lib/cjs/` - CommonJS модули
- `lib/esm/` - ES6 модули  
- `lib/*.d.ts` - TypeScript типы

### 5. Проверьте содержимое пакета

```bash
npm pack
```

Это создаст файл `nested-parser-1.0.0.tgz`. Распакуйте и проверьте содержимое:

```bash
tar -xzf nested-parser-1.0.0.tgz
cd package
ls -la
```

Убедитесь, что:
- ✅ Есть директория `lib/` со всеми файлами
- ✅ Есть `package.json`
- ✅ Есть `README.md`
- ✅ Нет `node_modules/`, `src/`, `tsconfig.json` и других ненужных файлов

## Публикация

### 1. Войдите в npm

```bash
npm login
```

Введите:
- Username
- Password
- Email

### 2. Публикация обычного пакета

```bash
npm publish
```

### 3. Публикация scoped package

```bash
npm publish --access public
```

Флаг `--access public` необходим для scoped пакетов, чтобы они были публичными.

## После публикации

### Проверка

```bash
npm view nested-parser
# или для scoped: npm view @panko/nested-parser
```

### Установка в другом проекте

```bash
npm install nested-parser
# или для scoped: npm install @panko/nested-parser
```

## Обновление версии

### 1. Обновите версию в package.json

Вручную или через npm:

```bash
npm version patch   # 1.0.0 -> 1.0.1
npm version minor   # 1.0.0 -> 1.1.0
npm version major   # 1.0.0 -> 2.0.0
```

### 2. Соберите проект

```bash
bun run build
```

### 3. Опубликуйте новую версию

```bash
npm publish
```

## Отзыв пакета

Если нужно удалить опубликованную версию (в течение 72 часов):

```bash
npm unpublish nested-parser@1.0.0
# или для scoped: npm unpublish @panko/nested-parser@1.0.0
```

⚠️ **Внимание**: После 72 часов пакет нельзя удалить, только депрецировать.

## Полезные команды

```bash
# Просмотр информации о пакете
npm view nested-parser

# Просмотр всех версий
npm view nested-parser versions

# Просмотр последней версии
npm view nested-parser version

# Проверка, что пакет установлен правильно
npm list nested-parser
```
