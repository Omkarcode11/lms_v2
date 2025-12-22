import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import connectDB from '@/lib/db/connection';
import Progress from '@/lib/db/models/Progress';
import Enrollment from '@/lib/db/models/Enrollment';
import Course from '@/lib/db/models/Course';
import Module from '@/lib/db/models/Module';
import Lesson from '@/lib/db/models/Lesson';
import { z } from 'zod';

// GET /api/progress?courseId=:id - Get course progress with all lessons
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    if (!req.url) {
      return NextResponse.json(
        { error: 'Invalid request URL' },
        { status: 400 }
      );
    }
    
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');
    
    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }
    
    await connectDB();
    
    // Check if user is enrolled
    const enrollment = await Enrollment.findOne({
      userId: token.id,
      courseId: courseId,
    }).lean();
    
    if (!enrollment) {
      return NextResponse.json(
        { error: 'Not enrolled in this course' },
        { status: 403 }
      );
    }
    
    // Get course with modules
    const course = await Course.findById(courseId)
      .populate('instructorId', 'name email avatar')
      .lean();
    
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }
    
    // Get all modules for the course
    const modules = await Module.find({ courseId: courseId })
      .sort({ order: 1 })
      .lean();
    
    // Get all lessons for all modules
    const moduleIds = modules.map(m => m._id);
    const lessons = await Lesson.find({ moduleId: { $in: moduleIds } })
      .sort({ order: 1 })
      .lean();
    
    // Get all progress records for this user and these lessons
    const lessonIds = lessons.map(l => l._id);
    const progressRecords = await Progress.find({
      userId: token.id,
      lessonId: { $in: lessonIds },
    }).lean();
    
    // Create a map of lessonId -> completed status
    const progressMap = new Map();
    progressRecords.forEach(p => {
      progressMap.set(p.lessonId.toString(), p.completed);
    });
    
    // Organize lessons by module and add completion status
    const modulesWithLessons = modules.map(module => {
      const moduleLessons = lessons
        .filter(lesson => lesson.moduleId.toString() === module._id.toString())
        .map(lesson => ({
          id: lesson._id.toString(),
          title: lesson.title,
          description: lesson.description,
          type: lesson.type,
          content: lesson.content,
          duration: lesson.duration,
          order: lesson.order,
          completed: progressMap.get(lesson._id.toString()) || false,
        }));
      
      const completedCount = moduleLessons.filter(l => l.completed).length;
      const totalCount = moduleLessons.length;
      const progressPercentage = totalCount > 0 
        ? Math.round((completedCount / totalCount) * 100)
        : 0;
      
      return {
        id: module._id.toString(),
        title: module.title,
        description: module.description,
        order: module.order,
        lessons: moduleLessons,
        completedCount,
        totalCount,
        progressPercentage,
      };
    });
    
    // Calculate overall course progress
    const totalLessons = lessons.length;
    const completedLessons = progressRecords.filter(p => p.completed).length;
    const courseProgress = totalLessons > 0
      ? Math.round((completedLessons / totalLessons) * 100)
      : 0;
    
    // Update enrollment progress
    await Enrollment.findByIdAndUpdate(enrollment._id, {
      progress: courseProgress,
      status: courseProgress === 100 ? 'COMPLETED' : 'ACTIVE',
      ...(courseProgress === 100 && !enrollment.completedAt ? { completedAt: new Date() } : {}),
    });
    
    return NextResponse.json({
      course: {
        id: course._id.toString(),
        title: course.title,
        description: course.description,
        instructor: course.instructorId,
      },
      enrollment: {
        id: enrollment._id.toString(),
        status: enrollment.status,
        progress: courseProgress,
        enrolledAt: enrollment.enrolledAt,
      },
      modules: modulesWithLessons,
      totalLessons,
      completedLessons,
      courseProgress,
    });
  } catch (error) {
    console.error('Get progress error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/progress - Mark lesson as complete/incomplete
const progressSchema = z.object({
  lessonId: z.string().min(1, 'Lesson ID is required'),
  completed: z.boolean(),
});

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await req.json();
    const validatedData = progressSchema.parse(body);
    
    await connectDB();
    
    // Verify lesson exists
    const lesson = await Lesson.findById(validatedData.lessonId);
    if (!lesson) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      );
    }
    
    // Check if user is enrolled in the course
    const lessonModule = await Module.findById(lesson.moduleId);
    if (!lessonModule) {
      return NextResponse.json(
        { error: 'Module not found' },
        { status: 404 }
      );
    }
    
    const enrollment = await Enrollment.findOne({
      userId: token.id,
      courseId: lessonModule.courseId,
    });
    
    if (!enrollment) {
      return NextResponse.json(
        { error: 'Not enrolled in this course' },
        { status: 403 }
      );
    }
    
    // Update or create progress record
    const progress = await Progress.findOneAndUpdate(
      {
        userId: token.id,
        lessonId: validatedData.lessonId,
      },
      {
        userId: token.id,
        lessonId: validatedData.lessonId,
        completed: validatedData.completed,
      },
      {
        upsert: true,
        new: true,
      }
    );
    
    // Recalculate course progress
    const courseModules = await Module.find({ courseId: lessonModule.courseId }).select('_id');
    const courseModuleIds = courseModules.map(m => m._id);
    const courseLessons = await Lesson.find({ moduleId: { $in: courseModuleIds } }).select('_id');
    const courseLessonIds = courseLessons.map(l => l._id);
    
    const completedCount = await Progress.countDocuments({
      userId: token.id,
      lessonId: { $in: courseLessonIds },
      completed: true,
    });
    
    const totalLessons = courseLessons.length;
    const courseProgress = totalLessons > 0
      ? Math.round((completedCount / totalLessons) * 100)
      : 0;
    
    // Update enrollment progress
    await Enrollment.findByIdAndUpdate(enrollment._id, {
      progress: courseProgress,
      status: courseProgress === 100 ? 'COMPLETED' : 'ACTIVE',
      ...(courseProgress === 100 && !enrollment.completedAt ? { completedAt: new Date() } : {}),
    });
    
    return NextResponse.json({
      success: true,
      progress: {
        id: progress._id.toString(),
        lessonId: progress.lessonId.toString(),
        completed: progress.completed,
      },
      courseProgress,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Update progress error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

