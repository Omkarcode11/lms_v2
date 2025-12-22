import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { z } from 'zod';
import connectDB from '@/lib/db/connection';
import Course from '@/lib/db/models/Course';

const courseSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().min(20).max(2000),
  thumbnail: z.string().url().optional(),
  price: z.number().min(0),
  level: z.enum(['Beginner', 'Intermediate', 'Advanced']),
  category: z.string().min(2),
  tags: z.array(z.string()).optional(),
});

// GET /api/courses - List all published courses
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const level = searchParams.get('level');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    
    const query: Record<string, unknown> = { status: 'PUBLISHED' };
    
    if (category) query.category = category;
    if (level) query.level = level;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    
    const skip = (page - 1) * limit;
    
    const [courses, total] = await Promise.all([
      Course.find(query)
        .populate('instructorId', 'name email avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Course.countDocuments(query),
    ]);
    
    // Transform _id to id for consistency
    const transformedCourses = courses.map(course => ({
      ...course,
      id: course._id.toString(),
      _id: undefined,
    }));
    
    return NextResponse.json({
      courses: transformedCourses,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get courses error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/courses - Create a new course (Instructor/Admin only)
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token || (token.role !== 'INSTRUCTOR' && token.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    const body = await req.json();
    const validatedData = courseSchema.parse(body);
    
    await connectDB();
    
    // Generate slug from title
    const slug = validatedData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    // Check if slug already exists
    const existingCourse = await Course.findOne({ slug });
    if (existingCourse) {
      return NextResponse.json(
        { error: 'A course with a similar title already exists' },
        { status: 400 }
      );
    }
    
    const course = await Course.create({
      ...validatedData,
      slug,
      instructorId: token.id,
      tags: validatedData.tags || [],
    });
    
    return NextResponse.json(
      { message: 'Course created successfully', course },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Create course error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

