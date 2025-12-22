import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import connectDB from '@/lib/db/connection';
import Review from '@/lib/db/models/Review';
import Course from '@/lib/db/models/Course';

// DELETE /api/reviews/[id] - Delete a review
export async function DELETE(
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
    
    const review = await Review.findById(params.id);
    
    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }
    
    // Check if user owns the review
    if (review.userId.toString() !== token.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    const courseId = review.courseId;
    await review.deleteOne();
    
    // Update course rating
    const reviews = await Review.find({ courseId });
    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null;
    
    await Course.findByIdAndUpdate(courseId, {
      rating: averageRating ? Math.round(averageRating * 10) / 10 : null,
      reviewCount: reviews.length,
    });
    
    return NextResponse.json({
      message: 'Review deleted successfully',
    });
  } catch (error) {
    console.error('Delete review error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

