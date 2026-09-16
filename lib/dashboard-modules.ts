export type DashboardModule = 'voice' | 'messages' | 'social' | 'ai';

const MODULES = new Set<DashboardModule>(['voice', 'messages', 'social', 'ai']);

const ROUTE_OWNERS: Array<{ module: DashboardModule; prefixes: string[] }> = [
  {
    module: 'ai',
    prefixes: [
      '/dashboard/ai-team',
      '/dashboard/ai-agents',
      '/dashboard/ai-employees',
      '/dashboard/ai-playground',
      '/dashboard/automations',
      '/dashboard/tickets',
      '/dashboard/rag-memory',
      '/dashboard/voice-lab',
      '/dashboard/tts',
    ],
  },
  {
    module: 'messages',
    prefixes: [
      '/dashboard/inbox',
      '/dashboard/sms',
      '/dashboard/sms-inbox',
      '/dashboard/messages',
      '/dashboard/channels',
    ],
  },
  {
    module: 'social',
    prefixes: [
      '/dashboard/social-campaigns',
      '/dashboard/whatsapp',
      '/dashboard/whatsapp-inbox',
      '/dashboard/pipeline',
      '/dashboard/flow-builder',
    ],
  },
  { module: 'voice', prefixes: ['/dashboard/campaigns'] },
];

export function isDashboardModule(value: string | null | undefined): value is DashboardModule {
  return Boolean(value && MODULES.has(value as DashboardModule));
}

/**
 * The explicit query parameter preserves the module for shared pages such as
 * Numbers and Settings. Unique routes still resolve correctly on direct load.
 */
export function resolveDashboardModule(pathname: string, requested?: string | null): DashboardModule {
  const routeOwner = ROUTE_OWNERS.find(owner => owner.prefixes.some(prefix =>
    pathname === prefix || pathname.startsWith(`${prefix}/`),
  ))?.module;
  if (routeOwner) return routeOwner;
  if (requested === 'phone') return 'voice';
  if (isDashboardModule(requested)) return requested;
  return 'voice';
}

export function dashboardModuleHref(href: string, module: DashboardModule) {
  const separator = href.includes('?') ? '&' : '?';
  return `${href}${separator}module=${module}`;
}
