import React from 'react';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { notFound, redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Bot, PlayCircle } from 'lucide-react';

export default async function CallDetailsPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.organizationId) redirect('/login');

  const call = await prisma.callLog.findUnique({
    where: { 
      id: params.id,
      organizationId: session.user.organizationId 
    }
  });

  if (!call) notFound();

  // On essaie de parser le transcript stocké en Json
  let transcriptSegments: { role: string, text: string }[] = [];
  if (call.transcript) {
    try {
      transcriptSegments = typeof call.transcript === 'string' 
        ? JSON.parse(call.transcript) 
        : call.transcript;
    } catch (e) {
      console.error("Failed to parse transcript", e);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Détail de l'Appel</h1>
          <p className="text-muted-foreground text-lg">
            {call.startedAt.toLocaleString()} • {call.duration}s
          </p>
        </div>
        <div className="text-right">
          <Badge variant={call.direction === 'INBOUND' ? "default" : "secondary"} className="text-sm">
            {call.direction}
          </Badge>
          <div className="mt-1 text-sm font-mono text-muted-foreground">
            {call.fromNumber} &rarr; {call.toNumber}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Colonne de gauche : QA & Info */}
        <div className="space-y-6 md:col-span-1">
          <Card className={call.qaScore && call.qaScore >= 8 ? 'border-green-200 bg-green-50/50' : call.qaScore && call.qaScore < 5 ? 'border-red-200 bg-red-50/50' : ''}>
            <CardHeader>
              <CardTitle className="text-lg">Assurance Qualité (QA)</CardTitle>
            </CardHeader>
            <CardContent>
              {call.qaScore !== null ? (
                <div className="space-y-4">
                  <div className="text-5xl font-bold text-center">
                    <span className={call.qaScore >= 8 ? 'text-green-600' : call.qaScore >= 5 ? 'text-yellow-600' : 'text-red-600'}>
                      {call.qaScore}
                    </span>
                    <span className="text-2xl text-gray-400">/10</span>
                  </div>
                  {call.qaFeedback && (
                    <div className="text-sm bg-white p-3 rounded-md border shadow-sm">
                      <p className="font-medium mb-1">Feedback de l'IA :</p>
                      <p className="text-muted-foreground">{call.qaFeedback}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  Évaluation non disponible ou en cours...
                </div>
              )}
            </CardContent>
          </Card>

          {call.recordingUrl && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <PlayCircle className="w-5 h-5" /> Enregistrement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <audio controls className="w-full">
                  <source src={call.recordingUrl} type="audio/mpeg" />
                  Votre navigateur ne supporte pas la balise audio.
                </audio>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Colonne de droite : Transcription */}
        <div className="md:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Transcription</CardTitle>
              <CardDescription>Reconstitution des échanges vocaux.</CardDescription>
            </CardHeader>
            <CardContent>
              {transcriptSegments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                  La transcription n'est pas disponible pour cet appel.
                </div>
              ) : (
                <div className="space-y-4">
                  {transcriptSegments.map((seg, idx) => (
                    <div key={idx} className={`flex gap-3 ${seg.role === 'User' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${seg.role === 'User' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                        {seg.role === 'User' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </div>
                      <div className={`p-3 rounded-lg max-w-[80%] ${seg.role === 'User' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-gray-100 text-gray-900 rounded-tl-none'}`}>
                        <p className="text-sm">{seg.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
