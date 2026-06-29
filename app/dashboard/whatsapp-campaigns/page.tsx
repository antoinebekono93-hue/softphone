import CampaignDashboard from "@/components/whatsapp/campaigns/CampaignDashboard";

export const metadata = {
  title: "Campagnes WhatsApp | Antigravity",
};

export default function WhatsAppCampaignsPage() {
  return (
    <div className="h-full p-8 max-w-7xl mx-auto w-full">
      <CampaignDashboard />
    </div>
  );
}
