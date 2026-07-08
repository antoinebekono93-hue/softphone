"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Save, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function IntegrationsSettingsPage() {
  const [calComApiKey, setCalComApiKey] = useState('');
  const [calComEventId, setCalComEventId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch('/api/organizations/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calComApiKey, calComEventId })
      });

      if (!res.ok) throw new Error("Erreur de sauvegarde");
      
      toast.success("Intégrations sauvegardées avec succès");
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Intégrations</h1>
        <p className="text-muted-foreground text-lg">Connectez vos outils métiers à l'Agent IA.</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-blue-600" />
              <div>
                <CardTitle>Cal.com (Prise de Rendez-vous)</CardTitle>
                <CardDescription>Permettez à votre Agent de consulter vos disponibilités et bloquer des créneaux en direct.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">Clé API Cal.com</Label>
                <Input 
                  id="apiKey"
                  type="password"
                  placeholder="cal_..." 
                  value={calComApiKey} 
                  onChange={e => setCalComApiKey(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Trouvez cette clé dans vos paramètres Cal.com &gt; API Keys.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="eventId">ID de l'événement (Event Type ID)</Label>
                <Input 
                  id="eventId"
                  type="text"
                  placeholder="Ex: 123456" 
                  value={calComEventId} 
                  onChange={e => setCalComEventId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">L'identifiant numérique de l'événement que l'IA va proposer (ex: "Consultation 30 min").</p>
              </div>

              <div className="pt-2">
                <Button type="submit" disabled={isLoading} className="gap-2">
                  {isLoading ? "Sauvegarde..." : <><Save className="w-4 h-4" /> Sauvegarder</>}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        
        {/* Autres intégrations futures (ex: Salesforce, Zendesk) pourront s'ajouter ici */}
      </div>
    </div>
  );
}
