import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { z } from 'zod';
import connectDB from '@/lib/db/connection';
import Course from '@/lib/db/models/Course';
import Module from '@/lib/db/models/Module';
import Lesson, { ContentType } from '@/lib/db/models/Lesson';

const updateLessonSchema = z.object({
  title: z.string().min(3).max(100).optional(),
  description: z.string().max(1000).optional(),
  type: z.enum(Object.values(ContentType) as [string, ...string[]]).optional(),
  content: z.string().min(1).optional(),
  duration: z.number().min(0).optional(),
  order: z.number().min(0).optional(),
  isFree: z.boolean().optional(),
});

// PUT /api/instructor/courses/[id]/modules/[moduleId]/lessons/[lessonId] - Update a lesson
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string; lessonId: string }> }
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
    const validatedData = updateLessonSchema.parse(body);
    
    await connectDB();
    
    const { id, moduleId, lessonId } = await params;
    
    // Verify lesson exists and belongs to module
    const lesson = await Lesson.findById(lessonId);
    
    if (!lesson || lesson.moduleId.toString() !== moduleId) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      );
    }
    
    // Verify module belongs to course
    const module = await Module.findById(moduleId);
    
    if (!module || module.courseId.toString() !== id) {
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
    
    // Update lesson
    Object.assign(lesson, validatedData);
    await lesson.save();
    
    return NextResponse.json({
      message: 'Lesson updated successfully',
      lesson,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Update lesson error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/instructor/courses/[id]/modules/[moduleId]/lessons/[lessonId] - Delete a lesson
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string; lessonId: string }> }
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
    
    const { id, moduleId, lessonId } = await params;
    
    // Verify lesson exists and belongs to module
    const lesson = await Lesson.findById(lessonId);
    
    if (!lesson || lesson.moduleId.toString() !== moduleId) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      );
    }
    
    // Verify module belongs to course
    const module = await Module.findById(moduleId);
    
    if (!module || module.courseId.toString() !== id) {
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
    
    // Delete the lesson
    await lesson.deleteOne();
    
    return NextResponse.json({
      message: 'Lesson deleted successfully',
    });
  } catch (error) {
    console.error('Delete lesson error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

