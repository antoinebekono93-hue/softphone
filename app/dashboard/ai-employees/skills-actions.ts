"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { syncAgentSkillsWithOpenAI } from "@/lib/openai-skills";
import { revalidatePath } from "next/cache";

export async function getAgentSkills(employeeId: string) {
  const session = await auth();
  if (!session?.user?.organizationId) throw new Error("Unauthorized");

  const skills = await prisma.agentSkill.findMany({
    where: { aiEmployeeId: employeeId },
    orderBy: { createdAt: 'desc' }
  });
  return skills;
}

export async function createAgentSkill(employeeId: string, data: any) {
  const session = await auth();
  if (!session?.user?.organizationId) throw new Error("Unauthorized");

  // Verify employee belongs to org
  const employee = await prisma.aIEmployee.findUnique({
    where: { id: employeeId, organizationId: session.user.organizationId }
  });
  if (!employee) throw new Error("Employee not found");

  const skill = await prisma.agentSkill.create({
    data: {
      aiEmployeeId: employeeId,
      name: data.name,
      description: data.description,
      endpointUrl: data.endpointUrl,
      method: data.method,
      parametersSchema: data.parametersSchema,
      headers: data.headers
    }
  });

  // Sync to OpenAI
  await syncAgentSkillsWithOpenAI(employeeId);

  revalidatePath(`/dashboard/ai-employees/${employeeId}`);
  return skill;
}

export async function updateAgentSkill(skillId: string, employeeId: string, data: any) {
  const session = await auth();
  if (!session?.user?.organizationId) throw new Error("Unauthorized");

  // Verify employee belongs to org
  const employee = await prisma.aIEmployee.findUnique({
    where: { id: employeeId, organizationId: session.user.organizationId }
  });
  if (!employee) throw new Error("Employee not found");

  const skill = await prisma.agentSkill.update({
    where: { id: skillId, aiEmployeeId: employeeId },
    data: {
      name: data.name,
      description: data.description,
      endpointUrl: data.endpointUrl,
      method: data.method,
      parametersSchema: data.parametersSchema,
      headers: data.headers
    }
  });

  // Sync to OpenAI
  await syncAgentSkillsWithOpenAI(employeeId);

  revalidatePath(`/dashboard/ai-employees/${employeeId}`);
  return skill;
}

export async function deleteAgentSkill(skillId: string, employeeId: string) {
  const session = await auth();
  if (!session?.user?.organizationId) throw new Error("Unauthorized");

  // Verify employee belongs to org
  const employee = await prisma.aIEmployee.findUnique({
    where: { id: employeeId, organizationId: session.user.organizationId }
  });
  if (!employee) throw new Error("Employee not found");

  await prisma.agentSkill.delete({
    where: { id: skillId, aiEmployeeId: employeeId }
  });

  // Sync to OpenAI
  await syncAgentSkillsWithOpenAI(employeeId);

  revalidatePath(`/dashboard/ai-employees/${employeeId}`);
  return true;
}
