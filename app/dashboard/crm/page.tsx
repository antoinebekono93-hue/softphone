import CrmApp from "@/components/crm/CrmApp";

export const metadata = {
  title: "CRM Pipeline | Buster Call",
};

export default function CrmPage() {
  return (
    <div className="h-full flex flex-col p-8 max-w-full mx-auto w-full">
      <CrmApp />
    </div>
  );
}
