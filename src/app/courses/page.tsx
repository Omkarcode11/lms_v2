'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { BookOpen, Users, Star, Search } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  level: string;
  category: string;
  enrollmentCount: number;
  rating: number | null;
  reviewCount: number;
  instructorId: {
    name: string;
  };
}

export default function CoursesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedPrice, setSelectedPrice] = useState('');
  const [enrolling, setEnrolling] = useState<string | null>(null);

  useEffect(() => {
    fetchCourses();
    if (session) {
      fetchEnrolledCourses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, selectedLevel, session]);

  const fetchCourses = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedLevel) params.append('level', selectedLevel);
      if (searchQuery) params.append('search', searchQuery);

      const res = await fetch(`/api/courses?${params.toString()}`);
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

  const fetchEnrolledCourses = async () => {
    try {
      const res = await fetch('/api/students/my-courses');
      if (res.ok) {
        const data = await res.json();
        const enrolledIds = new Set<string>(
          data.courses
            .map((c: { enrollment: { courseId: { id?: string; _id?: string } } }) => 
              c.enrollment.courseId.id || c.enrollment.courseId._id
            )
            .filter((id: string | undefined): id is string => typeof id === 'string')
        );
        setEnrolledCourseIds(enrolledIds);
      }
    } catch (error) {
      console.error('Failed to fetch enrolled courses:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCourses();
  };

  const handleEnroll = async (courseId: string, price: number) => {
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    setEnrolling(courseId);
    try {
      const res = await fetch('/api/enrollments/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, paymentMethod: 'MOCK' }),
      });

      if (res.ok) {
        const data = await res.json();
        if (price > 0) {
          alert(`Payment successful! Transaction ID: ${data.payment.transactionId}`);
        }
        router.push('/student/my-courses');
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to enroll');
      }
    } catch (error) {
      console.error('Failed to enroll:', error);
      alert('Failed to enroll in course');
    } finally {
      setEnrolling(null);
    }
  };

  const filteredCourses = courses.filter((course) => {
    if (selectedPrice === 'free' && course.price !== 0) return false;
    if (selectedPrice === 'paid' && course.price === 0) return false;
    return true;
  });

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedLevel('');
    setSelectedPrice('');
  };

  const activeFiltersCount = [searchQuery, selectedCategory, selectedLevel, selectedPrice].filter(Boolean).length;

  const isEnrolled = (courseId: string) => enrolledCourseIds.has(courseId);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-primary">
            EduFlow
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/courses">
              <Button variant="ghost">Courses</Button>
            </Link>
            {session ? (
              <>
                {(session.user as { role?: string }).role === 'INSTRUCTOR' && (
                  <Link href="/instructor">
                    <Button variant="outline">Instructor Dashboard</Button>
                  </Link>
                )}
                <Link href="/student/my-courses">
                  <Button variant="outline">My Courses</Button>
                </Link>
                <Link href="/dashboard">
                  <Button>Dashboard</Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth/signin">
                  <Button variant="outline">Sign In</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button>Get Started</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-primary text-white py-16 px-4">
        <div className="container mx-auto max-w-6xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Explore Our Courses
          </h1>
          <p className="text-xl opacity-90 mb-8">
            Learn from industry experts and advance your career
          </p>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-6">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search courses by title or description..."
                  className="pl-10 bg-white text-gray-900"
                />
              </div>
              <Button type="submit" variant="secondary">
                Search
              </Button>
            </div>
          </form>

          <div className="flex gap-4 justify-center flex-wrap">
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
              <BookOpen className="h-5 w-5" />
              <span>{courses.length} Courses</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
              <Users className="h-5 w-5" />
              <span>{courses.reduce((sum, c) => sum + c.enrollmentCount, 0)}+ Students</span>
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="border-b py-6 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex gap-4 flex-wrap items-center">
            <select 
              className="px-4 py-2 border rounded-md bg-background cursor-pointer"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="Web Development">Web Development</option>
              <option value="Data Science">Data Science</option>
              <option value="Design">Design</option>
              <option value="DevOps">DevOps</option>
              <option value="Mobile Development">Mobile Development</option>
            </select>
            <select 
              className="px-4 py-2 border rounded-md bg-background cursor-pointer"
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
            >
              <option value="">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
            <select 
              className="px-4 py-2 border rounded-md bg-background cursor-pointer"
              value={selectedPrice}
              onChange={(e) => setSelectedPrice(e.target.value)}
            >
              <option value="">All Prices</option>
              <option value="free">Free</option>
              <option value="paid">Paid</option>
            </select>
            {activeFiltersCount > 0 && (
              <Button variant="outline" onClick={resetFilters}>
                Clear Filters ({activeFiltersCount})
              </Button>
            )}
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            Showing {filteredCourses.length} of {courses.length} courses
          </div>
        </div>
      </section>

      {/* Courses Grid */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-lg">Loading courses...</p>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No courses found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your filters or search query
              </p>
              <Button onClick={resetFilters}>Clear All Filters</Button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredCourses.map((course) => {
                const enrolled = isEnrolled(course.id);
                
                return (
                  <Card key={course.id} className="flex flex-col overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <div className="text-white text-6xl">📚</div>
                      <div className="absolute top-2 right-2">
                        <span className="bg-white text-gray-900 px-3 py-1 rounded-full text-sm font-medium">
                          {course.level}
                        </span>
                      </div>
                      {course.price === 0 && (
                        <div className="absolute top-2 left-2">
                          <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                            FREE
                          </span>
                        </div>
                      )}
                      {enrolled && (
                        <div className="absolute bottom-2 left-2">
                          <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                            ✓ ENROLLED
                          </span>
                        </div>
                      )}
                    </div>
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground uppercase tracking-wide">
                          {course.category}
                        </span>
                        {course.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">{course.rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                      <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {course.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{course.enrollmentCount.toLocaleString()}</span>
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        By {course.instructorId.name}
                      </p>
                    </CardContent>
                    <CardFooter className="flex items-center justify-between pt-4 border-t">
                      <div>
                        {course.price === 0 ? (
                          <span className="text-2xl font-bold text-green-600">Free</span>
                        ) : (
                          <span className="text-2xl font-bold">₹{course.price.toFixed(2)}</span>
                        )}
                      </div>
                      {enrolled ? (
                        <Link href={`/student/courses/${course.id}`}>
                          <Button variant="outline">
                            Continue Learning
                          </Button>
                        </Link>
                      ) : (
                        <Button 
                          onClick={() => handleEnroll(course.id, course.price)}
                          disabled={enrolling === course.id}
                        >
                          {enrolling === course.id ? 'Enrolling...' : 'Enroll Now'}
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      {!session && (
        <section className="bg-secondary py-16 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Start Learning?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Sign up now and get access to all our courses
            </p>
            <Link href="/auth/signup">
              <Button size="lg">Create Free Account</Button>
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
