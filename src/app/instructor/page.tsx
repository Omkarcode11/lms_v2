'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface CourseStats {
  totalEnrollments: number;
  activeEnrollments: number;
  completedEnrollments: number;
  totalRevenue: number;
}

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  status: string;
  enrollmentCount: number;
  rating: number | null;
  reviewCount: number;
  createdAt: string;
  stats: CourseStats;
}

export default function InstructorDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    if (status === 'authenticated' && (session?.user as { role?: string }).role !== 'INSTRUCTOR' && (session?.user as { role?: string })?.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }

    if (status === 'authenticated') {
      fetchCourses();
    }
  }, [status, session, router]);

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/instructor/courses');
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

  const totalRevenue = courses.reduce((sum, course) => sum + course.stats.totalRevenue, 0);
  const totalStudents = courses.reduce((sum, course) => sum + course.stats.totalEnrollments, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Instructor Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage your courses and track student progress</p>
          </div>
          <Link href="/instructor/courses/create">
            <Button>Create New Course</Button>
          </Link>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="text-sm text-gray-600 mb-1">Total Courses</div>
            <div className="text-3xl font-bold text-gray-900">{courses.length}</div>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-gray-600 mb-1">Total Students</div>
            <div className="text-3xl font-bold text-gray-900">{totalStudents}</div>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-gray-600 mb-1">Total Revenue</div>
            <div className="text-3xl font-bold text-gray-900">₹{totalRevenue.toFixed(2)}</div>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-gray-600 mb-1">Published Courses</div>
            <div className="text-3xl font-bold text-gray-900">
              {courses.filter(c => c.status === 'PUBLISHED').length}
            </div>
          </Card>
        </div>

        {/* Courses List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Your Courses</h2>
          </div>

          {courses.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 mb-4">You haven&apos;t created any courses yet.</p>
              <Link href="/instructor/courses/create">
                <Button>Create Your First Course</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Course
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Students
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rating
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {courses.map((course) => (
                    <tr key={course.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{course.title}</div>
                          <div className="text-sm text-gray-500">₹{course.price.toFixed(2)}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          course.status === 'PUBLISHED' 
                            ? 'bg-green-100 text-green-800' 
                            : course.status === 'DRAFT'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {course.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {course.stats.totalEnrollments}
                          <span className="text-gray-500 ml-1">
                            ({course.stats.activeEnrollments} active)
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          ₹{course.stats.totalRevenue.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {course.rating ? `⭐ ${course.rating.toFixed(1)}` : 'No ratings'}
                          {course.reviewCount > 0 && (
                            <span className="text-gray-500 ml-1">({course.reviewCount})</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <Link href={`/instructor/courses/${course.id}/content`} className="text-blue-600 hover:text-blue-900 mr-4">
                          Content
                        </Link>
                        <Link href={`/instructor/courses/${course.id}/edit`} className="text-blue-600 hover:text-blue-900 mr-4">
                          Edit
                        </Link>
                        <Link href={`/instructor/courses/${course.id}/students`} className="text-blue-600 hover:text-blue-900 mr-4">
                          Students
                        </Link>
                        <Link href={`/instructor/courses/${course.id}`} className="text-blue-600 hover:text-blue-900">
                          Reviews
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

