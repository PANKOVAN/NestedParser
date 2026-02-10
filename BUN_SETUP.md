# Настройка Bun для проекта

## Текущее решение

Проект использует Bun через команду `bun`, которая доступна в PATH. Все скрипты в `package.json` используют `bun` и `bunx` напрямую.

## Использование

Сборка проекта:

```bash
npm run build
# или
npm run build:incremental
```

Также можно использовать Bun напрямую:

```bash
bun run build
bun run build:incremental
bun run clean
```

## Доступные скрипты

- `build` - полная сборка проекта (CJS + ESM + типы)
- `build:incremental` - инкрементальная сборка (быстрее)
- `build:cjs` - сборка CommonJS версии
- `build:esm` - сборка ES Module версии
- `build:types` - генерация TypeScript типов
- `rename` - переименование и организация файлов
- `clean` - очистка директории сборки
