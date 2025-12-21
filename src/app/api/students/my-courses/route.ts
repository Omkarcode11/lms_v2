import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import connectDB from '@/lib/db/connection';
import Enrollment from '@/lib/db/models/Enrollment';
import Progress from '@/lib/db/models/Progress';
import Module from '@/lib/db/models/Module';
import Lesson from '@/lib/db/models/Lesson';

// GET /api/students/my-courses - Get student's enrolled courses with progress
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    await connectDB();
    
    const enrollments = await Enrollment.find({ userId: token.id })
      .populate({
        path: 'courseId',
        populate: {
          path: 'instructorId',
          select: 'name email avatar',
        },
      })
      .sort({ enrolledAt: -1 })
      .lean();
    
    // Get progress for each enrollment
    const coursesWithProgress = await Promise.all(
      enrollments.map(async (enrollment) => {
        if (!enrollment.courseId) {
          return null;
        }
        
        const modules = await Module.find({ courseId: enrollment.courseId._id }).select('_id');
        const moduleIds = modules.map(m => m._id);
        const totalLessons = await Lesson.countDocuments({ moduleId: { $in: moduleIds } });
        
        const completedLessons = await Progress.countDocuments({
          userId: token.id,
          lessonId: { $in: await Lesson.find({ moduleId: { $in: moduleIds } }).distinct('_id') },
          completed: true,
        });
        
        const progressPercentage = totalLessons > 0 
          ? Math.round((completedLessons / totalLessons) * 100)
          : 0;
        
        return {
          enrollment,
          completedLessons,
          totalLessons,
          progressPercentage,
        };
      })
    );
    
    // Filter out null values
    const validCourses = coursesWithProgress.filter(c => c !== null);
    
    return NextResponse.json({ courses: validCourses });
  } catch (error) {
    console.error('Get my courses error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

