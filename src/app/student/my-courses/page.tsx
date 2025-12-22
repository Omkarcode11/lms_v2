'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Course {
  enrollment: {
    id: string;
    status: string;
    progress: number;
    enrolledAt: string;
    completedAt?: string;
    courseId: {
      id: string;
      title: string;
      description: string;
      price: number;
      thumbnail?: string;
      instructorId: {
        name: string;
      };
    };
  };
  completedLessons: number;
  totalLessons: number;
  progressPercentage: number;
}

export default function MyCourses() {
  const { status } = useSession();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    if (status === 'authenticated') {
      fetchCourses();
    }
  }, [status, router]);

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/students/my-courses');
      if (res.ok) {
        const data = await res.json();
        setCourses(data.courses);
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Courses</h1>
            <p className="text-gray-600 mt-1">Continue your learning journey</p>
          </div>
          <Link href="/courses">
            <Button>Browse More Courses</Button>
          </Link>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="text-sm text-gray-600 mb-1">Total Enrolled</div>
            <div className="text-3xl font-bold text-gray-900">{courses.length}</div>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-gray-600 mb-1">In Progress</div>
            <div className="text-3xl font-bold text-gray-900">
              {courses.filter(c => c.enrollment.status === 'ACTIVE').length}
            </div>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-gray-600 mb-1">Completed</div>
            <div className="text-3xl font-bold text-gray-900">
              {courses.filter(c => c.enrollment.status === 'COMPLETED').length}
            </div>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-gray-600 mb-1">Avg Progress</div>
            <div className="text-3xl font-bold text-gray-900">
              {courses.length > 0
                ? Math.round(courses.reduce((sum, c) => sum + c.progressPercentage, 0) / courses.length)
                : 0}%
            </div>
          </Card>
        </div>

        {/* Courses Grid */}
        {courses.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 mb-4">You haven&apos;t enrolled in any courses yet.</p>
            <Link href="/courses">
              <Button>Explore Courses</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Card key={course.enrollment.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <div className="text-white text-6xl">📚</div>
                </div>
                <div className="p-6">
                  <div className="mb-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      course.enrollment.status === 'COMPLETED' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {course.enrollment.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {course.enrollment.courseId.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    by {course.enrollment.courseId.instructorId.name}
                  </p>
                  
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span className="font-medium">{course.progressPercentage}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-600" 
                        style={{ width: `${course.progressPercentage}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {course.completedLessons} of {course.totalLessons} lessons completed
                    </div>
                  </div>
                  
                  <Link href={`/student/courses/${course.enrollment.courseId.id}`}>
                    <Button className="w-full">
                      {course.enrollment.status === 'COMPLETED' ? 'Review Course' : 'Continue Learning'}
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

