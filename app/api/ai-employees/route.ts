import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import OpenAI from 'openai';
import { syncAgentSkillsWithOpenAI } from '@/lib/openai-skills';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const employees = await prisma.aIEmployee.findMany({
      where: { organizationId: session.user.organizationId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(employees);
  } catch (error: any) {
    console.error('Failed to fetch AI employees:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, jobTitle, systemPrompt, templateId, selectedTone, voiceId, language, handlesWhatsApp, handlesVoice, handlesSms, handlesInstagram, voicePhoneNumberId, roleType } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    let finalSystemPrompt = systemPrompt || "Tu es un assistant virtuel utile.";

    if (templateId) {
      const template = await prisma.agentTemplate.findUnique({ where: { id: templateId } });
      if (template) {
        finalSystemPrompt = template.systemPrompt;
        if (selectedTone) {
          try {
            const tones = JSON.parse(template.tones || '[]');
            const toneObj = tones.find((t: any) => t.name === selectedTone);
            if (toneObj) {
              finalSystemPrompt += `\n\n[DIRECTIVE DE TON : ${toneObj.name}]\n${toneObj.prompt}`;
            }
          } catch(e) {}
        }
      }
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Find if the organization has a Knowledge Base
    const knowledgeBase = await prisma.knowledgeBase.findFirst({
      where: { organizationId: session.user.organizationId }
    });

    const assistant = await openai.beta.assistants.create({
      name: name,
      instructions: finalSystemPrompt,
      model: "gpt-4o-mini"
    });

    const employee = await prisma.aIEmployee.create({
      data: {
        organizationId: session.user.organizationId,
        name,
        jobTitle: jobTitle || 'Agent de Support Client',
        systemPrompt: finalSystemPrompt,
        templateId: templateId || null,
        selectedTone: selectedTone || null,
        voiceId: voiceId || 'alloy',
        language: language || 'fr-FR',
        handlesWhatsApp: !!handlesWhatsApp,
        handlesVoice: !!handlesVoice,
        handlesInstagram: !!handlesInstagram,
        voicePhoneNumberId: voicePhoneNumberId || null,
        roleType: roleType || 'GENERAL',
        isActive: true,
        openaiAssistantId: assistant.id,
        knowledgeBaseId: knowledgeBase?.id || null
      }
    });

    // Initialize tools natively from the centralized sync method
    await syncAgentSkillsWithOpenAI(employee.id);

    return NextResponse.json(employee, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create AI employee:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
