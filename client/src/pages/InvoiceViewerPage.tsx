import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import type { InvoiceDetails, PaymentMethod } from '../api/types';
import { StatusBadge } from '../components/StatusBadge';
import { formatDate, formatMoney } from '../lib/format';

export function InvoiceViewerPage() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState<InvoiceDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('BankTransfer');
  const [reference, setReference] = useState('');

  const load = () => id && api.invoices.get(id).then(setInvoice);

  useEffect(() => {
    load();
  }, [id]);

  const recordPayment = async () => {
    if (!invoice || !amount) return;
    try {
      setError(null);
      const updated = await api.invoices.recordPayment(invoice.id, {
        amount: Number(amount),
        paymentDate: new Date().toISOString().slice(0, 10),
        method,
        reference: reference || null,
      });
      setInvoice(updated);
      setAmount('');
      setReference('');
    } catch (e) {
      setError((e as Error).message);
    }
  };

  if (!invoice) return <div className="p-10 text-slate-500">Chargement…</div>;

  const isPaid = invoice.status === 'Paid';

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-8">
      {/* Frise : une facture est déjà "Facturée", elle ne peut que devenir "Payée" */}
      <div className="flex overflow-hidden rounded-xl">
        <div
          className="relative flex-1 bg-brand-500 px-4 py-3 text-center text-sm font-semibold text-white"
          style={{ clipPath: 'polygon(0 0, 92% 0, 100% 50%, 92% 100%, 0 100%)' }}
        >
          Facturé
        </div>
        <div
          className={`relative flex-1 px-4 py-3 text-center text-sm font-semibold ${isPaid ? 'bg-brand-500 text-white' : 'bg-white/[0.04] text-slate-500'}`}
          style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 8% 50%)' }}
        >
          Payé
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500">Facture</p>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{invoice.number}</h1>
            <StatusBadge status={invoice.isOverdue ? 'Overdue' : invoice.status} />
          </div>
        </div>
      </div>

      {error && <div className="rounded-lg bg-rose-400/10 px-4 py-3 text-sm text-rose-300">{error}</div>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.35fr_1fr]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="mb-3 font-semibold text-white">Informations</h2>
            <div className="grid grid-cols-2 gap-6 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">Client</p>
                <p className="mt-1 font-semibold text-white">{invoice.customer.companyName}</p>
                <p className="text-slate-400">{invoice.customer.street}, {invoice.customer.postalCode} {invoice.customer.city}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">Échéance</p>
                <p className="mt-1 text-white">{formatDate(invoice.dueDate)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="mb-3 font-semibold text-white">Lignes de facture</h2>
            <div className="mb-2 grid grid-cols-[1fr_60px_90px_90px_100px] gap-2 text-xs font-semibold uppercase text-slate-500">
              <span>Désignation</span><span>Qté</span><span>Unité</span><span>Prix HT</span><span className="text-right">Total HT</span>
            </div>
            {invoice.lines.map((line) => (
              <div key={line.id} className="grid grid-cols-[1fr_60px_90px_90px_100px] gap-2 border-t border-white/5 py-2 text-sm">
                <span className="text-slate-200">{line.description}</span>
                <span className="text-slate-400">{line.quantity}</span>
                <span className="text-slate-400">{line.unit}</span>
                <span className="text-slate-400">{formatMoney(line.unitPriceHt)}</span>
                <span className="text-right font-semibold text-white">{formatMoney(line.lineTotalHt)}</span>
              </div>
            ))}

            <div className="ml-auto mt-4 w-72 space-y-1 text-sm">
              <div className="flex justify-between text-slate-400"><span>Total HT</span><span>{formatMoney(invoice.totals.subtotalHt)}</span></div>
              <div className="flex justify-between text-slate-400"><span>TVA</span><span>{formatMoney(invoice.totals.totalTax)}</span></div>
              <div className="flex justify-between border-t border-white/10 pt-2 text-base font-bold text-white"><span>Total TTC</span><span>{formatMoney(invoice.totals.totalTtc)}</span></div>
              <div className="flex justify-between pt-2 text-slate-400"><span>Déjà payé</span><span className="text-emerald-400">{formatMoney(invoice.amountPaid)}</span></div>
              <div className="flex justify-between font-bold text-white"><span>Solde restant</span><span>{formatMoney(invoice.balance)}</span></div>
            </div>
          </div>

          {invoice.balance > 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="mb-3 font-semibold text-white">Enregistrer un paiement</h2>
              <div className="grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500">Montant</p>
                  <input
                    type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500">Moyen</p>
                  <select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-brand-500">
                    <option value="BankTransfer" className="bg-navy-900">Virement</option>
                    <option value="Check" className="bg-navy-900">Chèque</option>
                    <option value="Card" className="bg-navy-900">Carte</option>
                    <option value="Cash" className="bg-navy-900">Espèces</option>
                  </select>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500">Référence</p>
                  <input
                    value={reference} onChange={(e) => setReference(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-brand-500"
                  />
                </div>
                <button onClick={recordPayment} className="rounded-lg bg-brand-500 px-4 py-2.5 font-semibold text-white hover:bg-brand-600">
                  Enregistrer
                </button>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="mb-3 font-semibold text-white">Historique des paiements</h2>
            {invoice.payments.length === 0 && <p className="text-sm text-slate-500">Aucun paiement pour l'instant.</p>}
            <ul className="divide-y divide-white/5">
              {invoice.payments.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-slate-400">{formatDate(p.paymentDate)} · {p.method}{p.reference ? ` · ${p.reference}` : ''}</span>
                  <span className="font-semibold text-emerald-400">{formatMoney(p.amount)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="h-fit rounded-2xl bg-gradient-to-br from-violet-500/15 via-brand-500/10 to-transparent border border-white/10 p-6">
          <p className="text-sm text-slate-300">Cette facture provient d'un devis accepté.</p>
          <p className="mt-2 text-sm text-slate-400">
            Les lignes ne peuvent plus être modifiées : seul l'enregistrement d'un paiement fait progresser son statut.
          </p>
        </div>
      </div>
    </div>
  );
}
