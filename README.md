# Expense Tracker with AI Intelligence

A modern expense tracking application with AI-powered budgeting recommendations and anomaly detection.

DEMO - https://youtu.be/5x4_1oE66OA

## AI TOOLS , TECH STACK USED : 

- BOLT
- CLAUDE 
- REACT+VITE
- TAILWIND
- NODE + EXPRESS
- RESTFULAPI
- JWT
- PYTHON
- AZURE APIKEY
  
## Features

- **Smart Expense Management**: Track and categorize expenses with real-time updates
- **AI-Powered Budgeting**: Get personalized budget recommendations based on spending patterns
- **Anomaly Detection**: Automatically identify unusual spending patterns
- **Dark/Light Theme**: Full theme support with system preference detection
- **Interactive Dashboard**: Visual representations of spending patterns and budget progress
- **User Profiles**: Customizable profiles with currency preferences and spending categories

## Tech Stack

- **Frontend**: React 18, Redux Toolkit, TailwindCSS, Framer Motion
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **Authentication**: JWT-based auth with token expiration handling
- **UI Components**: Custom components with dark mode support
- **Charts**: Chart.js with React integration

## Prerequisites

- Node.js (v14.0.0 or higher)
- MongoDB (v4.0 or higher)
- npm or yarn

## Installation

1. **Clone and Install Dependencies**
   ```bash
   git clone https://github.com/kingof64sqrs/ExpenseTracker.git
   cd project
   npm install
   ```

2. **Environment Setup**
   Create `.env` file in the server directory:
   ```
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/expense_tracker
   JWT_SECRET=your_jwt_secret
   ```

3. **Start Development Servers**
   ```bash
   # Start backend server
   cd server
   npm start

   # Start frontend (in a new terminal)
   npm run dev

   # Ai agents (in a new terminal)
   cd agent

   # in python main.py add the api key or can be added through environment

   python main.py

   ```


## Key Features Implementation

### 1. Authentication System
- JWT-based authentication
- Token expiration handling
- Secure password hashing
- Protected routes
- Persistent sessions

### 2. Expense Management
- CRUD operations for expenses
- Category-based organization
- Date-based filtering
- Payment method tracking
- Real-time updates

### 3. Budget Management
- Category-wise budgets
- Progress tracking
- Visual indicators for:
  - Under budget (green)
  - Warning zone (yellow)
  - Over budget (red)
- Monthly reset functionality

### 4. AI Features
- Anomaly detection in spending patterns
- Budget recommendations based on:
  - Historical spending
  - Category preferences
  - User-specific patterns
- Confidence scoring for recommendations

### 5. User Preferences
- Currency selection
- Preferred spending categories
- Theme preferences (Dark/Light)
- Profile customization

## API Endpoints

### Authentication
```
POST /api/auth/signup - Register new user
POST /api/auth/login - User login
GET /api/auth/profile - Get user profile
PUT /api/auth/profile - Update user profile
```

### Expenses
```
GET /api/expenses/user/:userId - Get user expenses
POST /api/expenses - Create expense
PUT /api/expenses/:id - Update expense
DELETE /api/expenses/:id - Delete expense
```

### Budgets
```
GET /api/budgets/user/:userId - Get user budgets
POST /api/budgets - Create budget
PUT /api/budgets/:id - Update budget
DELETE /api/budgets/:id - Delete budget
```

## Component Structure

```
src/
├── components/
│   ├── common/          # Reusable components
│   ├── expenses/        # Expense-related components
│   └── budgets/         # Budget-related components
├── pages/               # Main page components
├── store/               # Redux store configuration
├── utils/              # Utility functions
└── api/                # API integration
```

## Error Handling

The application includes comprehensive error handling for:
- Network errors
- Authentication failures
- Data validation
- Token expiration
- Server errors
