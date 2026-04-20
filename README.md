# Khana Sathi - Food Delivery Platform

A full-stack food delivery application with advanced features including group ordering, real-time chat, loyalty rewards, and child account controls. Built with Node.js/Express backend and Next.js frontend.

## Table of Contents

- [Project Overview](#project-overview)
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Backend Setup](#backend-setup)
- [Frontend Setup](#frontend-setup)
- [Running the Project](#running-the-project)
- [Testing](#testing)
- [Project Features](#project-features)

## Project Overview

**Khana Sathi** is a comprehensive food delivery platform featuring:
- User authentication and authorization
- Multi-restaurant ordering system
- Group ordering functionality
- Real-time chat and notifications
- Loyalty and rewards program
- Child account management
- Payment processing
- Order tracking and analytics
- Rider management

## Prerequisites

Before running this project, ensure you have the following installed:

- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Docker & Docker Compose** (for backend database setup) - [Download](https://www.docker.com/products/docker-desktop)
- **Git** (optional, for cloning the repository)

To verify installations:
```bash
node --version
npm --version
docker --version
docker-compose --version
```

## Project Structure

```
FInal Year Project/
├── Backend/                    # Node.js/Express API server
│   ├── src/
│   │   ├── config/            # Database configuration
│   │   ├── controller/        # Route controllers
│   │   ├── models/            # Database models
│   │   ├── routes/            # API route definitions
│   │   ├── middleware/        # Express middleware
│   │   ├── services/          # Business logic services
│   │   └── utils/             # Utility functions
│   ├── tests/                 # Test files and setup
│   ├── docker-compose.yml     # Docker services configuration
│   ├── index.js               # Server entry point
│   ├── jest.config.js         # Testing configuration
│   └── package.json           # Dependencies
│
└── Frontend/                   # Next.js React application
    └── khana-sathi/
        ├── app/               # Next.js app directory
        ├── components/        # Reusable React components
        ├── context/           # React context for state management
        ├── hooks/             # Custom React hooks
        ├── lib/               # Utility libraries
        ├── public/            # Static assets
        ├── e2e/               # End-to-end tests
        ├── test/              # Component tests
        ├── next.config.ts     # Next.js configuration
        ├── tsconfig.json      # TypeScript configuration
        └── package.json       # Dependencies
```

## Backend Setup

### Step 1: Navigate to Backend Directory
```bash
cd Backend
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Create a `.env` file in the `Backend` directory with the following variables:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=27017
DB_NAME=khana_sathi
DB_URI=mongodb://localhost:27017/khana_sathi

# JWT Authentication
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d

# Email Service (if applicable)
EMAIL_SERVICE=your_email_service
EMAIL_USER=your_email
EMAIL_PASSWORD=your_password

# Payment Gateway (if applicable)
PAYMENT_API_KEY=your_payment_key

# Other configurations as needed
FRONTEND_URL=http://localhost:3000
```

### Step 4: Start Database with Docker
```bash
docker-compose up -d
```

This will start MongoDB and any other services defined in `docker-compose.yml`.

Verify the database is running:
```bash
docker-compose ps
```

### Step 5: Run the Backend Server
```bash
npm run dev
```

The backend will start on `http://localhost:5000` (or the PORT specified in .env).

You should see output like:
```
Server running on port 5000
Database connected
```

### Backend Available Scripts
```bash
npm run dev         # Start development server with hot reload
npm start           # Start production server
npm test            # Run all tests
npm run test:watch  # Run tests in watch mode
npm run lint        # Run ESLint
```

## Frontend Setup

### Step 1: Navigate to Frontend Directory
```bash
cd Frontend/khana-sathi
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Create a `.env.local` file in the `Frontend/khana-sathi` directory:
```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_APP_NAME=Khana Sathi

# Other frontend-specific configurations
```

### Step 4: Run the Development Server
```bash
npm run dev
```

The frontend will be accessible at `http://localhost:3000`.

You should see output confirming the Next.js server is running.

### Frontend Available Scripts
```bash
npm run dev         # Start development server
npm run build       # Build for production
npm start           # Start production server
npm test            # Run Jest tests
npm run test:watch  # Run tests in watch mode
npm run lint        # Run ESLint
npm run e2e         # Run Playwright e2e tests
```

## Running the Project

### Option 1: Run Both Backend and Frontend (Recommended)

**Terminal 1 - Start Backend:**
```bash
cd Backend
npm install
docker-compose up -d
npm run dev
```

**Terminal 2 - Start Frontend:**
```bash
cd Frontend/khana-sathi
npm install
npm run dev
```

Then open your browser and navigate to:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

### Option 2: Run Backend Only
```bash
cd Backend
npm install
docker-compose up -d
npm run dev
```

API will be available at `http://localhost:5000`

### Option 3: Run Frontend Only
```bash
cd Frontend/khana-sathi
npm install
npm run dev
```

Frontend will be available at `http://localhost:3000`

## Testing

### Backend Tests
```bash
cd Backend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- authController.test.js
```

Test files are located in `Backend/tests/`:
- `api/` - API endpoint tests
- `controllers/` - Controller unit tests
- `middleware/` - Middleware tests
- `helpers/` - Test utility helpers

### Frontend Tests
```bash
cd Frontend/khana-sathi

# Run Jest tests
npm test

# Run tests in watch mode
npm run test:watch

# Run E2E tests with Playwright
npm run e2e
```

## Project Features

### User Management
- User registration and authentication
- Child account creation and controls
- User profile management
- Address management

### Ordering System
- Single and group orders
- Menu browsing by restaurant
- Cart management
- Order history and tracking

### Advanced Features
- Real-time chat between users and support
- Loyalty rewards program
- Promo code management
- Multiple payment methods
- Analytics dashboard
- Notification system
- Rider payment claims
- Support ticket system

### Admin Features
- Staff management
- System settings configuration
- Analytics and reporting
- Order management

## Stopping Services

### Stop Backend Server
Press `Ctrl + C` in the backend terminal

### Stop Frontend Server
Press `Ctrl + C` in the frontend terminal

### Stop Docker Services
```bash
cd Backend
docker-compose down
```

## Troubleshooting

### Backend Won't Start
1. Check if MongoDB is running: `docker-compose ps`
2. Verify all environment variables are set correctly in `.env`
3. Check if port 5000 is already in use
4. Review error logs in terminal

### Frontend Won't Start
1. Ensure Node.js version is v14 or higher
2. Delete `node_modules` and `.next` folder, then reinstall: `npm install && npm run dev`
3. Check if port 3000 is already in use
4. Clear Next.js cache: `rm -rf .next`

### Database Connection Issues
1. Verify Docker containers are running: `docker-compose ps`
2. Check database URI in `.env` file
3. Restart Docker: `docker-compose restart`

### API Connection Issues from Frontend
1. Ensure backend is running on correct port
2. Check `NEXT_PUBLIC_API_URL` in `.env.local`
3. Verify CORS settings in backend if needed

## Additional Notes

- The project uses TypeScript in the frontend for type safety
- Backend uses MongoDB for data persistence
- Real-time features are powered by Socket.io
- Tests are configured with Jest for both backend and frontend
- The project follows RESTful API design patterns

## Support

For issues or questions, please refer to the individual README files in `Backend/` and `Frontend/khana-sathi/` directories for more specific guidance.

---

**Last Updated**: April 2026
