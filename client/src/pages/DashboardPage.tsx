import {
  Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis,
} from 'recharts';
import {
  Bell, CalendarClock, CheckCircle2, FileEdit, FileText, Plus, Send, Sparkles, XCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { InvoiceSummary, PaymentListItem, QuoteSummary } from '../api/types';
import { formatMoney } from '../lib/format';

// Simulation volontaire : un aperçu de ce que pourrait donner une gestion de rappels/notes
// personnelles pour l'utilisateur, pas un vrai module métier connecté à l'API.
const TASK_PULSE_ITEMS = [
  { icon: Bell, text: 'Relancer Camping du Lac Bleu (devis en attente)', color: 'text-blue-300' },
  { icon: FileEdit, text: 'Revoir les prix sur la facture FAC-2026-0003', color: 'text-amber-300' },
  { icon: CalendarClock, text: 'Organiser une réunion sur la TVA installation', color: 'text-violet-300' },
  { icon: FileEdit, text: 'Préparer le devis Résidence Les Tilleuls', color: 'text-emerald-300' },
];

const STATUS_LABELS: Record<string, string> = {
  Draft: 'Brouillon', Sent: 'Envoyé', Accepted: 'Accepté', Declined: 'Refusé', Expired: 'Expiré', Converted: 'Facturé',
};

type Period = '30j' | 'trimestre' | 'annee';
const PERIOD_DAYS: Record<Period, number> = { '30j': 30, trimestre: 90, annee: 365 };

function DarkTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-[#0d1220] px-3 py-2 text-xs shadow-2xl">
      <p className="text-slate-400">{label}</p>
      <p className="font-semibold text-white">{formatMoney(payload[0].value)}</p>
    </div>
  );
}

export function DashboardPage() {
  const [quotes, setQuotes] = useState<QuoteSummary[]>([]);
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);
  const [payments, setPayments] = useState<PaymentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('30j');
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([api.quotes.search(), api.invoices.search(), api.payments.list()]).then(([q, i, p]) => {
      setQuotes(q);
      setInvoices(i);
      setPayments(p);
      setLoading(false);
    });
  }, []);

  const cashCollected = useMemo(() => payments.reduce((s, p) => s + p.amount, 0), [payments]);

  const revenueSeries = useMemo(() => {
    const days = PERIOD_DAYS[period];
    const start = new Date();
    start.setDate(start.getDate() - days);
    const buckets = new Map<string, number>();
    const bucketCount = period === '30j' ? days : period === 'trimestre' ? 13 : 12;
    const bucketSizeDays = days / bucketCount;

    const points: { label: string; value: number }[] = [];
    let cumulative = 0;
    const sorted = [...payments]
      .filter((p) => new Date(p.paymentDate) >= start)
      .sort((a, b) => a.paymentDate.localeCompare(b.paymentDate));

    for (let i = 0; i < bucketCount; i++) {
      const bucketEnd = new Date(start.getTime() + (i + 1) * bucketSizeDays * 86400000);
      const inBucket = sorted.filter((p) => new Date(p.paymentDate) <= bucketEnd);
      cumulative = inBucket.reduce((s, p) => s + p.amount, 0);
      points.push({
        label: bucketEnd.toLocaleDateString('fr-FR', period === 'annee' ? { month: 'short' } : { day: '2-digit', month: '2-digit' }),
        value: cumulative,
      });
    }
    void buckets;
    return points;
  }, [payments, period]);

  const conversionRate = useMemo(() => {
    if (quotes.length === 0) return 0;
    const eligible = quotes.filter((q) => q.status !== 'Draft');
    if (eligible.length === 0) return 0;
    const converted = eligible.filter((q) => q.convertedInvoiceId).length;
    return Math.round((converted / eligible.length) * 1000) / 10;
  }, [quotes]);

  const statRow = useMemo(() => {
    const bucket = (status: string) => {
      const matching = quotes.filter((q) => q.status === status);
      return { count: matching.length, total: matching.reduce((s, q) => s + q.totalHt, 0) };
    };
    return [
      { label: 'Brouillons', icon: FileText, color: 'text-slate-400', ...bucket('Draft') },
      { label: 'Envoyés', icon: Send, color: 'text-blue-400', ...bucket('Sent') },
      { label: 'Acceptés', icon: CheckCircle2, color: 'text-emerald-400', ...bucket('Accepted') },
      { label: 'Refusés', icon: XCircle, color: 'text-rose-400', ...bucket('Declined') },
    ];
  }, [quotes]);

  const activity = useMemo(() => {
    type Item = { date: string; label: string; sub: string; amount: number; color: string };
    const items: Item[] = [
      ...quotes.map((q) => ({
        date: q.issueDate, label: `${q.number} · ${q.customerName}`, sub: STATUS_LABELS[q.displayStatus] ?? q.displayStatus, amount: q.totalHt,
        color: q.convertedInvoiceId ? 'bg-violet-400' : q.status === 'Accepted' ? 'bg-emerald-400' : q.status === 'Sent' ? 'bg-blue-400' : 'bg-slate-500',
      })),
      ...payments.map((p) => ({
        date: p.paymentDate, label: `Paiement · ${p.customerName}`, sub: p.invoiceNumber, amount: p.amount, color: 'bg-emerald-400',
      })),
    ];
    return items.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7);
  }, [quotes, payments]);

  if (loading) return <div className="flex min-h-screen items-center justify-center text-slate-500">Chargement…</div>;

  const donutData = [{ value: conversionRate }, { value: 100 - conversionRate }];

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-8">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-400">Cockpit commercial / Vue d'ensemble</p>
          <h1 className="mt-2 text-3xl font-bold leading-tight text-white">
            Bonjour, <span className="text-slate-400">les affaires avancent.</span>
          </h1>
          <p className="mt-2 text-sm text-slate-500">{quotes.length} devis suivis · {invoices.length} factures émises</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/factures')}
            className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.06]">
            Voir les factures
          </button>
          <button onClick={() => navigate('/devis/nouveau')}
            className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition hover:bg-brand-600">
            <Plus size={16} /> Nouveau devis
          </button>
        </div>
      </div>

      {/* Hero : CA + conversion */}
      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] lg:grid-cols-[1fr_260px]">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Chiffre d'affaires encaissé</p>
              <p className="mt-1 text-3xl font-bold text-white">{formatMoney(cashCollected)}</p>
            </div>
            <div className="flex rounded-lg bg-white/[0.04] p-1 text-xs">
              {(['30j', 'trimestre', 'annee'] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`rounded-md px-2.5 py-1.5 font-medium transition ${period === p ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  {p === '30j' ? '30 jours' : p === 'trimestre' ? 'Trimestre' : 'Année'}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={190}>
            <AreaChart data={revenueSeries} margin={{ top: 20, left: 0, right: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} minTickGap={30} />
              <Tooltip content={<DarkTooltip />} />
              <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2.5} fill="url(#revenue-fill)" dot={false} animationDuration={700} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-col items-center justify-center gap-2 bg-white/[0.02] p-6">
          <p className="text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Taux de transformation</p>
          <div className="relative flex h-32 w-32 items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={donutData} dataKey="value" innerRadius={48} outerRadius={62} startAngle={90} endAngle={-270} stroke="none">
                  <Cell fill="#3b82f6" />
                  <Cell fill="rgba(255,255,255,0.06)" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">{conversionRate}%</span>
            </div>
          </div>
          <p className="text-center text-xs text-slate-500">Devis envoyés transformés en facture</p>
        </div>
      </div>

      {/* Ligne de stats fine */}
      <div className="grid grid-cols-2 divide-x divide-white/5 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] md:grid-cols-4">
        {statRow.map((s) => (
          <div key={s.label} className="flex items-center gap-3 px-6 py-5">
            <s.icon size={18} className={s.color} />
            <div>
              <p className="text-lg font-bold text-white">{String(s.count).padStart(2, '0')}</p>
              <p className="text-xs text-slate-500">{s.label} · {formatMoney(s.total)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Activité + KPI */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Flux · temps réel</p>
              <h2 className="mt-1 font-semibold text-white">Activité récente</h2>
            </div>
          </div>
          <ul className="divide-y divide-white/5">
            {activity.map((item, idx) => (
              <li
                key={idx}
                onClick={() => {
                  const quote = quotes.find((q) => item.label.includes(q.number));
                  if (quote) navigate(quote.convertedInvoiceId ? `/factures/${quote.convertedInvoiceId}` : `/devis/${quote.id}`);
                }}
                className="flex cursor-pointer items-center gap-3 py-3 hover:bg-white/[0.02]"
              >
                <span className={`h-2 w-2 shrink-0 rounded-full ${item.color}`} />
                <div className="flex-1">
                  <p className="text-sm text-slate-200">{item.label}</p>
                  <p className="text-xs text-slate-500">{item.sub}</p>
                </div>
                <span className="text-sm font-semibold text-slate-300">{formatMoney(item.amount)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-brand-400" />
              <h2 className="font-semibold text-white">TaskPulse</h2>
            </div>
            <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">Aperçu</span>
          </div>
          <div className="space-y-2">
            {TASK_PULSE_ITEMS.map((task, idx) => (
              <motion.div
                key={task.text}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + idx * 0.12, duration: 0.35, ease: 'easeOut' }}
                whileHover={{ x: 4, transition: { duration: 0.2 } }}
                className="flex cursor-default items-center gap-2.5 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2.5 text-xs text-slate-300 transition-colors hover:border-white/10 hover:bg-white/[0.06]"
              >
                <task.icon size={14} className={`shrink-0 ${task.color}`} />
                <span className="leading-snug">{task.text}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
