import { auth } from "@/auth";
import { Users, Phone, Plus, MoreHorizontal, Search } from "lucide-react";

export const metadata = {
  title: "Team Management | Antigravity",
};

export default async function TeamPage() {
  const session = await auth();

  // Mock Team Members
  const team = [
    { id: 1, name: "Alice Smith", email: "alice@antigravity.com", role: "Admin", status: "Active", joined: "Jan 12, 2026" },
    { id: 2, name: "Bob Jones", email: "bob@antigravity.com", role: "Manager", status: "Active", joined: "Feb 05, 2026" },
    { id: 3, name: "Charlie Brown", email: "charlie@antigravity.com", role: "Agent", status: "Invited", joined: "-" },
    { id: 4, name: "Diana Prince", email: "diana@antigravity.com", role: "Agent", status: "Active", joined: "Mar 10, 2026" },
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 text-[var(--text-primary)]">
            Team <span className="text-gradient">Management</span>
          </h1>
          <p className="text-[var(--text-secondary)] text-sm md:text-base">Invite users, manage roles, and monitor team activity.</p>
        </div>
        <button className="w-full md:w-auto btn-primary-gradient flex items-center justify-center gap-2">
          <Plus className="w-5 h-5" />
          Invite Member
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Side: Team List */}
        <div className="lg:col-span-3 glass-panel flex flex-col overflow-hidden">
          <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-surface-solid)]/30">
            <h2 className="font-semibold text-lg text-[var(--text-primary)]">Active Members (4/10 Seats)</h2>
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
              <input 
                type="text" 
                placeholder="Search team..." 
                className="pl-9 pr-4 py-1.5 bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded-lg text-sm outline-none focus:border-cyan-500 transition-colors text-[var(--text-primary)] placeholder-[var(--text-secondary)]"
              />
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-[var(--bg-surface-solid)]/30 border-b border-[var(--border-subtle)] text-xs uppercase tracking-wider text-[var(--text-secondary)] font-medium">
                <tr>
                  <th className="p-4 pl-6">User</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {team.map((user) => (
                  <tr key={user.id} className="hover:bg-[var(--bg-surface-hover)] transition-colors group">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 flex items-center justify-center font-bold text-sm">
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="font-medium text-[var(--text-primary)]">{user.name}</div>
                          <div className="text-xs text-[var(--text-secondary)]">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <select className="bg-transparent border border-transparent hover:border-[var(--border-subtle)] rounded px-2 py-1 text-sm text-[var(--text-primary)] outline-none cursor-pointer focus:border-cyan-500">
                        <option>{user.role}</option>
                        <option>Admin</option>
                        <option>Manager</option>
                        <option>Agent</option>
                      </select>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${user.status === 'Active' ? 'badge-glass-green' : 'badge-glass-gray'}`}>
                         <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${user.status === 'Active' ? 'bg-emerald-500' : 'bg-gray-400'}`}></div>
                        {user.status}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <button className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] rounded-md transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Quick Stats & Ring Groups */}
        <div className="flex flex-col gap-6">
          <div className="glass-panel p-6">
            <h3 className="font-semibold mb-4 text-[var(--text-primary)] flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-500" /> Ring Groups
            </h3>
            <div className="flex flex-col gap-3">
              <div className="p-4 border border-[var(--border-subtle)] rounded-xl bg-[var(--bg-surface-hover)] hover:border-cyan-500/50 transition-colors cursor-pointer">
                <div className="flex justify-between items-start mb-3">
                  <div className="font-medium text-sm text-[var(--text-primary)]">Sales Team</div>
                  <span className="text-xs text-[var(--text-secondary)]">2 members</span>
                </div>
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full border-2 border-[var(--bg-surface-hover)] bg-blue-500 text-[10px] text-white flex items-center justify-center font-bold">AS</div>
                  <div className="w-8 h-8 rounded-full border-2 border-[var(--bg-surface-hover)] bg-purple-500 text-[10px] text-white flex items-center justify-center font-bold">BJ</div>
                </div>
              </div>
              <div className="p-4 border border-[var(--border-subtle)] rounded-xl bg-[var(--bg-surface-hover)] hover:border-cyan-500/50 transition-colors cursor-pointer">
                <div className="flex justify-between items-start mb-3">
                  <div className="font-medium text-sm text-[var(--text-primary)]">Support Team</div>
                  <span className="text-xs text-[var(--text-secondary)]">1 member</span>
                </div>
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full border-2 border-[var(--bg-surface-hover)] bg-emerald-500 text-[10px] text-white flex items-center justify-center font-bold">DP</div>
                </div>
              </div>
              <button className="mt-2 text-sm text-cyan-500 font-medium flex items-center gap-1 hover:text-cyan-400 transition-colors">
                <Plus className="w-4 h-4" />
                Create Ring Group
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
