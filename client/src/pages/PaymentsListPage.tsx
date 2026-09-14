import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { PaymentListItem } from '../api/types';
import { formatDate, formatMoney } from '../lib/format';

const METHOD_LABELS: Record<string, string> = {
  BankTransfer: 'Virement',
  Check: 'Chèque',
  Card: 'Carte',
  Cash: 'Espèces',
};

export function PaymentsListPage() {
  const [payments, setPayments] = useState<PaymentListItem[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.payments.list().then(setPayments);
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-400">Pilotage</p>
        <h1 className="mt-1 text-2xl font-bold text-white">Paiements</h1>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Facture</th>
              <th className="px-5 py-3 font-medium">Client</th>
              <th className="px-5 py-3 font-medium">Moyen</th>
              <th className="px-5 py-3 font-medium">Référence</th>
              <th className="px-5 py-3 font-medium">Montant</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {payments.map((p) => (
              <tr key={p.id} onClick={() => navigate(`/factures/${p.invoiceId}`)} className="cursor-pointer hover:bg-white/[0.03]">
                <td className="px-5 py-3 text-slate-500">{formatDate(p.paymentDate)}</td>
                <td className="px-5 py-3 font-medium text-white">{p.invoiceNumber}</td>
                <td className="px-5 py-3 text-slate-300">{p.customerName}</td>
                <td className="px-5 py-3 text-slate-300">{METHOD_LABELS[p.method] ?? p.method}</td>
                <td className="px-5 py-3 text-slate-500">{p.reference ?? '—'}</td>
                <td className="px-5 py-3 font-semibold text-emerald-400">{formatMoney(p.amount)}</td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-500">Aucun paiement enregistré</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
