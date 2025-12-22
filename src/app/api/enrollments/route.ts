import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { z } from 'zod';
import connectDB from '@/lib/db/connection';
import Enrollment from '@/lib/db/models/Enrollment';
import Course from '@/lib/db/models/Course';

const enrollmentSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
});

// GET /api/enrollments - Get user's enrollments
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
      .populate('courseId')
      .sort({ enrolledAt: -1 })
      .lean();
    
    return NextResponse.json({ enrollments });
  } catch (error) {
    console.error('Get enrollments error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/enrollments - Enroll in a course
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
    const validatedData = enrollmentSchema.parse(body);
    
    await connectDB();
    
    // Check if course exists
    const course = await Course.findById(validatedData.courseId);
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }
    
    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      userId: token.id,
      courseId: validatedData.courseId,
    });
    
    if (existingEnrollment) {
      return NextResponse.json(
        { error: 'Already enrolled in this course' },
        { status: 400 }
      );
    }
    
    // Create enrollment
    const enrollment = await Enrollment.create({
      userId: token.id,
      courseId: validatedData.courseId,
    });
    
    // Update course enrollment count
    await Course.findByIdAndUpdate(validatedData.courseId, {
      $inc: { enrollmentCount: 1 },
    });
    
    return NextResponse.json(
      {
        message: 'Successfully enrolled in course',
        enrollment,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Create enrollment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

