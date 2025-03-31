# Expense Tracker

A simple and elegant expense tracking web application with user authentication, expense management, and reporting features.

## Features

- **User Authentication**
  - Register and login with username, email, and password
  - Secure password storage with bcrypt
  - Session-based authentication

- **Expense Management**
  - Add, edit, and delete expenses
  - Categorize expenses
  - View all expenses with filtering and sorting

- **Dashboard**
  - Overview of total expenses
  - Current month expenses
  - Average daily expense
  - Top expense categories
  - Recent expense activity

- **Reporting**
  - Generate reports for specific date ranges
  - View expense breakdown by category
  - Expense details for the selected period
  - Print reports

- **UI Features**
  - Responsive design for all devices
  - Soothing animations
  - Clean and intuitive interface
  - Modern design with cards and widgets

## Technologies Used

- **Frontend**
  - HTML5
  - CSS3 with animations
  - JavaScript (ES6+)
  - FontAwesome icons
  - Google Fonts

- **Backend**
  - Node.js
  - Express.js
  - MySQL Database
  - express-session for authentication

## Installation

1. Clone the repository
   ```
   git clone <repository-url>
   cd expense-tracker
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Configure the database
   - Create a MySQL database
   - Update the .env file with your database credentials

4. Start the server
   ```
   npm run dev
   ```

5. Access the application
   - Open your browser and navigate to `http://localhost:3000`

## Database Setup

The application will automatically set up the necessary database tables on first run. The database schema includes:

- **users** - Stores user account information
- **expenses** - Stores all expense records with user references

## Environment Variables

Create a `.env` file in the project root with the following variables:

```
PORT=3000
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=expense_tracker
SESSION_SECRET=your_secret_key_here
```

## Usage

1. Register a new account
2. Log in with your credentials
3. Add your expenses with amount, category, date, and optional description
4. View and manage your expenses
5. Generate reports for specific date ranges

## License

MIT License 