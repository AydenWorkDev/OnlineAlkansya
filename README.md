# OnlineAlkansya 🐷

**Expenses & Income Tracker**: a simple, frontend-only web app to track your income, expenses, salary, and savings goals.

> ⚠️ This is a **frontend-only** project. There is no database. All records are saved in your browser only (`localStorage`). All amounts are fictional and no real money is involved.

## Features

### 🔐 Authentication
- Log in and Sign up with email and password (minimum 8 characters)
- Show/hide password toggle
- Forgot password option
- Records are saved in the browser only

### 📊 Dashboard
- Personalized greeting with the current date
- Summary cards:
  - **Available balance**
  - **Income**
  - **Expenses**
  - **Saved for goals**
- **Spending limit** bar: you can only spend the money you have in your tracker, so add income first

### ➕ Transactions
- Add **Income** or **Expenses** with description, amount, and category (e.g. Salary)
- **Transaction History** with search and filters (All / Income / Expense)

### 💼 Salary Tracker
- Total salary received
- Number of salary payments
- Date of last salary

### 🥧 Where Your Money Goes
- Spending breakdown by category, shown once you add an expense

### 🎯 Other Pages
- **Goals**: set and track savings goals
- **Profile**: view your account details
- **Settings**: customize the app

## Tech Stack

- HTML, CSS, JavaScript
- `localStorage` for data storage
- Hosted on GitHub Pages

## How It Works

1. Sign up with an email and password.
2. Log in to open your dashboard.
3. Add income first (e.g. your salary) to build your available balance.
4. Add expenses. The spending limit stops you from spending more than you have.
5. Move money to your goals to track your savings.

> 🔒 **Note:** Because there is no backend, login is for demo purposes only. Do not use your real password. Clearing your browser data will erase your records.

## Future Improvements

- Real backend with secure authentication (Firebase / Supabase)
- Export to CSV or PDF
- Monthly and yearly reports with charts
- Multi-device sync

## Author
Made by [Cris Allen | @aydenworkdev] (https://github.com/aydenworkdev)
