const STYLES: Record<string, string> = {
  Draft: 'bg-slate-400/10 text-slate-300',
  Sent: 'bg-blue-400/10 text-blue-300',
  Accepted: 'bg-emerald-400/10 text-emerald-300',
  Declined: 'bg-rose-400/10 text-rose-300',
  Expired: 'bg-slate-400/10 text-slate-400',
  Converted: 'bg-violet-400/10 text-violet-300',
  PartiallyPaid: 'bg-amber-400/10 text-amber-300',
  Paid: 'bg-emerald-400/10 text-emerald-300',
  Cancelled: 'bg-rose-400/10 text-rose-300',
  Overdue: 'bg-rose-400/10 text-rose-300',
};

const LABELS: Record<string, string> = {
  Draft: 'Brouillon',
  Sent: 'Envoyé',
  Accepted: 'Accepté',
  Declined: 'Refusé',
  Expired: 'Expiré',
  Converted: 'Facturé',
  PartiallyPaid: 'Partiellement payée',
  Paid: 'Payée',
  Cancelled: 'Annulée',
  Overdue: 'En retard',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${STYLES[status] ?? 'bg-slate-400/10 text-slate-300'}`}>
      {LABELS[status] ?? status}
    </span>
  );
}
