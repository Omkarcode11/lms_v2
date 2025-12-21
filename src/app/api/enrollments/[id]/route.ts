import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import connectDB from '@/lib/db/connection';
import Enrollment from '@/lib/db/models/Enrollment';
import Course from '@/lib/db/models/Course';

// GET /api/enrollments/[id] - Get enrollment details
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    await connectDB();
    
    const enrollment = await Enrollment.findById(params.id)
      .populate('courseId')
      .populate('userId', 'name email')
      .lean();
    
    if (!enrollment) {
      return NextResponse.json(
        { error: 'Enrollment not found' },
        { status: 404 }
      );
    }
    
    // Check if user owns the enrollment
    if (enrollment.userId._id.toString() !== token.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    return NextResponse.json({ enrollment });
  } catch (error) {
    console.error('Get enrollment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

