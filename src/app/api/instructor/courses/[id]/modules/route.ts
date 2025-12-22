import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { z } from 'zod';
import connectDB from '@/lib/db/connection';
import Course from '@/lib/db/models/Course';
import Module from '@/lib/db/models/Module';
import Lesson from '@/lib/db/models/Lesson';

const moduleSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  order: z.number().min(0),
});

// GET /api/instructor/courses/[id]/modules - Get all modules with lessons
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
    
    // Check ownership
    if (course.instructorId.toString() !== token.id && token.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    const modules = await Module.find({ courseId: id })
      .sort({ order: 1 })
      .lean();
    
    // Get lessons for each module
    const modulesWithLessons = await Promise.all(
      modules.map(async (moduleItem) => {
        const lessons = await Lesson.find({ moduleId: moduleItem._id })
          .sort({ order: 1 })
          .lean();
        
        return {
          ...moduleItem,
          lessons,
        };
      })
    );
    
    return NextResponse.json({ modules: modulesWithLessons });
  } catch (error) {
    console.error('Get modules error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/instructor/courses/[id]/modules - Create a module
export async function POST(
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
    
    const body = await req.json();
    const validatedData = moduleSchema.parse(body);
    
    await connectDB();
    
    const { id } = await params;
    const course = await Course.findById(id);
    
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }
    
    // Check ownership
    if (course.instructorId.toString() !== token.id && token.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    const newModule = await Module.create({
      ...validatedData,
      courseId: id,
    });
    
    return NextResponse.json(
      { message: 'Module created successfully', module: newModule },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Create module error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

