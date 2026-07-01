import { getComplianceRecords } from "./actions";
import { ComplianceClient } from "./ComplianceClient";

export default async function GodModeCompliancePage() {
  const res = await getComplianceRecords();

  return (
    <ComplianceClient initialRecords={res.data || []} />
  );
}
