import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import connectDB from '@/lib/db/connection';
import Enrollment, { EnrollmentStatus } from '@/lib/db/models/Enrollment';
import Course from '@/lib/db/models/Course';
import Payment, { PaymentStatus } from '@/lib/db/models/Payment';

const enrollSchema = z.object({
  courseId: z.string(),
  paymentMethod: z.enum(['MOCK', 'CREDIT_CARD', 'PAYPAL']).default('MOCK'),
});

// POST /api/enrollments/enroll - Enroll in a course with mock payment
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
    console.log('Enrollment request body:', body);
    const { courseId, paymentMethod } = enrollSchema.parse(body);
    
    await connectDB();
    
    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }
    
    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      userId: token.id,
      courseId: courseId,
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
      courseId: courseId,
      status: EnrollmentStatus.ACTIVE,
      progress: 0,
      paymentStatus: course.price > 0 ? 'PENDING' : 'COMPLETED',
      paidAmount: 0,
    });
    
    // Process payment
    if (course.price > 0) {
      // Mock payment - automatically succeeds
      const payment = await Payment.create({
        userId: token.id,
        courseId: courseId,
        enrollmentId: enrollment._id,
        amount: course.price,
        currency: 'INR',
        status: PaymentStatus.COMPLETED,
        method: paymentMethod,
        transactionId: `MOCK_${nanoid(16)}`,
      });
      
      // Update enrollment with payment info
      enrollment.paymentStatus = 'COMPLETED';
      enrollment.paidAmount = course.price;
      await enrollment.save();
      
      // Update course enrollment count
      course.enrollmentCount += 1;
      await course.save();
      
      return NextResponse.json({
        message: 'Successfully enrolled and payment completed!',
        enrollment,
        payment,
      }, { status: 201 });
    } else {
      // Free course
      course.enrollmentCount += 1;
      await course.save();
      
      return NextResponse.json({
        message: 'Successfully enrolled in free course!',
        enrollment,
      }, { status: 201 });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Enroll error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

