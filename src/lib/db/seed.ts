import bcrypt from 'bcryptjs';
import connectDB from './connection';
import User, { UserRole } from './models/User';
import Course from './models/Course';
import Module from './models/Module';
import Lesson from './models/Lesson';
import Enrollment from './models/Enrollment';
import Progress from './models/Progress';
import Review from './models/Review';
import Payment from './models/Payment';

async function seed() {
  try {
    console.log('🌱 Starting database seed...');
    
    await connectDB();
    
    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Course.deleteMany({});
    await Module.deleteMany({});
    await Lesson.deleteMany({});
    await Enrollment.deleteMany({});
    await Progress.deleteMany({});
    await Review.deleteMany({});
    await Payment.deleteMany({});
    
    // Create users
    console.log('Creating users...');
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const admin = await User.create({
      email: 'admin@eduflow.com',
      name: 'Admin User',
      password: hashedPassword,
      role: UserRole.ADMIN,
    });
    
    const instructor = await User.create({
      email: 'instructor@eduflow.com',
      name: 'John Instructor',
      password: hashedPassword,
      role: UserRole.INSTRUCTOR,
      bio: 'Experienced educator with 10+ years of teaching',
    });
    
    const student = await User.create({
      email: 'student@eduflow.com',
      name: 'Jane Student',
      password: hashedPassword,
      role: UserRole.STUDENT,
    });
    
    console.log('✅ Users created');
    console.log('✅ Database seeded successfully!');
    console.log('\nTest accounts:');
    console.log('Admin: admin@eduflow.com / password123');
    console.log('Instructor: instructor@eduflow.com / password123');
    console.log('Student: student@eduflow.com / password123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seed();

