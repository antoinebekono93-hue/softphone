"use client";

import { useState, useTransition } from "react";
import { ShieldCheck, ShieldAlert, CheckCircle, XCircle, Search, ExternalLink } from "lucide-react";
import { approveKYC, rejectKYC } from "./actions";

export function ComplianceClient({ initialRecords }: { initialRecords: any[] }) {
  const [records, setRecords] = useState(initialRecords);
  const [isPending, startTransition] = useTransition();
  const [filter, setFilter] = useState("ALL"); // ALL, PENDING, APPROVED, REJECTED, UNVERIFIED

  const handleApprove = (orgId: string) => {
    if (!confirm("Are you sure you want to APPROVE this tenant? They will gain access to Telnyx purchasing.")) return;
    startTransition(async () => {
      const res = await approveKYC(orgId);
      if (res.error) alert(res.error);
      else {
        setRecords(records.map(r => r.id === orgId ? { ...r, kycStatus: "APPROVED" } : r));
      }
    });
  };

  const handleReject = (orgId: string) => {
    if (!confirm("Are you sure you want to REJECT this tenant?")) return;
    startTransition(async () => {
      const res = await rejectKYC(orgId);
      if (res.error) alert(res.error);
      else {
        setRecords(records.map(r => r.id === orgId ? { ...r, kycStatus: "REJECTED" } : r));
      }
    });
  };

  const filteredRecords = records.filter(r => filter === "ALL" || r.kycStatus === filter);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded flex items-center gap-1 w-max"><CheckCircle className="w-3 h-3" /> Approved</span>;
      case "PENDING":
        return <span className="px-2 py-1 bg-amber-500/10 text-amber-400 text-xs font-bold rounded flex items-center gap-1 w-max"><ShieldAlert className="w-3 h-3" /> Pending Review</span>;
      case "REJECTED":
        return <span className="px-2 py-1 bg-rose-500/10 text-rose-400 text-xs font-bold rounded flex items-center gap-1 w-max"><XCircle className="w-3 h-3" /> Rejected</span>;
      default:
        return <span className="px-2 py-1 bg-gray-500/10 text-gray-400 text-xs font-bold rounded w-max">Unverified</span>;
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-[var(--text-primary)] flex items-center gap-3">
             <ShieldCheck className="text-amber-500" />
             Compliance & KYC Center
          </h1>
          <p className="text-[var(--text-secondary)]">Review and verify tenant identities to protect your Master Telnyx Account from fraud.</p>
        </div>
        
        <div className="flex gap-2">
          {["ALL", "PENDING", "APPROVED", "REJECTED", "UNVERIFIED"].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${filter === f ? 'bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] text-white' : 'text-[var(--text-secondary)] hover:text-white'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--bg-surface-hover)] border-y border-[var(--border-subtle)] text-[var(--text-secondary)]">
              <tr>
                <th className="px-4 py-3 font-medium">Tenant</th>
                <th className="px-4 py-3 font-medium">Business Name / Reg #</th>
                <th className="px-4 py-3 font-medium">Document</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredRecords.map(org => (
                <tr key={org.id} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                  <td className="px-4 py-4 font-medium text-[var(--text-primary)]">{org.name}</td>
                  <td className="px-4 py-4">
                    <div className="text-[var(--text-primary)]">{org.businessName || "-"}</div>
                    <div className="text-xs text-[var(--text-secondary)]">{org.businessRegistrationNumber || ""}</div>
                  </td>
                  <td className="px-4 py-4">
                    {org.kycDocumentUrl ? (
                      <a href={org.kycDocumentUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-500 hover:underline flex items-center gap-1 text-xs font-bold">
                        View Document <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-xs text-[var(--text-secondary)]">No Document</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {getStatusBadge(org.kycStatus)}
                  </td>
                  <td className="px-4 py-4 text-right">
                    {org.kycStatus === "PENDING" && (
                      <div className="flex justify-end gap-2">
                        <button 
                          disabled={isPending}
                          onClick={() => handleApprove(org.id)}
                          className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 font-bold rounded text-xs transition-colors disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button 
                          disabled={isPending}
                          onClick={() => handleReject(org.id)}
                          className="px-3 py-1.5 bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 font-bold rounded text-xs transition-colors disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[var(--text-secondary)]">
                    No records found for this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
