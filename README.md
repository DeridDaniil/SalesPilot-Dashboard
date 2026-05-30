# SalesPilot Dashboard

**EN —** Frontend-only CRM dashboard demo with role-based UI, client and lead management, analytics, and responsive layout.
**RU —** Русскоязычный demo CRM dashboard с ролями, клиентами, лидами, аналитикой и адаптивным интерфейсом.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Redux Toolkit](https://img.shields.io/badge/Redux_Toolkit-2-764ABC?logo=redux&logoColor=white)
![Recharts](https://img.shields.io/badge/Recharts-3-22C7D6)
![Vitest](https://img.shields.io/badge/Vitest-4-6E9F18?logo=vitest&logoColor=white)

## 🔗 Links / Ссылки

- **Live Demo:** https://sales-pilot-dashboard.vercel.app/
- **GitHub Repository:** https://github.com/DeridDaniil/SalesPilot-Dashboard

---

## 🇬🇧 English

### Overview

**SalesPilot Dashboard** is a frontend-only CRM dashboard demo built as a portfolio case study. It demonstrates a role-based interface, client and lead management, custom UI components, localStorage persistence, responsive layouts, charts, and a demo authentication flow.

There is **no real backend** — all data is seeded from mock data and persisted in the browser's `localStorage`. Authentication is **demo-only** (no real security). The interface and demo data are localized for the Russian market, and monetary values are shown in rubles (`₽`).

The app showcases typical CRM scenarios end to end: signing in with different roles, browsing and editing clients, moving leads through a pipeline and converting a won lead into a client, managing users as an admin, and reviewing analytics on the dashboard.

### Features

- Role-based interface for **admin** and **managers**
- Demo authentication and registration flow
- Client management (list, details, create, edit)
- Lead management and lead-to-client conversion
- Manager management for the admin role
- Dashboard analytics with charts (revenue, conversion funnel, weekly activity)
- Custom dropdown / select component
- Responsive layout for desktop, tablet and mobile
- Demo data reset
- localStorage persistence
- Russian localized demo data and RUB currency formatting

### Portfolio note

This is a frontend-only CRM dashboard demo built to demonstrate routing, role-based UI, CRUD flows, state management, charts, local persistence, custom UI components and responsive layout.

### Limitations

- No real backend
- Demo authentication only
- Data is stored in `localStorage`
- Passwords are stored in plain text only inside the mock/demo mode
- Not intended for production use

---

## 🇷🇺 Русский

### Обзор

**SalesPilot Dashboard** — это русскоязычный frontend-only CRM dashboard, созданный как проект для портфолио. Он демонстрирует role-based интерфейс, управление клиентами, лидами и менеджерами, кастомные UI-компоненты, хранение данных в `localStorage`, адаптивную вёрстку, графики и demo-авторизацию.

В проекте **нет реального backend** — все данные берутся из мок-данных и сохраняются в `localStorage` браузера. Авторизация **демонстрационная** (без настоящей безопасности). Интерфейс и демо-данные локализованы под русский рынок, а денежные значения отображаются в рублях (`₽`).

Приложение показывает типичные CRM-сценарии целиком: вход под разными ролями, просмотр и редактирование клиентов, ведение лидов по воронке и конвертацию выигранного лида в клиента, управление пользователями для администратора и просмотр аналитики на дашборде.

### Возможности

- Интерфейс с ролями **администратора** и **менеджера**
- Демо-авторизация и регистрация
- Управление клиентами (список, карточка, создание, редактирование)
- Управление лидами и конвертация лида в клиента
- Управление менеджерами для администратора
- Аналитический дашборд с графиками (выручка, воронка конверсии, активность за неделю)
- Кастомные dropdown / select компоненты
- Адаптивная вёрстка для desktop, tablet и mobile
- Сброс demo-данных
- Хранение данных в `localStorage`
- Русскоязычные demo-данные и отображение валюты в рублях

### Примечание для портфолио

Это frontend-only demo-проект, созданный для демонстрации маршрутизации, role-based интерфейса, CRUD-сценариев, управления состоянием, графиков, локального хранения данных, кастомных UI-компонентов и адаптивной вёрстки.

### Ограничения

- Нет реального backend
- Авторизация демонстрационная
- Данные хранятся в `localStorage`
- Пароли хранятся в открытом виде только в рамках mock/demo-режима
- Проект не предназначен для production-использования

---

## 👤 Demo accounts / Демо-аккаунты

| Role / Роль          | Email                  | Password / Пароль | Name / Имя         |
| -------------------- | ---------------------- | ----------------- | ------------------ |
| Admin / Администратор | `admin@salespilot.ru` | `admin`           | Александр Морозов  |
| Manager / Менеджер    | `anna@salespilot.ru`  | `manager`         | Анна Кузнецова     |
| Manager / Менеджер    | `ivan@salespilot.ru`  | `manager`         | Иван Соколов       |

> Users created by the admin get the default password `12345` and must change it on first login. / Пользователи, созданные администратором, получают пароль по умолчанию `12345` и меняют его при первом входе.

## 🛠 Tech stack / Стек

- **React**
- **TypeScript**
- **Vite**
- **Redux Toolkit**
- **React Router**
- **Recharts**
- **Vitest**
- **ESLint**
- **CSS** (plain CSS files + CSS variables / design tokens)

## 📁 Project structure / Структура проекта

```
src/
├── app/              # Redux store + typed hooks
├── features/
│   ├── auth/         # Login, registration, auth slice
│   ├── clients/      # Clients list, details, form, slice
│   ├── dashboard/    # KPIs and charts
│   ├── leads/        # Leads board, form, slice, lead → client conversion
│   ├── managers/     # Admin user management
│   ├── profile/      # Profile, password change, demo data reset
│   ├── rules/        # Help / about page
│   ├── legal/        # Privacy policy & terms
│   └── not-found/    # 404 page
├── shared/
│   ├── components/   # Sidebar, Header, ProtectedRoute, StateViews, ForcePasswordModal
│   ├── ui/           # Reusable UI primitives (CustomSelect, Modal, useBodyScrollLock)
│   ├── services/     # auth / clients / leads / dashboard / storage services + mockData
│   ├── styles/       # Shared primitives.css
│   ├── utils/        # Helpers (RUB currency formatting)
│   ├── types/        # Domain types
│   └── i18n.ts       # Russian UI dictionary
├── test/             # Vitest setup + smoke test
├── App.tsx           # Route tree
└── main.tsx          # Entry point
```

## 🚀 Getting started / Запуск проекта

Requires Node.js 20+ and npm 10+. / Требуется Node.js 20+ и npm 10+.

```bash
# install dependencies / установка зависимостей
npm install

# start the dev server (http://localhost:5173) / дев-сервер
npm run dev

# type-check + production build / проверка типов и сборка
npm run build

# preview the production build / просмотр прод-сборки
npm run preview

# lint / линтер
npm run lint

# run tests / тесты
npm test -- --run
```

## ☁️ Deployment / Деплой

Deployed on **Vercel**: https://sales-pilot-dashboard.vercel.app/

As a static SPA, it can be hosted on any static host (Vercel, Netlify, Cloudflare Pages, GitHub Pages). Configure the host to serve `index.html` on unknown paths (SPA fallback) so React Router deep links resolve correctly. / Это статическое SPA — подойдёт любой статический хостинг; нужно настроить SPA-fallback на `index.html` для корректной работы deep links React Router.

## ✍️ Author / Автор

Created by **Daniil Derid**
GitHub: https://github.com/DeridDaniil
