import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { z } from 'zod';
import connectDB from '@/lib/db/connection';
import Course, { CourseStatus } from '@/lib/db/models/Course';

const updateCourseSchema = z.object({
  title: z.string().min(5).max(100).optional(),
  description: z.string().min(20).max(2000).optional(),
  thumbnail: z.string().url().optional(),
  price: z.number().min(0).optional(),
  level: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional(),
  category: z.string().min(2).optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(Object.values(CourseStatus) as [string, ...string[]]).optional(),
});

// GET /api/instructor/courses/[id] - Get single course details
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
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
    
    const course = await Course.findById(params.id).lean();
    
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
    
    return NextResponse.json({ course });
  } catch (error) {
    console.error('Get course error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/instructor/courses/[id] - Update course
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
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
    const validatedData = updateCourseSchema.parse(body);
    
    await connectDB();
    
    const course = await Course.findById(params.id);
    
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
    
    // Update slug if title changes
    if (validatedData.title && validatedData.title !== course.title) {
      const newSlug = validatedData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      
      // Check if new slug already exists
      const existingCourse = await Course.findOne({ 
        slug: newSlug,
        _id: { $ne: params.id }
      });
      
      if (existingCourse) {
        return NextResponse.json(
          { error: 'A course with a similar title already exists' },
          { status: 400 }
        );
      }
      
      (validatedData as any).slug = newSlug;
    }
    
    // Set publishedAt when status changes to PUBLISHED
    if (validatedData.status === CourseStatus.PUBLISHED && !course.publishedAt) {
      (validatedData as any).publishedAt = new Date();
    }
    
    Object.assign(course, validatedData);
    await course.save();
    
    return NextResponse.json({
      message: 'Course updated successfully',
      course,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Update course error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/instructor/courses/[id] - Delete course
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
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
    
    const course = await Course.findById(params.id);
    
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
    
    await course.deleteOne();
    
    return NextResponse.json({
      message: 'Course deleted successfully',
    });
  } catch (error) {
    console.error('Delete course error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

