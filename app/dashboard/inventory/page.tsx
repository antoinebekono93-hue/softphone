import React from 'react';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import InventoryClient from './InventoryClient';

export default async function InventoryPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect('/login');

  const orgId = session.user.organizationId;

  const [products, store, carts] = await Promise.all([
    prisma.product.findMany({
      where: { organizationId: orgId },
      orderBy: { name: 'asc' }
    }),
    prisma.ecommerceStore.findFirst({
      where: { organizationId: orgId }
    }),
    prisma.cart.findMany({
      where: { organizationId: orgId },
      include: {
        items: true,
        organization: false
      },
      orderBy: { updatedAt: 'desc' }
    })
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">E-Commerce & Inventaire</h1>
        <p className="text-muted-foreground text-lg">Gérez vos produits, surveillez les paniers abandonnés et connectez Shopify.</p>
      </div>

      <InventoryClient 
        products={products} 
        store={store} 
        carts={carts} 
        orgId={orgId} 
      />
    </div>
  );
}
