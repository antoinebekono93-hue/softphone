import { prisma } from "@/lib/prisma";

export default async function GlobalUsersPage() {
  const users = await prisma.user.findMany({
    include: {
      organization: {
        select: { name: true, slug: true }
      }
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="w-full">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Global Users</h1>
          <p className="text-[var(--text-secondary)]">Manage all user accounts across the entire platform.</p>
        </div>
        <button className="px-4 py-2 bg-white text-black hover:bg-gray-200 rounded-lg text-sm font-bold transition-colors">
          + Invite User
        </button>
      </div>

      <div className="glass-panel border-none rounded-2xl overflow-hidden shadow-2xl">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--bg-surface-hover)] border-b border-[var(--border-subtle)] text-[var(--text-secondary)]">
            <tr>
              <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">User</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Organization</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Role</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Joined</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-[var(--text-primary)] font-bold text-xs uppercase shadow-lg">
                        {user.name ? user.name.charAt(0) : user.email.charAt(0)}
                     </div>
                     <div>
                        <div className="font-bold text-[var(--text-primary)] text-sm">{user.name || "No Name Provided"}</div>
                        <div className="text-[var(--text-secondary)] text-xs mt-0.5">{user.email}</div>
                     </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {user.organization ? (
                     <div>
                        <div className="text-[var(--text-primary)] font-medium">{user.organization.name}</div>
                        <div className="text-[var(--text-primary)]/30 text-xs">@{user.organization.slug}</div>
                     </div>
                  ) : (
                     <span className="text-[var(--text-primary)]/30 italic">Unassigned</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                     {user.isSuperAdmin && (
                        <span className="px-2 py-1 bg-red-500/10 border border-red-500/20 text-red-400 rounded text-xs font-bold uppercase tracking-wider">
                           God
                        </span>
                     )}
                     <span className={`px-2 py-1 bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded text-xs font-medium ${
                        user.role === 'OWNER' ? 'text-amber-400' :
                        user.role === 'ADMIN' ? 'text-blue-400' :
                        'text-[var(--text-primary)]/70'
                     }`}>
                        {user.role}
                     </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-[var(--text-secondary)] text-xs">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-sm font-medium mr-4">
                    Reset Pwd
                  </button>
                  <button className="text-red-400/50 hover:text-red-400 transition-colors text-sm font-medium">
                    Suspend
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="text-center py-20 text-[var(--text-primary)]/30 border-t border-[var(--border-subtle)]">
             <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 opacity-50"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
             <p>No users found in the database.</p>
          </div>
        )}
      </div>
    </div>
  );
}
