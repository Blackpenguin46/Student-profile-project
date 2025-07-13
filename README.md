# Student Profile & Goal Tracking System

🏆 **Competition Entry** - A comprehensive web application for educators to track student goals, interests, and skills.

## Overview

This system provides a centralized platform for collecting, organizing, and visualizing student information to enable more personalized learning experiences. Built with modern technologies and following security best practices.

## Features

- **Student Profile Management** - Comprehensive CRUD operations for student data
- **Dynamic Survey Tool** - Customizable surveys with multiple question types
- **Resume Upload & Parsing** - Automatic extraction of skills and experience
- **Data Visualization** - Interactive dashboards and analytics
- **Search & Filter** - Advanced filtering for student grouping
- **Data Export** - Multiple export formats (CSV, JSON, PDF)

## Tech Stack

### Backend
- Node.js with Express.js
- MariaDB database
- Session-based authentication
- File upload with BLOB storage
- RESTful API design

### Frontend
- React 18 with JavaScript
- Bootstrap 5 for styling
- React Router for navigation
- Axios for API communication
- Recharts for data visualization

### Development
- Docker & Docker Compose
- ESLint & Prettier
- Git version control

## Quick Start

### Prerequisites
- Node.js 16+
- Docker & Docker Compose
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd student-profile-challenge
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Start with Docker (Recommended)**
   ```bash
   npm run docker:up
   ```

4. **Start development servers**
   ```bash
   npm run dev
   ```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Database: localhost:3306

### Manual Setup (Alternative)

1. **Start MariaDB**
   ```bash
   docker-compose up mariadb -d
   ```

2. **Start backend**
   ```bash
   cd src/backend
   npm install
   npm run dev
   ```

3. **Start frontend**
   ```bash
   cd src/frontend
   npm install
   npm start
   ```

## Demo Accounts

For development/testing:

- **Teacher**: teacher@demo.com / teacher123
- **Student**: student1@demo.com / student123  
- **Admin**: admin@demo.com / admin123

## Project Structure

```
student-profile-challenge/
├── src/
│   ├── backend/           # Express.js API server
│   │   ├── routes/        # API endpoints
│   │   ├── middleware/    # Auth, security, validation
│   │   ├── config/        # Database, logging
│   │   └── services/      # Business logic
│   ├── frontend/          # React application
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   ├── contexts/
│   │   │   └── hooks/
│   │   └── public/
│   └── database/          # Schema and migrations
├── docs/                  # Documentation
├── tasks/                 # Development tasks
└── logs/                  # Application logs
```

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user info

### Student Endpoints
- `GET /api/students` - List students (teachers only)
- `GET /api/students/:id` - Get student profile
- `PUT /api/students/:id` - Update student profile
- `POST /api/students/:id/goals` - Create student goal

### Survey Endpoints
- `GET /api/surveys/templates` - List survey templates
- `POST /api/surveys/templates` - Create survey template
- `POST /api/surveys/assign` - Assign survey to students

### File Endpoints
- `POST /api/files/upload/resume` - Upload resume
- `GET /api/files/download/:id` - Download file

### Analytics Endpoints
- `GET /api/analytics/class/:id` - Class analytics
- `GET /api/analytics/skills` - Skills distribution

## Security Features

- **Authentication** - Session-based auth with bcrypt password hashing
- **Authorization** - Role-based access control (RBAC)
- **Input Validation** - Comprehensive request validation and sanitization
- **Rate Limiting** - API rate limiting to prevent abuse
- **Security Headers** - Helmet.js for security headers
- **File Upload Security** - Type validation and size limits
- **CORS Protection** - Configured CORS for frontend communication

## Database Schema

Key entities:
- `users` - Authentication and user info
- `student_profiles` - Student profile data
- `goals` - Student goals and objectives
- `skills` / `student_skills` - Skills inventory
- `interests` / `student_interests` - Interest tracking
- `survey_templates` / `survey_responses` - Survey system
- `uploaded_resumes` / `parsed_resume_data` - File management

## Development

### Available Scripts

```bash
# Install all dependencies
npm run install:all

# Start development (frontend + backend)
npm run dev

# Start backend only
npm run dev:backend

# Start frontend only
npm run dev:frontend

# Build production
npm run build

# Run tests
npm test

# Docker commands
npm run docker:up
npm run docker:down

# Setup everything
npm run setup
```

### Code Quality

- ESLint for code linting
- Prettier for code formatting
- Git hooks for pre-commit checks

### Testing

- Jest for unit testing
- React Testing Library for component testing
- Supertest for API testing

## Deployment

### Production Environment

1. **Environment Variables**
   - Copy `.env.example` to `.env`
   - Update all secrets and credentials
   - Set `NODE_ENV=production`

2. **Database Setup**
   - Run database migrations
   - Seed initial data

3. **Build & Deploy**
   - `npm run build`
   - Deploy built files to server
   - Configure reverse proxy (nginx)
   - Set up SSL certificates

### Health Checks

- `GET /api/health` - Basic health check
- `GET /api/health/detailed` - Detailed system status
- `GET /api/health/ready` - Readiness probe
- `GET /api/health/live` - Liveness probe

## Contributing

1. Follow the established code style
2. Write tests for new features
3. Update documentation
4. Create descriptive commit messages
5. Submit pull requests for review

## Competition Features

This system was built for an educational technology competition with focus on:

- **Intuitive Design** - User-friendly interface for educators
- **Robust Architecture** - Scalable and maintainable codebase
- **Security Best Practices** - OWASP compliance and data protection
- **Performance** - Optimized for speed and responsiveness
- **Innovation** - Creative solutions for student data management

## License

MIT License - Competition Entry

## Support

For issues and questions:
- Check the documentation in `/docs`
- Review the troubleshooting guide
- Contact the development team

---

**Built with ❤️ for the Student Profile System Competition**