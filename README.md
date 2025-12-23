# 🎓 EduFlow LMS - Modern Learning Management System
<p align="center">
  <strong>A production-ready, AI-powered Learning Management System built with Next.js 16, MongoDB, and modern web technologies</strong>
</p>

<p align="center">
  <a href="https://lmsv2-lovat.vercel.app/" target="_blank">🌐 Live Demo</a> •
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#deployment">Deployment</a> •
  <a href="#testing">Testing</a>
</p>

---

## 🌟 Features

### Core Functionality
- ✅ **Complete CRUD Operations** - Create, Read, Update, Delete for courses, users, and enrollments
- 🔐 **Secure Authentication** - JWT-based authentication with NextAuth.js
- 🎯 **Role-Based Access Control** - Admin, Instructor, and Student roles with granular permissions
- 📚 **Rich Course Management** - Modules, lessons, videos, articles, quizzes, and assignments
- 📊 **Progress Tracking** - Real-time course progress and completion tracking
- 🏆 **Certifications** - Automated certificate generation upon course completion

### Advanced Features
- 🤖 **AI-Powered** - Smart course recommendations and AI-generated content suggestions
- 🔍 **Advanced Search & Filtering** - Search courses by category, level, and keywords
- 💳 **Enrollment Management** - Track student enrollments and course analytics
- 📱 **Responsive Design** - Mobile-first approach with beautiful UI using Tailwind CSS
- ⚡ **Optimized Performance** - Server-side rendering, code splitting, and caching
- 🛡️ **Security First** - Input sanitization, rate limiting, CSRF protection

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router and Server Components
- **React 19** - Latest React with improved performance
- **TypeScript** - Type-safe code for better development experience
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Beautiful, accessible component library
- **Radix UI** - Unstyled, accessible UI primitives
- **TanStack Query** - Powerful data synchronization
- **Lucide React** - Beautiful & consistent icons

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **MongoDB** - NoSQL database for flexible data storage
- **Mongoose** - Elegant MongoDB object modeling
- **NextAuth.js** - Complete authentication solution
- **Zod** - TypeScript-first schema validation
- **bcryptjs** - Secure password hashing

### AI & ML
- **AI SDK** - Vercel's AI toolkit
- **OpenAI API** - GPT-powered content generation and recommendations
- (Alternative: Groq API for free tier)

### DevOps & Tools
- **Docker** - Containerization for consistent environments
- **Docker Compose** - Multi-container orchestration
- **GitHub Actions** - CI/CD pipelines
- **Jest** - Unit and integration testing
- **Playwright** - End-to-end testing
- **ESLint** - Code linting
- **Husky** - Git hooks

## 🚀 Getting Started

### Prerequisites
- Node.js 20+ and npm
- MongoDB (local or MongoDB Atlas)
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/eduflow-lms.git
cd eduflow-lms
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` and configure:
```env
# Database
DATABASE_URL="mongodb://localhost:27017/eduflow_lms"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# AI (Optional)
OPENAI_API_KEY="your-openai-api-key"
```

Generate a secret key:
```bash
openssl rand -base64 32
```

4. **Start MongoDB** (if running locally)
```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:7.0

# Or use existing MongoDB installation
```

5. **Seed the database** (optional)
```bash
npm run db:seed
```

This creates test accounts:
- **Admin**: admin@eduflow.com / password123
- **Instructor**: instructor@eduflow.com / password123
- **Student**: student@eduflow.com / password123

6. **Run the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)

1. **Start all services**
```bash
docker-compose up -d
```

This starts:
- MongoDB database on port 27017
- Next.js application on port 3000

2. **View logs**
```bash
docker-compose logs -f
```

3. **Stop services**
```bash
docker-compose down
```

### Manual Docker Build

```bash
# Build image
docker build -t eduflow-lms .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL="your-mongodb-url" \
  -e NEXTAUTH_SECRET="your-secret" \
  eduflow-lms
```

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### Watch Mode
```bash
npm run test:watch
```

### E2E Tests
```bash
npm run test:e2e
```

### Coverage Report
```bash
npm test -- --coverage
```

## 📦 Building for Production

```bash
npm run build
npm start
```

## 🌐 Deployment

### Live Application

🌐 **Live Demo**: [https://lmsv2-lovat.vercel.app/](https://lmsv2-lovat.vercel.app/)

### Vercel (Recommended)

1. **Install Vercel CLI**
```bash
npm i -g vercel
```

2. **Deploy**
```bash
vercel
```

3. **Set environment variables in Vercel Dashboard**
- `DATABASE_URL` - Your MongoDB connection string
- `NEXTAUTH_SECRET` - Your secret key
- `NEXTAUTH_URL` - Your production URL
- `OPENAI_API_KEY` - (Optional) Your OpenAI API key

### Manual Deployment

1. Build the application:
```bash
npm run build
```

2. Deploy the `.next` folder to your hosting provider

3. Ensure environment variables are set

## 🔧 Configuration

### GitHub Secrets (for CI/CD)

Set these secrets in your GitHub repository:
- `DOCKER_USERNAME` - Docker Hub username
- `DOCKER_PASSWORD` - Docker Hub password
- `VERCEL_TOKEN` - Vercel deployment token

## 📚 API Documentation

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/signin` - Sign in user
- `POST /api/auth/signout` - Sign out user

### Courses
- `GET /api/courses` - List all published courses
- `GET /api/courses/:id` - Get course details
- `POST /api/courses` - Create course (Instructor/Admin)
- `PUT /api/courses/:id` - Update course
- `DELETE /api/courses/:id` - Delete course

### Enrollments
- `GET /api/enrollments` - Get user enrollments
- `POST /api/enrollments` - Enroll in course

### Users
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update user profile
- `DELETE /api/users/:id` - Delete user (Admin)

### AI Features
- `GET /api/ai/recommendations` - Get personalized course recommendations
- `POST /api/ai/generate/description` - Generate course description

## 🔒 Security Features

- ✅ JWT-based authentication
- ✅ Password hashing with bcrypt
- ✅ Input validation with Zod
- ✅ SQL/NoSQL injection prevention
- ✅ XSS protection
- ✅ CSRF protection
- ✅ Rate limiting
- ✅ Secure headers
- ✅ Role-based access control

## 📊 Project Structure

```
eduflow-lms/
├── .github/
│   └── workflows/         # GitHub Actions CI/CD
├── e2e/                   # Playwright E2E tests
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── api/          # API routes
│   │   ├── auth/         # Authentication pages
│   │   └── globals.css   # Global styles
│   ├── components/       # React components
│   │   └── ui/          # UI components (shadcn)
│   └── lib/             # Utilities and libraries
│       ├── db/          # Database models and connection
│       ├── ai/          # AI features
│       └── security/    # Security utilities
├── docker-compose.yml   # Docker Compose configuration
├── Dockerfile          # Docker configuration
└── package.json        # Dependencies and scripts
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👤 Author

**Your Name**
- GitHub: [@yourusername](https://github.com/yourusername)
- LinkedIn: [Your Profile](https://linkedin.com/in/yourprofile)

---

<p align="center">
  Built with ❤️ for House of Edtech Assignment 2025
</p>

<p align="center">
  <strong>Tech Stack:</strong> Next.js 16 • React 19 • TypeScript • MongoDB • Tailwind CSS • Docker • AI
</p>

