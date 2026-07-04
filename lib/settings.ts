import { prisma } from "./prisma";

export async function getSystemSettings() {
  let settings = await prisma.systemSettings.findUnique({
    where: { id: "default" }
  });
  
  if (!settings) {
    settings = await prisma.systemSettings.create({
      data: {
        id: "default",
        phoneNumberMarkupMultiplier: 2.5,
        phoneNumberMarkupFixed: 0.0,
        smsRate: 0.05,
        callRatePerMinute: 0.02,
        aiAgentRatePerMinute: 0.15,
        whatsappRate: 0.02
      }
    });
  }
  
  return settings;
}
