import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BookOpen, Users, Award, Zap } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-primary py-20 px-4 text-center text-white">
        <div className="container mx-auto max-w-6xl">
          <h1 className="mb-6 text-5xl font-bold leading-tight md:text-6xl">
            Welcome to EduFlow LMS
          </h1>
          <p className="mb-8 text-xl md:text-2xl opacity-90">
            A modern, AI-powered Learning Management System for the future of education
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/auth/signup">
              <Button size="lg" variant="secondary">
                Get Started Free
              </Button>
            </Link>
            <Link href="/courses">
              <Button size="lg" variant="outline" className="bg-white text-primary hover:bg-gray-100">
                Browse Courses
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-3xl font-bold md:text-4xl">
            Why Choose EduFlow?
          </h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={<BookOpen className="h-10 w-10" />}
              title="Rich Content"
              description="Create engaging courses with videos, articles, quizzes, and assignments"
            />
            <FeatureCard
              icon={<Users className="h-10 w-10" />}
              title="Role-Based Access"
              description="Secure authentication with Admin, Instructor, and Student roles"
            />
            <FeatureCard
              icon={<Award className="h-10 w-10" />}
              title="Certifications"
              description="Issue certificates upon course completion to recognize achievements"
            />
            <FeatureCard
              icon={<Zap className="h-10 w-10" />}
              title="AI-Powered"
              description="Get smart recommendations and AI-generated content suggestions"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-secondary py-16 px-4 text-center">
        <div className="container mx-auto max-w-4xl">
          <h2 className="mb-4 text-3xl font-bold">Ready to Start Learning?</h2>
          <p className="mb-8 text-lg text-muted-foreground">
            Join thousands of learners and start your educational journey today
          </p>
          <Link href="/auth/signup">
            <Button size="lg">Create Your Account</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="container mx-auto max-w-6xl text-center text-sm text-muted-foreground">
          <p className="mb-2">
            Built with Next.js 16, MongoDB, TypeScript, and Tailwind CSS
          </p>
          <div className="flex gap-4 justify-center items-center">
            <span>Omkar Sonawane</span>
            <span>•</span>
            <a
              href="https://github.com/Omkarcode11"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary"
            >
              GitHub
            </a>
            <span>•</span>
            <a
              href="https://linkedin.com/in/omkardev"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary"
            >
              LinkedIn
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center text-center p-6 rounded-lg border bg-card hover:shadow-md transition-shadow">
      <div className="mb-4 text-primary">{icon}</div>
      <h3 className="mb-2 text-xl font-semibold">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

