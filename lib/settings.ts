import { prisma } from "./prisma";
import { fetchWithCache } from "./redis";

export async function getSystemSettings() {
  return await fetchWithCache(
    "system-settings:default",
    async () => {
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
            whatsappRate: 0.02,
            phoneNumberRate: 1.00,
            eSimRate: 5.00
          }
        });
      }
      
      return settings;
    },
    86400 // Cache for 24 hours
  );
}
