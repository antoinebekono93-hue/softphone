'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Wallet, ArrowUpRight, ArrowDownRight, History, Loader2, AlertCircle } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

export default function BillingPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const status = searchParams.get('status');

  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'success') {
      toast.success('Paiement réussi. Votre portefeuille a été crédité !');
    } else if (status === 'success_flutterwave') {
      toast.success('Paiement Flutterwave réussi. Le solde sera mis à jour dans quelques instants.');
    } else if (status === 'cancel') {
      toast.error('Paiement annulé.');
    }

    // Clean URL
    if (status) {
      window.history.replaceState(null, '', '/dashboard/settings/billing');
    }
  }, [status]);

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      // Create an endpoint app/api/billing/data/route.ts if not exists,
      // or we can just fetch it. For now let's assume we have this endpoint.
      const res = await fetch('/api/billing/data');
      if (res.ok) {
        const data = await res.json();
        setBalance(data.balance);
        setTransactions(data.transactions);
      }
    } catch (e) {
      console.error('Failed to fetch billing data', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTopUp = async (amount: number, provider: 'stripe' | 'flutterwave') => {
    setIsProcessing(`${provider}-${amount}`);
    try {
      const endpoint = provider === 'stripe' 
        ? '/api/stripe/create-checkout-session' 
        : '/api/flutterwave/create-payment-link';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || 'Erreur de génération de lien.');
      }
    } catch (e) {
      toast.error('Erreur réseau.');
    } finally {
      setIsProcessing(null);
    }
  };

  if (isLoading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Facturation & Portefeuille</h1>
        <p className="text-muted-foreground text-lg">Rechargez votre portefeuille pour utiliser l'IA, les SMS et la voix.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Wallet Balance */}
        <Card className="md:col-span-1 bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white/90">
              <Wallet className="w-5 h-5" /> Solde Actuel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-extrabold tracking-tight">
              {balance.toFixed(2)} €
            </div>
            {balance < 2 && (
              <div className="mt-4 flex items-center gap-2 text-sm bg-red-500/20 text-red-100 p-2 rounded-md">
                <AlertCircle className="w-4 h-4" /> Solde faible. Rechargez pour éviter une coupure.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Up Options */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Recharger le Portefeuille</CardTitle>
            <CardDescription>Choisissez un montant à créditer. Sécurisé par Stripe ou Flutterwave.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              {[10, 50, 100].map((amount) => (
                <div key={amount} className="border rounded-xl p-4 flex flex-col items-center justify-center gap-2 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                  <span className="text-2xl font-bold">{amount} €</span>
                  <div className="flex flex-col w-full gap-2 mt-2">
                    <Button 
                      variant="default" 
                      className="w-full text-xs" 
                      onClick={() => handleTopUp(amount, 'stripe')}
                      disabled={!!isProcessing}
                    >
                      {isProcessing === `stripe-${amount}` ? <Loader2 className="w-3 h-3 animate-spin mr-2"/> : <CreditCard className="w-3 h-3 mr-2" />}
                      Via Stripe
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full text-xs" 
                      onClick={() => handleTopUp(amount, 'flutterwave')}
                      disabled={!!isProcessing}
                    >
                      {isProcessing === `flutterwave-${amount}` ? <Loader2 className="w-3 h-3 animate-spin mr-2"/> : null}
                      Via Flutterwave
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" /> Historique des Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
              Aucune transaction pour le moment.
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${tx.type === 'CREDIT' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {tx.type === 'CREDIT' ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`font-bold ${tx.type === 'CREDIT' ? 'text-green-600' : 'text-gray-900'}`}>
                      {tx.type === 'CREDIT' ? '+' : '-'}{Math.abs(tx.amount).toFixed(2)} €
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
