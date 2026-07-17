"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, CheckCircle, AlertTriangle } from "lucide-react";

export default function AbandonedCartsTable({ carts }: { carts: any[] }) {
  const recoveredCarts = carts.filter(c => c.status === "RECOVERED");
  const totalRecovered = recoveredCarts.reduce((acc, curr) => acc + curr.totalPrice, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Paniers Abandonnés (Total)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{carts.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Paniers Récupérés par l'IA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{recoveredCarts.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Chiffre d'Affaires Sauvé</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700">{totalRecovered.toFixed(2)} €</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" /> Suivi des Relances
          </CardTitle>
          <CardDescription>
            Lorsqu'un panier est abandonné, l'IA contacte automatiquement le client sur WhatsApp pour tenter de finaliser la vente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {carts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
              Aucun panier abandonné détecté pour le moment.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3">ID Panier</th>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Articles</th>
                    <th className="px-6 py-3">Montant</th>
                    <th className="px-6 py-3">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {carts.map(cart => (
                    <tr key={cart.id} className="bg-white border-b hover:bg-gray-50">
                      <td className="px-6 py-4 font-mono text-xs text-gray-500">
                        {cart.externalCartId}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {new Date(cart.createdAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="px-6 py-4">
                        {cart.items?.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {cart.items.map((item: any) => (
                              <span key={item.id} className="text-xs">{item.quantity}x {item.productName}</span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Inconnu</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-semibold">
                        {cart.totalPrice.toFixed(2)} {cart.currency}
                      </td>
                      <td className="px-6 py-4">
                        {cart.status === "RECOVERED" ? (
                          <Badge className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1 w-fit">
                            <CheckCircle className="w-3 h-3" /> Vente Récupérée
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50 flex items-center gap-1 w-fit">
                            <AlertTriangle className="w-3 h-3" /> En cours de relance
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
