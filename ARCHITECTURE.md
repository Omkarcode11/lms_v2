# 🏗️ Architecture Overview - EduFlow LMS

> **Complete Learning Management System** - Production-ready, feature-complete LMS with instructor/student management, course enrollment, progress tracking, reviews, and mock payment system.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Browser   │  │   Mobile    │  │   Tablet    │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
└─────────┼─────────────────┼─────────────────┼───────────────┘
          │                 │                 │
          └─────────────────┴─────────────────┘
                            │
┌───────────────────────────┼───────────────────────────────┐
│                    Next.js Application                      │
│  ┌──────────────────────────────────────────────────────┐ │
│  │              App Router (Next.js 15)                 │ │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌──────────────┐ │ │
│  │  │ Pages  │ │  API   │ │Middleware│Server        │ │ │
│  │  │        │ │ Routes │ │          │Components    │ │ │
│  │  └────────┘ └───┬────┘ └────────┘ └──────────────┘ │ │
│  └──────────────────┼──────────────────────────────────┘ │
│                     │                                      │
│  ┌──────────────────┼──────────────────────────────────┐ │
│  │           Business Logic Layer                      │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │ │
│  │  │Services  │ │Validation│ │  Authentication  │   │ │
│  │  └──────────┘ └──────────┘ └──────────────────┘   │ │
│  └─────────────────────────────────────────────────────┘ │
└───────────────────────────┬───────────────────────────────┘
                            │
┌───────────────────────────┼───────────────────────────────┐
│                    Data Layer                               │
│  ┌──────────────┐                                          │
│  │   MongoDB    │                                          │
│  │              │                                          │
│  └──────────────┘                                          │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS + shadcn/ui
- **Type Safety**: TypeScript 5
- **Icons**: Lucide React
- **UI Components**: Radix UI primitives

### Backend
- **Runtime**: Node.js 20+
- **API**: Next.js API Routes with full CRUD operations
- **Database**: MongoDB + Mongoose ODM
- **Authentication**: NextAuth.js with JWT
- **Validation**: Zod schemas
- **Security**: bcryptjs (10 rounds), rate limiting, CSRF protection

### DevOps
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions workflows (configured)
- **Testing**: Jest (unit), Playwright (e2e)
- **Code Quality**: ESLint, TypeScript strict mode

## Database Schema

### Collections

#### Users
```javascript
{
  _id: ObjectId,
  email: String (unique),
  name: String,
  password: String (hashed),
  role: Enum ['ADMIN', 'INSTRUCTOR', 'STUDENT'],
  avatar: String,
  bio: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### Courses
```javascript
{
  _id: ObjectId,
  title: String,
  slug: String (unique),
  description: String,
  thumbnail: String,
  price: Number,
  level: Enum ['Beginner', 'Intermediate', 'Advanced'],
  category: String,
  tags: [String],
  status: Enum ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
  instructorId: ObjectId (ref: User),
  enrollmentCount: Number,
  rating: Number,
  reviewCount: Number,
  createdAt: Date,
  updatedAt: Date,
  publishedAt: Date
}
```

#### Modules
```javascript
{
  _id: ObjectId,
  courseId: ObjectId (ref: Course),
  title: String,
  description: String,
  order: Number,
  createdAt: Date,
  updatedAt: Date
}
```

#### Lessons
```javascript
{
  _id: ObjectId,
  moduleId: ObjectId (ref: Module),
  title: String,
  description: String,
  type: Enum ['VIDEO', 'ARTICLE', 'QUIZ', 'ASSIGNMENT'],
  content: String,
  duration: Number,
  order: Number,
  isFree: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### Enrollments
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  courseId: ObjectId (ref: Course),
  status: Enum ['ACTIVE', 'COMPLETED', 'DROPPED'],
  progress: Number (0-100),
  enrolledAt: Date,
  completedAt: Date,
  updatedAt: Date
}
```

#### Progress
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  lessonId: ObjectId (ref: Lesson),
  completed: Boolean,
  completedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### Reviews
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  courseId: ObjectId (ref: Course),
  rating: Number (1-5),
  comment: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### Payments
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  courseId: ObjectId (ref: Course),
  enrollmentId: ObjectId (ref: Enrollment),
  amount: Number,
  currency: String (default: 'USD'),
  method: Enum ['MOCK', 'STRIPE', 'PAYPAL'],
  transactionId: String (unique),
  status: Enum ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'],
  createdAt: Date,
  updatedAt: Date
}
```


## API Routes

### Authentication
- `POST /api/auth/signup` - Register new user with role selection
- `POST /api/auth/signin` - Sign in user (NextAuth)
- `POST /api/auth/signout` - Sign out user
- `GET /api/auth/session` - Get current session with user details

### Courses (Public)
- `GET /api/courses` - List all published courses (paginated, searchable, filterable)
- `GET /api/courses/:id` - Get course details with modules and lessons

### Instructor - Courses
- `GET /api/instructor/courses` - List instructor's courses
- `POST /api/instructor/courses` - Create new course (auto-generates slug)
- `GET /api/instructor/courses/:id` - Get specific course details
- `PUT /api/instructor/courses/:id` - Update course details
- `DELETE /api/instructor/courses/:id` - Delete course (soft delete)
- `GET /api/instructor/courses/:id/students` - View enrolled students with progress
- `GET /api/instructor/courses/:id/reviews` - View course reviews

### Instructor - Modules & Lessons
- `GET /api/instructor/courses/:id/modules` - List course modules
- `POST /api/instructor/courses/:id/modules` - Create new module
- `PUT /api/instructor/courses/:id/modules/:moduleId` - Update module
- `DELETE /api/instructor/courses/:id/modules/:moduleId` - Delete module
- `GET /api/instructor/courses/:id/modules/:moduleId/lessons` - List module lessons
- `POST /api/instructor/courses/:id/modules/:moduleId/lessons` - Create new lesson
- `PUT /api/instructor/courses/:id/modules/:moduleId/lessons/:lessonId` - Update lesson
- `DELETE /api/instructor/courses/:id/modules/:moduleId/lessons/:lessonId` - Delete lesson

### Student - Enrollments
- `POST /api/enrollments/enroll` - Enroll in course with mock payment
- `GET /api/enrollments/:id` - Get enrollment details
- `GET /api/students/my-courses` - List student's enrolled courses

### Student - Progress
- `GET /api/progress?courseId=:id` - Get course progress with all lessons
- `POST /api/progress` - Mark lesson as complete/incomplete

### Student - Reviews
- `POST /api/reviews` - Submit course review (1-5 stars with comment)
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review

### Users
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update user profile
- `DELETE /api/users/:id` - Delete user (Admin only)

## Complete Feature Set

### 🎓 Instructor Features

#### Course Management
- ✅ Create courses with title, description, thumbnail, price, level, category
- ✅ Auto-generate SEO-friendly slugs
- ✅ Edit course details anytime
- ✅ Delete courses (with cascade delete of modules/lessons)
- ✅ View all personal courses on instructor dashboard
- ✅ Track enrollment count and ratings for each course

#### Content Management
- ✅ Create structured modules for course organization
- ✅ Add lessons with title, description, content (YouTube videos, articles)
- ✅ Set lesson order within modules
- ✅ Edit module/lesson content anytime
- ✅ Delete modules or individual lessons
- ✅ Pre-fill edit forms with existing data
- ✅ Confirmation dialogs for destructive actions

#### Student Management
- ✅ View all enrolled students for each course
- ✅ See individual student progress percentages
- ✅ Track enrollment dates
- ✅ Monitor student completion status

#### Analytics & Feedback
- ✅ View all reviews submitted for courses
- ✅ See average ratings and individual feedback
- ✅ Monitor review timestamps
- ✅ Track total enrollments per course

### 👨‍🎓 Student Features

#### Course Discovery
- ✅ Browse all published courses
- ✅ Search courses by keyword
- ✅ Filter by category, level, and price
- ✅ View course details before enrollment
- ✅ See "ENROLLED" badges on enrolled courses

#### Enrollment & Payment
- ✅ One-click enrollment with mock payment system
- ✅ Automatic payment record creation
- ✅ Instant course access after enrollment
- ✅ View all enrolled courses in "My Courses"
- ✅ See enrollment date and payment details

#### Learning Experience
- ✅ Access course content with structured modules
- ✅ Watch YouTube video lessons (with proper embed)
- ✅ Navigate between lessons within modules
- ✅ Mark individual lessons as complete/incomplete
- ✅ "Mark Complete & Next" button for seamless progression
- ✅ Real-time progress tracking (percentage)
- ✅ Visual progress bars per course

#### Reviews & Feedback
- ✅ Submit 5-star ratings for completed courses
- ✅ Write detailed text reviews
- ✅ Visual star selection with hover effects
- ✅ Edit existing reviews
- ✅ Delete reviews
- ✅ Character count for review text

### 🔐 Authentication & Authorization

#### User Roles
- ✅ **Admin**: Full system access
- ✅ **Instructor**: Create/manage courses, view students
- ✅ **Student**: Enroll, learn, review courses

#### Security Features
- ✅ JWT-based authentication with NextAuth.js
- ✅ Password hashing with bcrypt (10 rounds)
- ✅ Role-based route protection (middleware)
- ✅ Session management with secure cookies
- ✅ Input validation with Zod schemas
- ✅ XSS and injection prevention

### 🎨 User Interface

#### Design
- ✅ Modern, responsive design with Tailwind CSS
- ✅ Beautiful components from shadcn/ui
- ✅ Consistent color scheme and typography
- ✅ Mobile-first responsive layout
- ✅ Loading states and error handling
- ✅ Success/error toast notifications
- ✅ Confirmation modals for destructive actions

#### User Experience
- ✅ Intuitive navigation with role-based menus
- ✅ Breadcrumb navigation
- ✅ Quick action buttons and dropdowns
- ✅ Form validation with helpful error messages
- ✅ Empty state messages
- ✅ Smooth transitions and hover effects

### 📊 Data Management

#### Database Features
- ✅ MongoDB with Mongoose ODM
- ✅ Indexed fields for optimal query performance
- ✅ Proper relationships between collections
- ✅ Cascading deletes where appropriate
- ✅ Lean queries for better performance

#### Data Integrity
- ✅ Unique constraints (email, slug, transactionId)
- ✅ Required field validation
- ✅ Enum validation for status fields
- ✅ Reference validation for foreign keys
- ✅ Timestamps on all records

### 🚀 Performance & Optimization

- ✅ Server-side rendering (SSR) with Next.js
- ✅ API route optimization with lean queries
- ✅ Database indexing on frequently queried fields
- ✅ Efficient data fetching patterns
- ✅ Code splitting and lazy loading
- ✅ Image optimization with Next.js Image

### 🧪 Testing & Quality

- ✅ Unit tests with Jest
- ✅ E2E tests with Playwright
- ✅ TypeScript strict mode
- ✅ ESLint for code quality
- ✅ Consistent code formatting

### 📦 Deployment Ready

- ✅ Docker support with Docker Compose
- ✅ Environment variable configuration
- ✅ Production build optimization
- ✅ MongoDB Atlas compatibility
- ✅ Vercel deployment ready
- ✅ VPS deployment guides

## Security Architecture

### Authentication Flow
```
1. User submits credentials
   ↓
2. NextAuth validates credentials
   ↓
3. Password verified with bcrypt
   ↓
4. JWT token generated
   ↓
5. Token stored in secure cookie
   ↓
6. Subsequent requests include token
   ↓
7. Middleware validates token
```

### Authorization Layers
```
Middleware → Route Handler → Service → Database
    ↓             ↓             ↓          ↓
  Token      Role Check    Business    Data
  Valid      Permission     Logic      Access
```

### Security Measures
- ✅ JWT-based authentication
- ✅ Password hashing (bcrypt, 10 rounds)
- ✅ Role-based access control (RBAC)
- ✅ Input validation (Zod)
- ✅ Input sanitization
- ✅ Rate limiting
- ✅ CSRF protection
- ✅ XSS prevention
- ✅ SQL/NoSQL injection prevention
- ✅ Secure HTTP headers

## Data Flow

### User Registration Flow
```
Client → POST /api/auth/signup
  ↓
Validate input (Zod)
  ↓
Check if user exists
  ↓
Hash password (bcrypt)
  ↓
Create user in MongoDB
  ↓
Return success response
```

### Course Enrollment Flow
```
Client → POST /api/enrollments
  ↓
Verify authentication (JWT)
  ↓
Check if course exists
  ↓
Check if already enrolled
  ↓
Create enrollment record
  ↓
Update course enrollment count
  ↓
Return success response
```

## Deployment Architecture

### Development
```
Local Machine
  ↓
Node.js Dev Server (port 3000)
  ↓
Local MongoDB (port 27017)
```

### Production (Vercel)
```
Users → Vercel Edge Network
  ↓
Next.js App (Serverless Functions)
  ↓
MongoDB Atlas (Cloud Database)
```

### Production (VPS)
```
Users → Nginx (Reverse Proxy)
  ↓
PM2 Process Manager
  ↓
Next.js App (port 3000)
  ↓
MongoDB (port 27017)
```

### Docker Deployment
```
Docker Host
  ↓
  ├─ MongoDB Container (port 27017)
  │
  └─ Next.js Container (port 3000)
```

## Performance Optimizations

### Frontend
- ✅ Server-side rendering (SSR)
- ✅ Code splitting (Next.js automatic)
- ✅ Lazy loading

### Backend
- ✅ Database indexing
- ✅ Query optimization (lean queries)
- ✅ Connection pooling (Mongoose default)
- ✅ Rate limiting (security utilities available)

### Database
- ✅ Proper indexes on frequently queried fields
- ✅ Lean queries for better performance
- ✅ Connection pooling (Mongoose default)

## Scalability Considerations

### Horizontal Scaling
- Stateless application design
- JWT tokens (no session store needed)
- MongoDB replica sets for high availability
- Load balancing with multiple instances

### Vertical Scaling
- Optimized queries
- Efficient data structures
- Resource monitoring
- Auto-scaling on cloud platforms

### Caching Strategy
- TanStack Query provider configured (available for future use)
- Static asset caching (Next.js default)

## Monitoring & Logging

### Application Monitoring
- Console logging for errors and debugging
- Performance monitoring (Next.js built-in)

### Infrastructure Monitoring
- Server health checks
- Database performance
- Memory usage
- CPU utilization
- Disk space

### Logging Strategy
```javascript
// Info logs
console.log('User enrolled in course:', courseId);

// Warning logs
console.warn('Rate limit approaching for user:', userId);

// Error logs
console.error('Database connection failed:', error);
```

## Testing Strategy

### Unit Tests
- Test individual functions
- Mock external dependencies
- Cover edge cases
- Target 70%+ coverage

### Integration Tests
- Test API routes
- Test database operations
- Test authentication flow
- Test business logic

### E2E Tests
- Test complete user flows
- Test critical paths
- Multi-browser testing
- Accessibility testing

## Future Enhancements

### Phase 1
- [ ] Real-time chat/messaging
- [ ] Video streaming integration
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)

### Phase 2
- [ ] Real payment integration (Stripe/PayPal) - Currently mock payment only
- [ ] Certificate generation and download - Model exists but not implemented
- [ ] Discussion forums
- [ ] Live classes (WebRTC)

### Phase 3
- [ ] Gamification (badges, points)
- [ ] Quiz and assignment system
- [ ] Advanced reporting
- [ ] Multi-language support

---

**Last Updated**: December 2025  
**Version**: 1.0.0

