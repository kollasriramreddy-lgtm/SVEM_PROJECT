import React, { useState, useEffect } from 'react';
import { ShieldAlert, Search, Filter, Clock, User, FileText, CheckCircle2 } from 'lucide-react';
import { AuditLog } from '../types';
import { db } from '../services/db/database';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    db.getAuditLogs().then((l) => {
      setLogs(l);
      setLoading(false);
    });
  }, []);

  const actionTypes = [
    'ALL',
    'CREATE_EMPLOYEE',
    'UPDATE_EMPLOYEE',
    'SALARY_REVISION',
    'SAVE_ATTENDANCE_BATCH',
    'CALCULATE_PAYROLL',
    'ADD_PAYROLL_ADJUSTMENT',
    'APPROVE_PAYROLL',
    'FINALIZE_PAYROLL',
    'REOPEN_PAYROLL',
    'CREATE_SITE',
    'ASSIGN_MANAGER',
  ];

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.user_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="h-5 w-5 text-amber-500" />
            <div>
              <h2 className="text-base font-black tracking-tight text-slate-900">
                AUDIT LOGS & ADMINISTRATIVE TRAIL
              </h2>
              <p className="text-xs text-slate-500">
                Immutable security log of salary revisions, attendance overrides, adjustments & payroll approvals
              </p>
            </div>
          </div>

          <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200">
            {logs.length} Recorded Events
          </span>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="h-3.5 w-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search description, operator or user..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white"
            />
          </div>

          <div>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white"
            >
              {actionTypes.map((a) => (
                <option key={a} value={a}>
                  {a === 'ALL' ? 'All Action Categories' : a}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Logs Stream Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-900 text-white font-semibold uppercase text-[11px]">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">User / Actor</th>
                <th className="p-3">Action Type</th>
                <th className="p-3">Description & Justification</th>
                <th className="p-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    No audit records matched your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-mono text-slate-500 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{log.user_name || 'System'}</div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">{log.user_role || 'Auto'}</div>
                    </td>
                    <td className="p-3">
                      <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 font-mono font-bold text-[10px] text-slate-800 border border-slate-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 text-slate-700 font-medium max-w-md">
                      {log.description}
                    </td>
                    <td className="p-3 text-right">
                      {(log.old_values || log.new_values) && (
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="text-xs font-bold text-amber-600 hover:text-amber-700 underline"
                        >
                          View Diff
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Diff Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="relative max-h-[85vh] w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-6 py-4 text-white">
              <h3 className="text-sm font-bold text-white">Audit Event Payload Diff: {selectedLog.action}</h3>
              <button onClick={() => setSelectedLog(null)} className="rounded-lg p-1 text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs font-mono">
              <p className="text-slate-700 font-sans font-medium">{selectedLog.description}</p>

              {selectedLog.old_values && (
                <div>
                  <p className="font-bold text-rose-700 uppercase font-sans mb-1">Previous Values:</p>
                  <pre className="rounded-xl bg-slate-900 p-3 text-rose-300 overflow-x-auto">
                    {JSON.stringify(selectedLog.old_values, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.new_values && (
                <div>
                  <p className="font-bold text-emerald-700 uppercase font-sans mb-1">New Values:</p>
                  <pre className="rounded-xl bg-slate-900 p-3 text-emerald-300 overflow-x-auto">
                    {JSON.stringify(selectedLog.new_values, null, 2)}
                  </pre>
                </div>
              )}
            </div>
            <div className="flex justify-end p-4 border-t border-slate-100 bg-slate-50">
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
