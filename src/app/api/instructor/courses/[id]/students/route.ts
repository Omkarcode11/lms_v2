import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import connectDB from '@/lib/db/connection';
import Course from '@/lib/db/models/Course';
import Enrollment from '@/lib/db/models/Enrollment';
import Progress from '@/lib/db/models/Progress';
import Module from '@/lib/db/models/Module';
import Lesson from '@/lib/db/models/Lesson';

// GET /api/instructor/courses/[id]/students - Get enrolled students with progress
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token || (token.role !== 'INSTRUCTOR' && token.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    await connectDB();
    
    const { id } = await params;
    const course = await Course.findById(id);
    
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }
    
    // Check if instructor owns the course
    if (course.instructorId.toString() !== token.id && token.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Get all enrollments for this course with user details
    const enrollments = await Enrollment.find({ courseId: id })
      .populate('userId', 'name email avatar')
      .sort({ enrolledAt: -1 })
      .lean();
    
    // Get total lessons count for the course
    const modules = await Module.find({ courseId: id }).select('_id');
    const moduleIds = modules.map(m => m._id);
    const totalLessons = await Lesson.countDocuments({ moduleId: { $in: moduleIds } });
    
    // Get progress for each enrollment
    const studentsWithProgress = await Promise.all(
      enrollments.map(async (enrollment) => {
        const completedLessons = await Progress.countDocuments({
          userId: enrollment.userId._id,
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
    
    return NextResponse.json({ students: studentsWithProgress });
  } catch (error) {
    console.error('Get course students error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

