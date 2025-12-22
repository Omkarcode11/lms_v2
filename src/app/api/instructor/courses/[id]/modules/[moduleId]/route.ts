import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { z } from 'zod';
import connectDB from '@/lib/db/connection';
import Course from '@/lib/db/models/Course';
import Module from '@/lib/db/models/Module';
import Lesson from '@/lib/db/models/Lesson';

const updateModuleSchema = z.object({
  title: z.string().min(3).max(100).optional(),
  description: z.string().max(500).optional(),
  order: z.number().min(0).optional(),
});

// PUT /api/instructor/courses/[id]/modules/[moduleId] - Update a module
export async function PUT(
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
    const validatedData = updateModuleSchema.parse(body);
    
    await connectDB();
    
    const { id, moduleId } = await params;
    
    // Verify module exists and belongs to course
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
    
    // Update module
    Object.assign(module, validatedData);
    await module.save();
    
    return NextResponse.json({
      message: 'Module updated successfully',
      module,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Update module error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/instructor/courses/[id]/modules/[moduleId] - Delete a module
export async function DELETE(
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
    
    await connectDB();
    
    const { id, moduleId } = await params;
    
    // Verify module exists and belongs to course
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
    
    // Delete all lessons in this module first
    await Lesson.deleteMany({ moduleId: moduleId });
    
    // Delete the module
    await module.deleteOne();
    
    return NextResponse.json({
      message: 'Module and all its lessons deleted successfully',
    });
  } catch (error) {
    console.error('Delete module error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

