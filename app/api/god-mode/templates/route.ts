import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const templates = await prisma.agentTemplate.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // In a real app, verify if session.user has SUPER_ADMIN role

    const body = await req.json();
    const { name, jobTitle, roleType, description, systemPrompt, tones, skills, color, bgColor } = body;

    const newTemplate = await prisma.agentTemplate.create({
      data: {
        name,
        jobTitle,
        roleType,
        description,
        systemPrompt,
        tones, // Expected to be JSON stringified array
        skills, // Expected to be JSON stringified array
        color,
        bgColor
      }
    });

    return NextResponse.json(newTemplate);
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
