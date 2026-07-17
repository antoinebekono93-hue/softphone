"use client";

import { useState } from "react";
import { Package, ShoppingCart, Settings2, AlertTriangle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import EcommerceSettings from "./components/EcommerceSettings";
import AbandonedCartsTable from "./components/AbandonedCartsTable";

export default function InventoryClient({ products, store, carts, orgId }: { products: any[], store: any, carts: any[], orgId: string }) {
  const [activeTab, setActiveTab] = useState("CATALOG"); // CATALOG, CARTS, SETTINGS

  return (
    <div className="space-y-6">
      <div className="flex space-x-1 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("CATALOG")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 ${activeTab === "CATALOG" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
        >
          <Package className="w-4 h-4" /> Catalogue ({products.length})
        </button>
        <button
          onClick={() => setActiveTab("CARTS")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 ${activeTab === "CARTS" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
        >
          <ShoppingCart className="w-4 h-4" /> Paniers Abandonnés
        </button>
        <button
          onClick={() => setActiveTab("SETTINGS")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 ${activeTab === "SETTINGS" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
        >
          <Settings2 className="w-4 h-4" /> Shopify Settings
        </button>
      </div>

      {activeTab === "CATALOG" && (
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
                Votre catalogue est vide. Ajoutez des produits ou synchronisez votre boutique.
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
      )}

      {activeTab === "CARTS" && (
        <AbandonedCartsTable carts={carts} />
      )}

      {activeTab === "SETTINGS" && (
        <EcommerceSettings initialStore={store} orgId={orgId} />
      )}
    </div>
  );
}
