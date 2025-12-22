'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Lesson {
  id: string;
  title: string;
  description: string;
  type: string;
  content: string;
  duration: number;
  order: number;
  completed: boolean;
}

interface Module {
  id: string;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
  completedCount: number;
  totalCount: number;
  progressPercentage: number;
}

interface Enrollment {
  id: string;
  status: string;
  progress: number;
  enrolledAt: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
}

export default function StudentCourseView() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  const [modules, setModules] = useState<Module[]>([]);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    if (status === 'authenticated') {
      fetchProgress();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, router, courseId]);

  const fetchProgress = async () => {
    try {
      const res = await fetch(`/api/progress?courseId=${courseId}`);
      if (res.ok) {
        const data = await res.json();
        setModules(data.modules || []);
        setEnrollment(data.enrollment);
        setCourse(data.course);
        
        // Set first incomplete lesson as current
        if (data.modules && data.modules.length > 0) {
          for (const moduleItem of data.modules) {
            const incompleteLesson = moduleItem.lessons.find((l: Lesson) => !l.completed);
            if (incompleteLesson) {
              setCurrentLesson(incompleteLesson);
              break;
            }
          }
          // If all complete, set first lesson
          if (!currentLesson && data.modules[0].lessons.length > 0) {
            setCurrentLesson(data.modules[0].lessons[0]);
          }
        }
      } else {
        setError('Failed to load course progress');
      }
    } catch (error) {
      console.error('Failed to fetch progress:', error);
      setError('Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  const toggleLessonComplete = async (lessonId: string, _currentStatus: boolean) => {
    console.log('toggleLessonComplete called with lessonId:', lessonId);
    
    if (!lessonId) {
      alert('Error: Lesson ID is missing');
      return;
    }
    
    try {
      const payload = { lessonId, completed: true };
      console.log('Sending payload:', payload);
      
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await fetchProgress();
        alert('Lesson marked as complete!');
      } else {
        const error = await res.json();
        console.error('API error:', error);
        alert(error.error || 'Failed to update progress');
      }
    } catch (error) {
      console.error('Failed to update progress:', error);
      alert('Failed to update progress');
    }
  };

  const markCompleteAndNext = async () => {
    if (!currentLesson) {
      alert('No lesson selected');
      return;
    }
    
    console.log('markCompleteAndNext called with lesson:', currentLesson);
    console.log('Current lesson ID:', currentLesson.id);
    
    if (!currentLesson.id) {
      alert('Error: Lesson ID is missing');
      return;
    }
    
    try {
      const payload = { lessonId: currentLesson.id, completed: true };
      console.log('Sending payload:', payload);
      
      // Mark current lesson as complete
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        // Find next lesson
        let foundCurrent = false;
        let nextLesson: Lesson | null = null;
        
        for (const moduleItem of modules) {
          for (const lesson of moduleItem.lessons) {
            if (foundCurrent && !nextLesson) {
              nextLesson = lesson;
              break;
            }
            if (lesson.id === currentLesson.id) {
              foundCurrent = true;
            }
          }
          if (nextLesson) break;
        }
        
        // Refresh progress first
        await fetchProgress();
        
        // Then move to next lesson if available
        if (nextLesson) {
          setCurrentLesson(nextLesson);
          alert('Lesson completed! Moving to next lesson...');
        } else {
          alert('Lesson completed! You have finished all lessons in this course.');
        }
      } else {
        const error = await res.json();
        console.error('API error:', error);
        alert(error.error || 'Failed to mark as complete');
      }
    } catch (error) {
      console.error('Failed to update progress:', error);
      alert('Failed to mark as complete');
    }
  };

  const submitReview = async () => {
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, rating, comment }),
      });

      if (res.ok) {
        setShowReviewModal(false);
        alert('Review submitted successfully!');
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Failed to submit review:', error);
      alert('Failed to submit review');
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

  if (error || !enrollment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 mb-4">{error || 'You are not enrolled in this course'}</p>
          <Link href="/courses">
            <Button>Browse Courses</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/student/my-courses" className="text-blue-600 hover:text-blue-800">
            ← Back to My Courses
          </Link>
        </div>

        {enrollment && (
          <div className="mb-8">
            <Card className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {course?.title || 'Course Progress'}
                  </h1>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 text-sm rounded-full ${
                      enrollment.status === 'COMPLETED' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {enrollment.status}
                    </span>
                    <span className="text-gray-600">
                      Enrolled on {new Date(enrollment.enrolledAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-blue-600 mb-1">
                    {enrollment.progress}%
                  </div>
                  <Button onClick={() => setShowReviewModal(true)}>
                    Leave a Review
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {modules.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Content Yet</h2>
            <p className="text-gray-600 mb-4">
              The instructor hasn&apos;t added any modules or lessons to this course yet.
            </p>
            <p className="text-sm text-gray-500">
              Check back later for course content!
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lesson Player */}
            <div className="lg:col-span-2">
              {currentLesson ? (
                <Card className="overflow-hidden">
                  <div className="bg-black aspect-video flex items-center justify-center relative">
                    {currentLesson.content ? (
                      <iframe
                        src={currentLesson.content}
                        className="w-full h-full absolute inset-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title={currentLesson.title}
                        frameBorder="0"
                      />
                    ) : (
                      <div className="text-white text-center p-8">
                        <p>No video content available for this lesson</p>
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {currentLesson.title}
                    </h2>
                    {currentLesson.description && (
                      <p className="text-gray-600 mb-4">{currentLesson.description}</p>
                    )}
                    <div className="flex items-center gap-4">
                      <Button 
                        onClick={markCompleteAndNext}
                        disabled={currentLesson.completed}
                        className="flex-1"
                      >
                        {currentLesson.completed ? '✓ Completed' : 'Mark Complete & Next'}
                      </Button>
                      {!currentLesson.completed && (
                        <Button 
                          variant="outline"
                          onClick={() => toggleLessonComplete(currentLesson.id, false)}
                        >
                          Mark as Complete
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="p-12 text-center">
                  <p className="text-gray-600">Select a lesson to start learning</p>
                </Card>
              )}
            </div>

            {/* Course Content Sidebar */}
            <div className="space-y-4">
              {modules.map((moduleItem) => (
                <Card key={moduleItem.id} className="overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">{moduleItem.title}</h3>
                    <div className="text-sm text-gray-600 mt-1">
                      {moduleItem.completedCount} / {moduleItem.totalCount} lessons • {moduleItem.progressPercentage}%
                    </div>
                  </div>

                  <div className="divide-y divide-gray-200">
                    {moduleItem.lessons.map((lesson) => (
                      <button
                        key={lesson.id}
                        onClick={() => setCurrentLesson(lesson)}
                        className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                          currentLesson?.id === lesson.id ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            lesson.completed 
                              ? 'bg-green-500 border-green-500' 
                              : 'border-gray-300'
                          }`}>
                            {lesson.completed && (
                              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${
                              lesson.completed ? 'text-gray-500' : 'text-gray-900'
                            }`}>
                              {lesson.title}
                            </p>
                            {lesson.duration && (
                              <p className="text-xs text-gray-500">{lesson.duration} min</p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Review Modal */}
        {showReviewModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md p-6 bg-white">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Leave a Review</h2>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Rating: {rating} {rating === 1 ? 'star' : 'stars'}
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`text-4xl transition-all hover:scale-110 ${
                        star <= rating ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400'
                      }`}
                    >
                      {star <= rating ? '⭐' : '☆'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comment (optional)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  maxLength={500}
                  placeholder="Share your thoughts about this course..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  {comment.length}/500 characters
                </p>
              </div>

              <div className="flex gap-3">
                <Button onClick={submitReview} className="flex-1">
                  Submit Review
                </Button>
                <Button 
                  onClick={() => {
                    setShowReviewModal(false);
                    setRating(5);
                    setComment('');
                  }} 
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
