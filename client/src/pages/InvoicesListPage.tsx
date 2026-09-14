import { AlertTriangle, Clock, CreditCard, Wallet } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { InvoiceSummary } from '../api/types';
import { StatusBadge } from '../components/StatusBadge';
import { formatDate, formatMoney } from '../lib/format';

type Group = 'Overdue' | 'PartiallyPaid' | 'Sent' | 'Paid';

// Ordre pensé pour un usage quotidien : ce qui réclame une action en premier (retards),
// puis ce qui est en cours de recouvrement, et enfin ce qui est soldé.
const GROUP_ORDER: { key: Group; title: string; hint: string; icon: typeof Clock; color: string }[] = [
  { key: 'Overdue', title: 'En retard', hint: 'Échéance dépassée — à relancer', icon: AlertTriangle, color: 'text-rose-400' },
  { key: 'PartiallyPaid', title: 'Partiellement payées', hint: 'Solde restant à encaisser', icon: Wallet, color: 'text-amber-400' },
  { key: 'Sent', title: 'En attente', hint: 'Envoyées, dans les délais', icon: Clock, color: 'text-blue-400' },
  { key: 'Paid', title: 'Payées', hint: 'Soldées', icon: CreditCard, color: 'text-emerald-400' },
];

function groupOf(i: InvoiceSummary): Group {
  if (i.isOverdue) return 'Overdue';
  return i.status as Group;
}

export function InvoicesListPage() {
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.invoices.search(search || undefined).then(setInvoices);
  }, [search]);

  const grouped = useMemo(() => {
    const map = new Map<Group, InvoiceSummary[]>();
    for (const g of GROUP_ORDER) map.set(g.key, []);
    for (const i of invoices) map.get(groupOf(i))!.push(i);
    for (const list of map.values()) list.sort((a, b) => b.issueDate.localeCompare(a.issueDate));
    return map;
  }, [invoices]);

  const stats = GROUP_ORDER.map((g) => {
    const list = grouped.get(g.key) ?? [];
    return { ...g, count: list.length, total: list.reduce((s, i) => s + i.totalTtc, 0) };
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-400">Pilotage commercial</p>
        <h1 className="mt-1 text-2xl font-bold text-white">Factures</h1>
      </div>

      <div className="grid grid-cols-2 divide-x divide-white/5 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.key} className="flex items-center gap-3 px-5 py-4">
            <s.icon size={18} className={s.color} />
            <div>
              <p className="text-lg font-bold text-white">{String(s.count).padStart(2, '0')}</p>
              <p className="text-xs text-slate-500">{s.title} · {formatMoney(s.total)}</p>
            </div>
          </div>
        ))}
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Rechercher une facture ou un client…"
        className="w-full max-w-md rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-brand-500"
      />

      <div className="space-y-6">
        {GROUP_ORDER.map((g) => {
          const list = grouped.get(g.key) ?? [];
          if (list.length === 0) return null;
          return (
            <div key={g.key} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
              <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
                <div className="flex items-center gap-2">
                  <g.icon size={16} className={g.color} />
                  <h2 className="font-semibold text-white">{g.title}</h2>
                  <span className="text-xs text-slate-500">({list.length})</span>
                </div>
                <p className="text-xs text-slate-500">{g.hint}</p>
              </div>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-white/5">
                  {list.map((inv) => (
                    <tr key={inv.id} onClick={() => navigate(`/factures/${inv.id}`)} className="cursor-pointer hover:bg-white/[0.03]">
                      <td className="w-40 px-5 py-3 font-medium text-white">{inv.number}</td>
                      <td className="px-5 py-3 text-slate-300">{inv.customerName}</td>
                      <td className="w-28 px-5 py-3 text-slate-500">{formatDate(inv.issueDate)}</td>
                      <td className="w-32 px-5 py-3 text-right font-semibold text-slate-200">{formatMoney(inv.totalTtc)}</td>
                      <td className="w-36 px-5 py-3 text-right"><StatusBadge status={inv.isOverdue ? 'Overdue' : inv.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
        {invoices.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-10 text-center text-slate-500">Aucune facture</div>
        )}
      </div>
    </div>
  );
}
