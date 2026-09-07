import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdminApi } from '@/lib/security';

export async function GET(req: Request) {
  try {
    const guard = await requireSuperAdminApi();
    if (guard) return guard;

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
    const guard = await requireSuperAdminApi();
    if (guard) return guard;

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