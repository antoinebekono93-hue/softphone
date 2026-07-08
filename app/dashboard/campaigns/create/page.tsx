"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Papa from 'papaparse';
import { UploadCloud, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function CreateCampaignPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [contacts, setContacts] = useState<{name: string, phone: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedContacts = results.data.map((row: any) => ({
          name: row.name || row.Name || row.NOM || '',
          phone: row.phone || row.Phone || row.TELEPHONE || row.numero || ''
        })).filter(c => c.phone); // Keep only those with a phone number

        if (parsedContacts.length > 0) {
          setContacts(parsedContacts);
          toast.success(`${parsedContacts.length} contacts importés.`);
        } else {
          toast.error("Le fichier ne contient pas de colonne 'phone' valide.");
        }
      },
      error: () => {
        toast.error("Erreur lors de la lecture du fichier CSV.");
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || contacts.length === 0) {
      toast.error("Le nom et un fichier de contacts sont requis.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, agentPrompt: prompt, contacts })
      });

      if (!res.ok) throw new Error("Erreur lors de la création de la campagne");

      toast.success("Campagne créée avec succès !");
      router.push('/dashboard/campaigns');
      router.refresh();
    } catch (err) {
      toast.error("Erreur de création.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nouvelle Campagne Outbound</h1>
        <p className="text-muted-foreground text-lg">Lancez une série d'appels gérés par votre Agent IA.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuration de la Campagne</CardTitle>
          <CardDescription>Définissez l'objectif et ciblez vos contacts.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>Nom de la campagne</Label>
              <Input 
                placeholder="Ex: Relance des Paniers Abandonnés (Juin)" 
                value={name} 
                onChange={e => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Consigne Spécifique pour l'IA (Prompt)</Label>
              <Textarea 
                placeholder="Ex: Bonjour, je suis l'assistant de la boutique X. Je vous appelle car vous avez laissé des articles dans votre panier..."
                rows={4}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">L'IA lira cette instruction avant de lancer chaque appel. En appel sortant, c'est l'IA qui doit parler en premier.</p>
            </div>

            <div className="space-y-2">
              <Label>Contacts (Fichier CSV)</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors">
                <Input 
                  type="file" 
                  accept=".csv" 
                  onChange={handleFileUpload} 
                  className="hidden" 
                  id="csv-upload"
                />
                <Label htmlFor="csv-upload" className="cursor-pointer flex flex-col items-center">
                  <UploadCloud className="w-10 h-10 text-gray-400 mb-2" />
                  <span className="text-sm font-medium">Cliquez pour importer un CSV</span>
                  <span className="text-xs text-muted-foreground mt-1">Colonnes requises : "name", "phone"</span>
                </Label>
              </div>
              
              {contacts.length > 0 && (
                <div className="flex items-center text-sm text-green-600 bg-green-50 p-3 rounded-lg mt-2">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {contacts.length} contacts prêts à être appelés.
                </div>
              )}
            </div>

            <div className="pt-4 flex justify-end">
              <Button type="submit" disabled={isLoading || contacts.length === 0} className="w-full sm:w-auto">
                {isLoading ? "Création..." : "Lancer la Campagne"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
