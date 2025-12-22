import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { z } from 'zod';
import connectDB from '@/lib/db/connection';
import Course from '@/lib/db/models/Course';
import Module from '@/lib/db/models/Module';
import Lesson, { ContentType } from '@/lib/db/models/Lesson';

const lessonSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().max(1000).optional(),
  type: z.enum(Object.values(ContentType) as [string, ...string[]]),
  content: z.string().min(1),
  duration: z.number().min(0).optional(),
  order: z.number().min(0),
  isFree: z.boolean().default(false),
});

// POST /api/instructor/courses/[id]/modules/[moduleId]/lessons - Create a lesson
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
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
    const validatedData = lessonSchema.parse(body);
    
    await connectDB();
    
    const { id, moduleId } = await params;
    
    // Verify module exists and belongs to course
    const moduleDoc = await Module.findById(moduleId);
    
    if (!moduleDoc || moduleDoc.courseId.toString() !== id) {
      return NextResponse.json(
        { error: 'Module not found' },
        { status: 404 }
      );
    }
    
    // Verify course ownership
    const course = await Course.findById(id);
    
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }
    
    if (course.instructorId.toString() !== token.id && token.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    const lesson = await Lesson.create({
      ...validatedData,
      moduleId: moduleId,
    });
    
    return NextResponse.json(
      { message: 'Lesson created successfully', lesson },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Create lesson error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

