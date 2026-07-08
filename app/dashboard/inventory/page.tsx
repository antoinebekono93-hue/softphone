import React from 'react';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, AlertTriangle, CheckCircle, Tag } from 'lucide-react';

export default async function InventoryPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect('/login');

  const orgId = session.user.organizationId;

  // Fetch Products
  const products = await prisma.product.findMany({
    where: { organizationId: orgId },
    orderBy: { name: 'asc' }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inventaire & Catalogue</h1>
        <p className="text-muted-foreground text-lg">Gérez vos produits et niveaux de stock consultables par l'IA.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" /> Base de Données Produits
          </CardTitle>
          <CardDescription>Vos agents IA accèdent à cette base pour répondre aux clients qui demandent si un produit est en stock ou pour connaître son prix.</CardDescription>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
              Votre catalogue est vide. Ajoutez des produits pour que l'IA puisse renseigner vos clients.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                  <tr>
                    <th scope="col" className="px-6 py-3">Produit</th>
                    <th scope="col" className="px-6 py-3">SKU</th>
                    <th scope="col" className="px-6 py-3">Prix</th>
                    <th scope="col" className="px-6 py-3">Stock</th>
                    <th scope="col" className="px-6 py-3">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="bg-white border-b hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                        {product.name}
                      </td>
                      <td className="px-6 py-4 font-mono text-gray-500">
                        {product.sku || '-'}
                      </td>
                      <td className="px-6 py-4 font-semibold">
                        {product.price.toFixed(2)} €
                      </td>
                      <td className="px-6 py-4">
                        <span className={product.stockLevel > 0 ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                          {product.stockLevel}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {product.stockLevel > 0 ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200 flex w-fit items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> En stock
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="flex w-fit items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Rupture
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
