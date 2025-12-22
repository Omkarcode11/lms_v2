import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { z } from 'zod';
import connectDB from '@/lib/db/connection';
import Review from '@/lib/db/models/Review';
import Course from '@/lib/db/models/Course';
import Enrollment from '@/lib/db/models/Enrollment';

const reviewSchema = z.object({
  courseId: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().max(500).optional(),
});

// POST /api/reviews - Create or update a review
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
    const { courseId, rating, comment } = reviewSchema.parse(body);
    
    await connectDB();
    
    // Check if user is enrolled in the course
    const enrollment = await Enrollment.findOne({
      userId: token.id,
      courseId: courseId,
    });
    
    if (!enrollment) {
      return NextResponse.json(
        { error: 'You must be enrolled in the course to leave a review' },
        { status: 403 }
      );
    }
    
    // Check if review already exists
    let review = await Review.findOne({
      userId: token.id,
      courseId: courseId,
    });
    
    if (review) {
      // Update existing review
      review.rating = rating;
      if (comment !== undefined) {
        review.comment = comment;
      }
      await review.save();
    } else {
      // Create new review
      review = await Review.create({
        userId: token.id,
        courseId: courseId,
        rating,
        comment,
      });
    }
    
    // Update course rating
    const reviews = await Review.find({ courseId });
    const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    
    await Course.findByIdAndUpdate(courseId, {
      rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
      reviewCount: reviews.length,
    });
    
    return NextResponse.json({
      message: 'Review submitted successfully',
      review,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Create review error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/reviews - Get reviews for a course
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    
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
        { error: 'courseId is required' },
        { status: 400 }
      );
    }
    
    const reviews = await Review.find({ courseId })
      .populate('userId', 'name avatar')
      .sort({ createdAt: -1 })
      .lean();
    
    return NextResponse.json({ reviews });
  } catch (error) {
    console.error('Get reviews error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

