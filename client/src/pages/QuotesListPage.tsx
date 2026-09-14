import { CheckCircle2, FileText, Receipt, Send, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { QuoteSummary } from '../api/types';
import { StatusBadge } from '../components/StatusBadge';
import { formatDate, formatMoney } from '../lib/format';

type Group = 'Draft' | 'Sent' | 'Accepted' | 'Converted' | 'Closed';

const GROUP_ORDER: { key: Group; title: string; hint: string; icon: typeof FileText; color: string }[] = [
  { key: 'Draft', title: 'Brouillons', hint: 'À finaliser et envoyer', icon: FileText, color: 'text-slate-400' },
  { key: 'Sent', title: 'Envoyés', hint: 'En attente de réponse client', icon: Send, color: 'text-blue-400' },
  { key: 'Accepted', title: 'Acceptés', hint: 'Prêts à transformer en facture', icon: CheckCircle2, color: 'text-emerald-400' },
  { key: 'Converted', title: 'Facturés', hint: 'Déjà transformés en facture', icon: Receipt, color: 'text-violet-400' },
  { key: 'Closed', title: 'Refusés / expirés', hint: 'Sans suite', icon: XCircle, color: 'text-rose-400' },
];

function groupOf(q: QuoteSummary): Group {
  if (q.convertedInvoiceId) return 'Converted';
  if (q.status === 'Declined' || q.status === 'Expired') return 'Closed';
  return q.status as Group;
}

export function QuotesListPage() {
  const [quotes, setQuotes] = useState<QuoteSummary[]>([]);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.quotes.search(search || undefined).then(setQuotes);
  }, [search]);

  const open = (q: QuoteSummary) => {
    if (q.convertedInvoiceId) navigate(`/factures/${q.convertedInvoiceId}`);
    else navigate(`/devis/${q.id}`);
  };

  const grouped = useMemo(() => {
    const map = new Map<Group, QuoteSummary[]>();
    for (const g of GROUP_ORDER) map.set(g.key, []);
    for (const q of quotes) map.get(groupOf(q))!.push(q);
    for (const list of map.values()) list.sort((a, b) => b.issueDate.localeCompare(a.issueDate));
    return map;
  }, [quotes]);

  const stats = GROUP_ORDER.map((g) => {
    const list = grouped.get(g.key) ?? [];
    return { ...g, count: list.length, total: list.reduce((s, q) => s + q.totalHt, 0) };
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-400">Pilotage commercial</p>
          <h1 className="mt-1 text-2xl font-bold text-white">Devis</h1>
        </div>
        <button
          onClick={() => navigate('/devis/nouveau')}
          className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 hover:bg-brand-600"
        >
          + Nouveau devis
        </button>
      </div>

      {/* Stats en entonnoir */}
      <div className="grid grid-cols-2 divide-x divide-white/5 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] md:grid-cols-5">
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
        placeholder="Rechercher un devis ou un client…"
        className="w-full max-w-md rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-brand-500"
      />

      {/* Entonnoir : un bloc par étape du pipeline */}
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
                  {list.map((q) => (
                    <tr key={q.id} onClick={() => open(q)} className="cursor-pointer hover:bg-white/[0.03]">
                      <td className="w-40 px-5 py-3 font-medium text-white">{q.number}</td>
                      <td className="px-5 py-3 text-slate-300">{q.customerName}</td>
                      <td className="w-28 px-5 py-3 text-slate-500">{formatDate(q.issueDate)}</td>
                      <td className="w-32 px-5 py-3 text-right font-semibold text-slate-200">{formatMoney(q.totalHt)}</td>
                      <td className="w-36 px-5 py-3 text-right"><StatusBadge status={q.displayStatus} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
        {quotes.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-10 text-center text-slate-500">Aucun devis</div>
        )}
      </div>
    </div>
  );
}
