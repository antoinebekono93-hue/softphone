import subprocess
checks = [
 ['node', '--import', 'tsx', 'scripts/test-mobile-experience.ts'],
 ['node', 'node_modules/typescript/bin/tsc', '--noEmit', '--incremental', 'false'],
 ['node', 'node_modules/eslint/bin/eslint.js', 'app/dashboard/inbox/InboxClient.tsx', 'components/layout/MobileBottomNav.tsx', 'components/ui/modal.tsx', 'hooks/useCallHistory.ts', 'lib/offline-store.ts', 'components/pwa/PrivateStorageBoundary.tsx', 'hooks/useMobileDetail.ts', 'hooks/useOnline.ts', 'app/dashboard/more/page.tsx', 'app/~offline/page.tsx', 'components/providers/CommunicationProvider.tsx'],
]
for command in checks:
 print('CHECK: ' + ' '.join(command), flush=True)
 try:
  result = subprocess.run(command, timeout=120)
  print('EXIT: ' + str(result.returncode), flush=True)
 except subprocess.TimeoutExpired:
  print('TIMEOUT after 120 seconds', flush=True)
