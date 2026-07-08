import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const template = await prisma.agentTemplate.findUnique({ where: { id: resolvedParams.id } });
    if (!template) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(template);
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { name, jobTitle, roleType, description, systemPrompt, tones, skills, color, bgColor } = body;

    const resolvedParams = await params;

    const updatedTemplate = await prisma.agentTemplate.update({
      where: { id: resolvedParams.id },
      data: {
        name, jobTitle, roleType, description, systemPrompt, tones, skills, color, bgColor
      }
    });

    // Step 5: Global Sync Logic (Retroactive Updates)
    const employeesToUpdate = await prisma.aIEmployee.findMany({
      where: { templateId: resolvedParams.id }
    });

    const parsedTones = JSON.parse(tones || '[]');

    for (const emp of employeesToUpdate) {
      let finalPrompt = systemPrompt;
      if (emp.selectedTone) {
        const toneObj = parsedTones.find((t: any) => t.name === emp.selectedTone);
        if (toneObj) {
          finalPrompt += `\n\n[DIRECTIVE DE TON : ${toneObj.name}]\n${toneObj.prompt}`;
        }
      }

      await prisma.aIEmployee.update({
        where: { id: emp.id },
        data: { systemPrompt: finalPrompt }
      });
    }

    return NextResponse.json(updatedTemplate);
  } catch (error) {
    console.error('Update template error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
