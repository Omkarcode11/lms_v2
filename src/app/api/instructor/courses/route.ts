import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import connectDB from '@/lib/db/connection';
import Course from '@/lib/db/models/Course';
import Enrollment from '@/lib/db/models/Enrollment';

// GET /api/instructor/courses - Get instructor's courses with enrollment stats
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token || (token.role !== 'INSTRUCTOR' && token.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    await connectDB();
    
    const courses = await Course.find({ instructorId: token.id })
      .sort({ createdAt: -1 })
      .lean();
    
    // Get enrollment stats for each course
    const coursesWithStats = await Promise.all(
      courses.map(async (course) => {
        const enrollmentStats = await Enrollment.aggregate([
          { $match: { courseId: course._id } },
          {
            $group: {
              _id: null,
              totalEnrollments: { $sum: 1 },
              activeEnrollments: {
                $sum: { $cond: [{ $eq: ['$status', 'ACTIVE'] }, 1, 0] },
              },
              completedEnrollments: {
                $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] },
              },
              totalRevenue: { $sum: '$paidAmount' },
            },
          },
        ]);
        
        const stats = enrollmentStats[0] || {
          totalEnrollments: 0,
          activeEnrollments: 0,
          completedEnrollments: 0,
          totalRevenue: 0,
        };
        
        return {
          ...course,
          id: course._id.toString(),
          _id: undefined,
          stats,
        };
      })
    );
    
    return NextResponse.json({ courses: coursesWithStats });
  } catch (error) {
    console.error('Get instructor courses error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

