"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "react-hot-toast";

export default function EcommerceSettings({ initialStore, orgId }: { initialStore: any, orgId: string }) {
  const [platform, setPlatform] = useState(initialStore?.platform || "SHOPIFY");
  const [storeUrl, setStoreUrl] = useState(initialStore?.storeUrl || "");
  const [aiDiscountEnabled, setAiDiscountEnabled] = useState(initialStore?.aiDiscountEnabled || false);
  const [aiDiscountValue, setAiDiscountValue] = useState(initialStore?.aiDiscountValue || "10%");
  const [isSaving, setIsSaving] = useState(false);
  const [storeId, setStoreId] = useState(initialStore?.id);

  const handleSave = async () => {
    if (platform === "SHOPIFY" && !storeUrl.includes("myshopify.com") && !storeUrl.includes("shopify")) {
      toast.error("Veuillez entrer une URL Shopify valide");
      return;
    }
    
    setIsSaving(true);
    try {
      const res = await fetch("/api/ecommerce/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          storeUrl, 
          platform,
          aiDiscountEnabled,
          aiDiscountValue
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Paramètres Shopify enregistrés !");
        setStoreId(data.store.id);
      } else {
        toast.error("Erreur lors de l'enregistrement");
      }
    } catch (error) {
      toast.error("Erreur réseau");
    }
    setIsSaving(false);
  };

  const getWebhookUrl = (type: string) => {
    if (typeof window === "undefined") return "";
    const origin = window.location.origin;
    return `${origin}/api/webhooks/ecommerce/${type}?storeId=${storeId}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuration Shopify</CardTitle>
        <CardDescription>Connectez votre boutique pour synchroniser le catalogue et récupérer les paniers.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Plateforme E-Commerce</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full p-2 border rounded-md mb-4 bg-white"
            >
              <option value="SHOPIFY">Shopify</option>
              <option value="WOOCOMMERCE">WooCommerce</option>
              <option value="CUSTOM">Site Sur-Mesure (API Personnalisée)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">URL de la boutique</label>
            <input 
              type="text" 
              value={storeUrl}
              onChange={(e) => setStoreUrl(e.target.value)}
              className="w-full p-2 border rounded-md"
              placeholder={platform === "SHOPIFY" ? "votre-boutique.myshopify.com" : "https://www.votresite.com"}
            />
          </div>

          <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg border">
            <input 
              type="checkbox" 
              id="discountToggle"
              checked={aiDiscountEnabled}
              onChange={(e) => setAiDiscountEnabled(e.target.checked)}
              className="w-4 h-4 text-blue-600"
            />
            <div className="flex-1">
              <label htmlFor="discountToggle" className="font-medium cursor-pointer">Autoriser l'IA à offrir une réduction</label>
              <p className="text-sm text-gray-500">Si un client hésite à cause du prix lors d'un abandon de panier, l'IA proposera ce code promo.</p>
            </div>
            {aiDiscountEnabled && (
              <input 
                type="text" 
                value={aiDiscountValue}
                onChange={(e) => setAiDiscountValue(e.target.value)}
                className="w-24 p-2 border rounded-md"
                placeholder="10% ou CODE10"
              />
            )}
          </div>

          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? "Enregistrement..." : "Enregistrer la configuration"}
          </button>
        </div>

        {storeId && (
          <div className="pt-6 border-t mt-6">
            <h3 className="text-lg font-medium mb-4">Webhooks à configurer</h3>
            
            {platform === "SHOPIFY" && (
              <p className="text-sm text-gray-600 mb-4">
                Allez dans votre admin Shopify {'>'} Paramètres {'>'} Notifications {'>'} Webhooks et ajoutez ces deux webhooks :
              </p>
            )}
            
            {platform === "WOOCOMMERCE" && (
              <p className="text-sm text-gray-600 mb-4">
                Allez dans WordPress {'>'} WooCommerce {'>'} Réglages {'>'} Avancé {'>'} Webhooks et créez deux webhooks (Format: JSON) :
              </p>
            )}

            {platform === "CUSTOM" && (
              <p className="text-sm text-gray-600 mb-4">
                Demandez à votre développeur d'envoyer des requêtes POST (Content-Type: application/json) vers ces URLs :
              </p>
            )}
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 border rounded-md">
                <p className="font-semibold text-sm mb-1">1. Webhook Produit (Création/Mise à jour)</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-gray-200 p-2 rounded flex-1 overflow-x-auto">
                    {getWebhookUrl('catalog-sync')}
                  </code>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {platform === "SHOPIFY" && "Événement : Mise à jour de produit (Product update)"}
                  {platform === "WOOCOMMERCE" && "Sujet : Produit mis à jour"}
                  {platform === "CUSTOM" && "Payload attendu : { id: '123', title: 'Nom', variants: [{ price: '10', sku: 'A1', inventory_quantity: 5 }] }"}
                </p>
              </div>

              <div className="p-4 bg-gray-50 border rounded-md">
                <p className="font-semibold text-sm mb-1">2. Webhook Panier Abandonné</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-gray-200 p-2 rounded flex-1 overflow-x-auto">
                    {getWebhookUrl('abandoned-cart')}
                  </code>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {platform === "SHOPIFY" && "Événement : Création de panier abandonné (Cart creation)"}
                  {platform === "WOOCOMMERCE" && "Sujet : Action personnalisée (woocommerce_checkout_update_order_meta ou via un plugin de relance de panier)"}
                  {platform === "CUSTOM" && "Payload attendu : { id: 'CART1', total_price: '50', currency: 'EUR', customer: { phone: '+33600000000', first_name: 'Jean' }, line_items: [{ product_id: '123', title: 'Nom', quantity: 1, price: '50' }] }"}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
