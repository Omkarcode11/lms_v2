'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Lesson {
  _id: string;
  title: string;
  description: string;
  type: string;
  content: string;
  duration: number;
  order: number;
  isFree: boolean;
}

interface Module {
  _id: string;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
}

export default function CourseContent() {
  const { status } = useSession();
  const params = useParams();
  const courseId = params.id as string;

  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  
  const [moduleForm, setModuleForm] = useState({
    title: '',
    description: '',
  });

  const [lessonForm, setLessonForm] = useState({
    title: '',
    description: '',
    type: 'VIDEO',
    content: '',
    duration: 0,
    isFree: false,
  });

  useEffect(() => {
    if (status === 'authenticated') {
      fetchModules();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, courseId]);

  const fetchModules = async () => {
    try {
      const res = await fetch(`/api/instructor/courses/${courseId}/modules`);
      if (res.ok) {
        const data = await res.json();
        setModules(data.modules || []);
      }
    } catch (error) {
      console.error('Failed to fetch modules:', error);
    } finally {
      setLoading(false);
    }
  };

  const createModule = async () => {
    try {
      const res = await fetch(`/api/instructor/courses/${courseId}/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...moduleForm,
          order: modules.length + 1,
        }),
      });

      if (res.ok) {
        setShowModuleForm(false);
        setModuleForm({ title: '', description: '' });
        fetchModules();
        alert('Module created successfully!');
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to create module');
      }
    } catch (error) {
      console.error('Failed to create module:', error);
      alert('Failed to create module');
    }
  };

  const updateModule = async () => {
    if (!editingModule) return;

    try {
      const res = await fetch(
        `/api/instructor/courses/${courseId}/modules/${editingModule._id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(moduleForm),
        }
      );

      if (res.ok) {
        setShowModuleForm(false);
        setEditingModule(null);
        setModuleForm({ title: '', description: '' });
        fetchModules();
        alert('Module updated successfully!');
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to update module');
      }
    } catch (error) {
      console.error('Failed to update module:', error);
      alert('Failed to update module');
    }
  };

  const deleteModule = async (moduleId: string) => {
    if (!confirm('Are you sure? This will delete the module and all its lessons.')) {
      return;
    }

    try {
      const res = await fetch(
        `/api/instructor/courses/${courseId}/modules/${moduleId}`,
        {
          method: 'DELETE',
        }
      );

      if (res.ok) {
        fetchModules();
        alert('Module deleted successfully!');
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to delete module');
      }
    } catch (error) {
      console.error('Failed to delete module:', error);
      alert('Failed to delete module');
    }
  };

  const createLesson = async () => {
    if (!selectedModuleId) return;

    const moduleItem = modules.find(m => m._id === selectedModuleId);
    if (!moduleItem) return;

    try {
      const res = await fetch(
        `/api/instructor/courses/${courseId}/modules/${selectedModuleId}/lessons`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...lessonForm,
          order: moduleItem.lessons.length + 1,
        }),
        }
      );

      if (res.ok) {
        setShowLessonForm(false);
        setSelectedModuleId(null);
        setLessonForm({
          title: '',
          description: '',
          type: 'VIDEO',
          content: '',
          duration: 0,
          isFree: false,
        });
        fetchModules();
        alert('Lesson created successfully!');
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to create lesson');
      }
    } catch (error) {
      console.error('Failed to create lesson:', error);
      alert('Failed to create lesson');
    }
  };

  const updateLesson = async () => {
    if (!editingLesson || !selectedModuleId) return;

    try {
      const res = await fetch(
        `/api/instructor/courses/${courseId}/modules/${selectedModuleId}/lessons/${editingLesson._id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(lessonForm),
        }
      );

      if (res.ok) {
        setShowLessonForm(false);
        setEditingLesson(null);
        setSelectedModuleId(null);
        setLessonForm({
          title: '',
          description: '',
          type: 'VIDEO',
          content: '',
          duration: 0,
          isFree: false,
        });
        fetchModules();
        alert('Lesson updated successfully!');
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to update lesson');
      }
    } catch (error) {
      console.error('Failed to update lesson:', error);
      alert('Failed to update lesson');
    }
  };

  const deleteLesson = async (moduleId: string, lessonId: string) => {
    if (!confirm('Are you sure you want to delete this lesson?')) {
      return;
    }

    try {
      const res = await fetch(
        `/api/instructor/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`,
        {
          method: 'DELETE',
        }
      );

      if (res.ok) {
        fetchModules();
        alert('Lesson deleted successfully!');
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to delete lesson');
      }
    } catch (error) {
      console.error('Failed to delete lesson:', error);
      alert('Failed to delete lesson');
    }
  };

  const openEditModule = (module: Module) => {
    setEditingModule(module);
    setModuleForm({
      title: module.title,
      description: module.description || '',
    });
    setShowModuleForm(true);
  };

  const openEditLesson = (moduleId: string, lesson: Lesson) => {
    setEditingLesson(lesson);
    setSelectedModuleId(moduleId);
    setLessonForm({
      title: lesson.title,
      description: lesson.description || '',
      type: lesson.type,
      content: lesson.content,
      duration: lesson.duration || 0,
      isFree: lesson.isFree,
    });
    setShowLessonForm(true);
  };

  const closeModuleForm = () => {
    setShowModuleForm(false);
    setEditingModule(null);
    setModuleForm({ title: '', description: '' });
  };

  const closeLessonForm = () => {
    setShowLessonForm(false);
    setEditingLesson(null);
    setSelectedModuleId(null);
    setLessonForm({
      title: '',
      description: '',
      type: 'VIDEO',
      content: '',
      duration: 0,
      isFree: false,
    });
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/instructor" className="text-blue-600 hover:text-blue-800">
            ← Back to Dashboard
          </Link>
        </div>

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Course Content</h1>
            <p className="text-gray-600 mt-1">Manage modules and lessons</p>
          </div>
          <Button onClick={() => setShowModuleForm(true)}>
            Add Module
          </Button>
        </div>

        {modules.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Modules Yet</h2>
            <p className="text-gray-600 mb-4">
              Start by creating your first module
            </p>
            <Button onClick={() => setShowModuleForm(true)}>
              Create First Module
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {modules.map((moduleItem, moduleIndex) => (
              <Card key={moduleItem._id} className="overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-start">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Module {moduleIndex + 1}: {moduleItem.title}
                    </h2>
                    {moduleItem.description && (
                      <p className="text-gray-600 mt-1">{moduleItem.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      onClick={() => openEditModule(moduleItem)}
                      variant="outline"
                      size="sm"
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => {
                        setSelectedModuleId(moduleItem._id);
                        setShowLessonForm(true);
                      }}
                      variant="outline"
                      size="sm"
                    >
                      Add Lesson
                    </Button>
                    <Button
                      onClick={() => deleteModule(moduleItem._id)}
                      variant="destructive"
                      size="sm"
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                {moduleItem.lessons.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    No lessons yet. Click &quot;Add Lesson&quot; to create one.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {moduleItem.lessons.map((lesson, lessonIndex) => (
                      <div key={lesson._id} className="px-6 py-4 hover:bg-gray-50">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                            {lessonIndex + 1}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{lesson.title}</h3>
                            {lesson.description && (
                              <p className="text-sm text-gray-600 mt-1">{lesson.description}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                              <span className="px-2 py-1 bg-gray-100 rounded">{lesson.type}</span>
                              {lesson.duration > 0 && <span>{lesson.duration} min</span>}
                              {lesson.isFree && (
                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                                  FREE PREVIEW
                                </span>
                              )}
                            </div>
                            {lesson.content && (
                              <p className="text-xs text-gray-400 mt-2 truncate">
                                Content: {lesson.content}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => openEditLesson(module._id, lesson)}
                              variant="outline"
                              size="sm"
                            >
                              Edit
                            </Button>
                            <Button
                              onClick={() => deleteLesson(module._id, lesson._id)}
                              variant="destructive"
                              size="sm"
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Module Form Modal */}
        {showModuleForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4 p-6 bg-white">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {editingModule ? 'Edit Module' : 'Add Module'}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="moduleTitle">Module Title *</Label>
                  <Input
                    id="moduleTitle"
                    value={moduleForm.title}
                    onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                    placeholder="e.g., Introduction to React"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="moduleDescription">Description</Label>
                  <textarea
                    id="moduleDescription"
                    value={moduleForm.description}
                    onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Brief description of this module"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button 
                  onClick={editingModule ? updateModule : createModule} 
                  className="flex-1"
                  disabled={!moduleForm.title}
                >
                  {editingModule ? 'Update Module' : 'Create Module'}
                </Button>
                <Button 
                  onClick={closeModuleForm}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Lesson Form Modal */}
        {showLessonForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
            <Card className="w-full max-w-2xl mx-4 my-8 p-6 bg-white">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {editingLesson ? 'Edit Lesson' : 'Add Lesson'}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="lessonTitle">Lesson Title *</Label>
                  <Input
                    id="lessonTitle"
                    value={lessonForm.title}
                    onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                    placeholder="e.g., Understanding Components"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="lessonDescription">Description</Label>
                  <textarea
                    id="lessonDescription"
                    value={lessonForm.description}
                    onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="What students will learn in this lesson"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="lessonType">Type</Label>
                    <select
                      id="lessonType"
                      value={lessonForm.type}
                      onChange={(e) => setLessonForm({ ...lessonForm, type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="VIDEO">Video</option>
                      <option value="ARTICLE">Article</option>
                      <option value="QUIZ">Quiz</option>
                      <option value="ASSIGNMENT">Assignment</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="lessonDuration">Duration (minutes)</Label>
                    <Input
                      id="lessonDuration"
                      type="number"
                      min="0"
                      value={lessonForm.duration}
                      onChange={(e) => setLessonForm({ ...lessonForm, duration: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="lessonContent">Content URL *</Label>
                  <Input
                    id="lessonContent"
                    value={lessonForm.content}
                    onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                    placeholder="https://www.youtube.com/embed/VIDEO_ID"
                    required
                  />
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-xs font-semibold text-blue-900 mb-1">YouTube URL Format:</p>
                    <p className="text-xs text-blue-800 mb-2">
                      ✅ Correct: <code className="bg-white px-1 py-0.5 rounded">https://www.youtube.com/embed/dQw4w9WgXcQ</code>
                    </p>
                    <p className="text-xs text-blue-800">
                      ❌ Wrong: <code className="bg-white px-1 py-0.5 rounded">https://www.youtube.com/watch?v=dQw4w9WgXcQ</code>
                    </p>
                    <p className="text-xs text-gray-600 mt-2">
                      Replace <code className="bg-white px-1 py-0.5 rounded">/watch?v=</code> with <code className="bg-white px-1 py-0.5 rounded">/embed/</code>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="lessonFree"
                    checked={lessonForm.isFree}
                    onChange={(e) => setLessonForm({ ...lessonForm, isFree: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <Label htmlFor="lessonFree" className="font-normal">
                    Free preview (accessible without enrollment)
                  </Label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button 
                  onClick={editingLesson ? updateLesson : createLesson} 
                  className="flex-1"
                  disabled={!lessonForm.title || !lessonForm.content}
                >
                  {editingLesson ? 'Update Lesson' : 'Create Lesson'}
                </Button>
                <Button 
                  onClick={closeLessonForm}
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
