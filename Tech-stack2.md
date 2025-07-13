# Technology Stack for Student Profile & Goal Tracking System

## Overview
This document outlines a simplified technology stack for the Student Profile & Goal Tracking System, following the principle of minimal complexity and maximum maintainability as specified in CLAUDE.md.

## Simplified Stack Summary (Recommended)
### Essential Technologies Only
- Frontend: React with plain JavaScript (skip TypeScript for simplicity)
- Backend: Express.js with minimal middleware
- Database: MariaDB with raw SQL queries (skip ORM for simplicity)
- Styling: Plain CSS or single CSS framework (Bootstrap)
- File Storage: Database BLOB storage (as specified)
- Authentication: Simple session-based auth with express-session

### Development Approach
- Start with a monolithic architecture
- Use server-side rendering where possible
- Minimize external dependencies
- Focus on core features first
- Add complexity only when absolutely necessary

## Full Technology Stack (For Reference)
Note: The following is a comprehensive list of technologies. For initial development, use only the simplified stack above.

### Frontend
#### Core Framework
- React 18.x with TypeScript
  - Component-based architecture for reusable UI elements
  - Strong typing for better maintainability
  - Large ecosystem and community support
  - Excellent performance with React 18's concurrent features
#### UI Framework & Styling
- Material-UI (MUI) v5
  - Comprehensive component library
  - Built-in accessibility features
  - Responsive design out of the box
  - Theming support for consistent design
- Tailwind CSS
  - Utility-first CSS for custom styling
  - Excellent responsive design utilities
  - Small bundle size with PurgeCSS
#### State Management
- Redux Toolkit with RTK Query
  - Centralized state management
  - Built-in caching for API responses
  - Optimistic updates for better UX
  - DevTools for debugging
#### Form Handling
- React Hook Form
  - Performant form handling
  - Built-in validation
  - Works well with TypeScript
- Yup
  - Schema validation
  - Integrates with React Hook Form
#### Data Visualization
- Recharts
  - React-specific charting library
  - Responsive charts
  - Good performance
  - Customizable components
#### File Handling
- React Dropzone
  - Drag-and-drop file uploads
  - File validation
  - Progress tracking
#### Additional Libraries
- Axios - HTTP client with interceptors
- React Router v6 - Client-side routing
- date-fns - Date manipulation
- React Query - Server state management (alternative to RTK Query)
- React DnD - Drag and drop for survey builder

### Backend
#### Core Framework
- Node.js with Express.js
  - Fast and scalable
  - Large ecosystem
  - JavaScript/TypeScript consistency with frontend
  - Good for real-time features
#### Language
- TypeScript
  - Type safety
  - Better IDE support
  - Easier refactoring
  - Self-documenting code
#### Authentication & Authorization
- Passport.js
  - Flexible authentication middleware
  - Multiple strategy support
  - Session management
- JWT (jsonwebtoken)
  - Stateless authentication
  - Secure token generation
- bcrypt
  - Password hashing
  - Industry standard security
#### API Design
- RESTful API
  - Standard HTTP methods
  - Resource-based URLs
  - Stateless communication
- Express Validator
  - Request validation
  - Sanitization
  - Custom validators
#### File Processing
- Multer
  - Multipart form data handling
  - File upload middleware
  - Size and type restrictions
  - Memory storage for database saving
- pdf-parse
  - PDF text extraction from buffer
  - Resume parsing capability
  - Works with binary data from database
- mammoth
  - DOCX to HTML conversion
  - Resume parsing for Word documents
  - Buffer input support
#### Email Service
- Nodemailer
  - Email sending
  - Template support
  - Multiple transport options
- SendGrid (Alternative)
  - Reliability, developer experience
  - Analytics and tracking
  - Template management
#### Background Jobs
- Bull
  - Redis-based queue
  - Job scheduling
  - Retry mechanisms
  - Progress tracking
#### Security Middleware
- Helmet.js
  - Security headers
  - XSS protection
  - Content Security Policy
- express-rate-limit
  - API rate limiting
  - DDoS protection
- cors
  - Cross-origin resource sharing
  - Configurable origins

### Database
#### Primary Database
- MariaDB 10.11+
  - MySQL-compatible with enhanced features
  - ACID compliance
  - JSON data type support
  - Full-text search capabilities
  - Better performance than MySQL
  - Active open-source development
#### ORM/Query Builder
- Prisma
  - Type-safe database access
  - Auto-generated TypeScript types
  - Migration management
  - Full MariaDB support
  - Great developer experience
- TypeORM (Alternative)
  - Native MariaDB support
  - Active Record and Data Mapper patterns
  - Better for complex queries
#### File Storage Strategy
- Database Binary Storage
  - Files stored as BLOB/LONGBLOB in MariaDB
  - Simplified backup (single database backup)
  - Atomic transactions for file + metadata
  - No external dependencies
  - Suitable for files up to 10MB (per requirements)
#### Database Schema for Files
```sql
CREATE TABLE uploaded_files (
  id INT PRIMARY KEY AUTO_INCREMENT,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_size INT NOT NULL,
  file_data LONGBLOB NOT NULL,
  upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_id INT NOT NULL,
  file_hash VARCHAR(64) NOT NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_file_hash (file_hash)
);
```
#### Caching
- Redis
  - Session storage
  - API response caching
  - Job queue backend
  - Real-time features support
  - File metadata caching (not file content)

### Infrastructure & DevOps
#### Hosting
- AWS EC2 or DigitalOcean Droplets
  - Scalable compute resources
  - Load balancing options
  - Auto-scaling capabilities
#### Container Orchestration
- Docker
  - Consistent development environment
  - Easy deployment
  - Microservices ready
- Docker Compose
  - Local development setup
  - Multi-container applications
#### CI/CD
- GitHub Actions
  - Integrated with repository
  - Automated testing
  - Deployment pipelines
  - Environment secrets management
#### Monitoring & Logging
- PM2
  - Process management
  - Clustering
  - Log management
  - Auto-restart
- Winston
  - Structured logging
  - Multiple transport options
  - Log levels
- Sentry
  - Error tracking
  - Performance monitoring
  - Release tracking
#### Analytics
- Google Analytics 4
  - User behavior tracking
  - Custom events
  - Privacy-compliant
- Mixpanel (Alternative)
  - Advanced user analytics
  - Funnel analysis
  - A/B testing support

### Development Tools
#### Version Control
- Git with GitHub
  - Source code management
  - Collaboration features
  - Issue tracking
  - Project management
#### Code Quality
- ESLint
  - Code linting
  - Consistent code style
  - Bug prevention
- Prettier
  - Code formatting
  - Team consistency
- Husky
  - Git hooks
  - Pre-commit validation
  - Automated checks
#### Testing
- Jest
  - Unit testing
  - Integration testing
  - Coverage reports
- React Testing Library
  - Component testing
  - User-centric tests
- Cypress
  - End-to-end testing
  - Visual regression testing
  - API testing
- Supertest
  - API endpoint testing
  - Integration with Jest
#### Documentation
- Swagger/OpenAPI
  - API documentation
  - Interactive API explorer
  - Client code generation
- JSDoc
  - Code documentation
  - TypeScript support
  - Auto-generated docs

### Security & Compliance
#### Security Scanning
- npm audit
  - Dependency vulnerability scanning
  - Automated fixes
- OWASP ZAP
  - Security testing
  - Vulnerability detection
- SonarQube
  - Code quality analysis
  - Security hotspot detection
#### SSL/TLS
- Let's Encrypt with Certbot
  - Free SSL certificates
  - Auto-renewal
  - HTTPS enforcement
#### Compliance Tools
- FERPA Compliance Checklist
  - Educational records privacy
  - Access controls
  - Audit logging

### Performance Optimization
#### Frontend
- Webpack 5
  - Module bundling
  - Code splitting
  - Tree shaking
  - Asset optimization
- React.lazy
  - Dynamic imports
  - Route-based code splitting
#### Backend
- Node.js Cluster
  - Multi-core utilization
  - Load distribution
- Compression middleware
  - Gzip/Brotli compression
  - Reduced bandwidth
#### CDN
- Cloudflare or AWS CloudFront
  - Global content delivery
  - DDoS protection
  - Edge caching
  - SSL termination

### Development Environment
#### IDE
- Visual Studio Code
  - TypeScript support
  - Debugging tools
  - Extension ecosystem
  - Git integration
#### Package Management
- npm or yarn
  - Dependency management
  - Script running
  - Workspaces support
#### Environment Management
- dotenv
  - Environment variables
  - Configuration management
  - Secrets handling

### Database Schema Management
#### Migration Tools
- Prisma
  - Version-controlled schema
  - Rollback support
  - Auto-generated SQL
  - MariaDB-specific optimizations
#### Backup Solutions
- mysqldump with cron
  - Automated backups
  - Point-in-time recovery
  - Includes binary file data
- MariaDB Binary Backup
  - Mariabackup tool
  - Hot backups without locking
  - Incremental backup support
- AWS RDS for MariaDB (Managed alternative)
  - Automated backups
  - Multi-AZ deployment

### Real-time Features (Future Enhancement)
#### WebSocket Support
- Socket.io
  - Real-time bidirectional communication
  - Auto-reconnection
  - Room support for classes

### Mobile Considerations (Future Enhancement)
#### Progressive Web App
- Workbox
  - Service worker management
  - Offline support
  - Push notifications
#### React Native (Future)
- Cross-platform mobile development
- Code sharing with web
- Native performance

## Recommended Development Workflow
- Local Development: Docker Compose with hot-reloading
- Version Control: Feature branches with PR reviews
- Testing: Unit tests → Integration tests → E2E tests
- Staging: Deploy to staging environment
- Production: Blue-green deployment with rollback capability

## Cost Considerations
### Essential Services (Monthly Estimate)
- Hosting: $50-200 (depending on scale)
- Database: $20-100 (managed service, includes file storage)
- Email Service: $0-50 (based on volume)
- Monitoring: $0-50 (basic tier)

### Optional Services
- CDN: $0-20 (Cloudflare free tier available)
- Advanced Analytics: $0-100
- Premium Support: Variable

## Scalability Path
- Phase 1: Single server deployment
- Phase 2: Separate database server
- Phase 3: Load-balanced application servers
- Phase 4: Microservices architecture
- Phase 5: Kubernetes orchestration

## Technology Decision Matrix
| Requirement         | Technology Choice | Alternative       | Justification                               |
|---------------------|-------------------|-------------------|---------------------------------------------|
| Frontend Framework  | React             | Vue.js, Angular   | Large ecosystem, team familiarity           |
| Backend Framework   | Express.js        | Fastify, Koa      | Mature, extensive middleware                |
| Database            | MariaDB           | MySQL, PostgreSQL | MySQL compatibility, better performance, active development |
| File Storage        | Database BLOB     | AWS S3, MinIO     | Simplified architecture, atomic transactions, single backup |
| Authentication      | JWT + Passport    | Auth0, Firebase Auth | Flexibility, cost-effective                 |
| Email Service       | SendGrid          | AWS SES, Mailgun  | Reliability, developer experience           |
| Monitoring          | Sentry + PM2      | New Relic, DataDog | Cost-effective, sufficient features         |

## File Storage Implementation Details
### Advantages of Database File Storage
- Simplified Architecture: No need for separate file storage service
- Atomic Transactions: File upload and metadata stored in single transaction
- Backup Simplicity: Single database backup includes all files
- Security: Database-level access control for files
- Cost Effective: No additional storage service costs

### Implementation Considerations
- File Size Limits: 10MB limit per requirements fits well within LONGBLOB (4GB max)
- Performance: Use streaming for file downloads to minimize memory usage
- Caching Strategy: Cache file metadata but not file content in Redis
- Database Tuning: Adjust max_allowed_packet for large files
- Separate Tables: Consider separate tables for file metadata vs. content

### Sample File Handling Code
```javascript
// Upload endpoint
app.post('/upload', multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
}).single('file'), async (req, res) => {
  const fileData = req.file.buffer;
  const fileHash = crypto.createHash('sha256').update(fileData).digest('hex');
  
  await prisma.uploadedFiles.create({
    data: {
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      fileData: fileData,
      fileHash: fileHash,
      userId: req.user.id
    }
  });
});

// Download endpoint with streaming
app.get('/download/:id', async (req, res) => {
  const file = await prisma.uploadedFiles.findUnique({
    where: { id: parseInt(req.params.id) },
    select: { fileName: true, fileType: true, fileData: true }
  });
  
  res.setHeader('Content-Type', file.fileType);
  res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
  res.send(file.fileData);
});
```

### Notes
- All technology choices prioritize developer experience, scalability, and security
- Open-source alternatives are preferred where possible to reduce costs
- The stack is designed to be cloud-agnostic for flexibility
- Future enhancements can be added without major architectural changes
- Database file storage chosen for simplicity and atomic operations
- MariaDB chosen for MySQL compatibility with better performance


