import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import Course from '../db/models/Course';
import Enrollment from '../db/models/Enrollment';
import connectDB from '../db/connection';

export async function getPersonalizedRecommendations(userId: string, limit: number = 5) {
  try {
    await connectDB();
    
    // Get user's enrolled courses
    const enrollments = await Enrollment.find({ userId })
      .populate('courseId')
      .limit(10)
      .lean();
    
    const enrolledCourses = enrollments.map((e: any) => e.courseId);
    const categories = enrolledCourses.map((c: any) => c.category);
    const levels = enrolledCourses.map((c: any) => c.level);
    
    // Find similar courses not enrolled in
    const query: any = {
      status: 'PUBLISHED',
      _id: { $nin: enrolledCourses.map((c: any) => c._id) },
    };
    
    if (categories.length > 0) {
      query.category = { $in: categories };
    }
    
    const recommendations = await Course.find(query)
      .populate('instructorId', 'name avatar')
      .sort({ enrollmentCount: -1, rating: -1 })
      .limit(limit)
      .lean();
    
    return recommendations;
  } catch (error) {
    console.error('Error getting recommendations:', error);
    return [];
  }
}

export async function generateCourseDescription(title: string, category: string, level: string) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return `A comprehensive ${level.toLowerCase()} course on ${title} covering essential ${category.toLowerCase()} concepts and practical applications.`;
    }
    
    const { text } = await generateText({
      model: openai('gpt-3.5-turbo'),
      prompt: `Generate a compelling course description for a ${level} level course titled "${title}" in the ${category} category. The description should be 2-3 sentences, engaging, and highlight key learning outcomes. Keep it under 200 characters.`,
      maxTokens: 100,
    });
    
    return text.trim();
  } catch (error) {
    console.error('Error generating course description:', error);
    return `A comprehensive ${level.toLowerCase()} course on ${title} covering essential ${category.toLowerCase()} concepts and practical applications.`;
  }
}

export async function generateLessonContent(lessonTitle: string, moduleTitle: string) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return `Introduction to ${lessonTitle}. In this lesson, you will learn key concepts related to ${moduleTitle}.`;
    }
    
    const { text } = await generateText({
      model: openai('gpt-3.5-turbo'),
      prompt: `Create brief lesson content outline for a lesson titled "${lessonTitle}" which is part of the module "${moduleTitle}". Include 3-5 key points that should be covered. Keep it concise and educational.`,
      maxTokens: 200,
    });
    
    return text.trim();
  } catch (error) {
    console.error('Error generating lesson content:', error);
    return `Introduction to ${lessonTitle}. In this lesson, you will learn key concepts related to ${moduleTitle}.`;
  }
}

