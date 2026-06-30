import { getSequences } from "./actions";
import { SequencesClient } from "./SequencesClient";

export const metadata = {
  title: "Séquences | Antigravity",
};

export default async function SequencesPage() {
  const sequences = await getSequences();
  return <SequencesClient initialSequences={sequences} />;
}
