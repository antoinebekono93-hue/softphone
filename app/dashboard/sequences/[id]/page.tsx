import { getSequence } from "../actions";
import { SequenceEditorClient } from "./SequenceEditorClient";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Éditeur de Séquence | Antigravity",
};

export default async function SequenceEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const sequence = await getSequence(resolvedParams.id);
  
  if (!sequence) {
    notFound();
  }

  return <SequenceEditorClient initialSequence={sequence} />;
}
