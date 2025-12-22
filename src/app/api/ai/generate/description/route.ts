import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { z } from 'zod';
// import { generateCourseDescription } from '@/lib/ai/recommendations';

const generateSchema = z.object({
  title: z.string().min(5),
  category: z.string().min(2),
  level: z.enum(['Beginner', 'Intermediate', 'Advanced']),
});

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token || (token.role !== 'INSTRUCTOR' && token.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    const body = await req.json();
    const validatedData = generateSchema.parse(body);
    
    // const description = await generateCourseDescription(
      // validatedData.title,
      // validatedData.category,
      // validatedData.level
    // );
    
    return NextResponse.json({ description: 'A comprehensive course description for ' + validatedData.title + ' in the ' + validatedData.category + ' category at ' + validatedData.level + ' level' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Generate description error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

