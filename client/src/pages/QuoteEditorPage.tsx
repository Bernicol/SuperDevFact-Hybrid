import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import type { CustomerSummary, QuoteDetails, QuoteLineRequest } from '../api/types';
import { formatDate, formatMoney } from '../lib/format';

const STEPS: { key: string; label: string }[] = [
  { key: 'Draft', label: 'Brouillon' },
  { key: 'Sent', label: 'Envoyé' },
  { key: 'Accepted', label: 'Accepté' },
  { key: 'Converted', label: 'Facturé' },
];

const PAYMENT_TERMS_OPTIONS = [
  { days: 0, label: 'Comptant' },
  { days: 30, label: '30 jours net' },
  { days: 45, label: '45 jours net' },
  { days: 60, label: '60 jours net' },
];

function emptyLine(): QuoteLineRequest {
  // La désignation est obligatoire côté domaine (une ligne sans nom n'a pas de sens
  // métier) : on pose un texte par défaut modifiable, plutôt qu'une valeur vide rejetée.
  return { description: 'Nouvelle prestation', detail: null, quantity: 1, unit: 'unité', unitPriceHt: 0, discountRatePercent: 0, taxRatePercent: 20 };
}

function CustomerPicker({ onCreate }: { onCreate: (customerId: string) => void }) {
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.customers.search(search || undefined).then(setCustomers);
  }, [search]);

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-8">
      <h1 className="text-2xl font-bold text-white">Nouveau devis</h1>
      <p className="text-slate-400">Sélectionnez un client pour démarrer le devis.</p>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Rechercher un client…"
        className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-brand-500"
      />
      <ul className="divide-y divide-white/5 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
        {customers.map((c) => (
          <li key={c.id} onClick={() => onCreate(c.id)} className="cursor-pointer px-5 py-3 hover:bg-white/[0.05]">
            <p className="font-medium text-white">{c.companyName}</p>
            <p className="text-xs text-slate-500">{c.city} · {c.contactName}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function QuoteEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quote, setQuote] = useState<QuoteDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const isNew = id === 'nouveau';

  // Champs d'édition locale (regroupés puis persistés via le bouton "Enregistrer",
  // comme dans la version desktop).
  const [clientReference, setClientReference] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [validityDays, setValidityDays] = useState(30);
  const [paymentTermsDays, setPaymentTermsDays] = useState(30);
  const [internalNotes, setInternalNotes] = useState('');
  const [clientMessage, setClientMessage] = useState('');
  const [globalDiscountRatePercent, setGlobalDiscountRatePercent] = useState(0);

  const load = (quoteId: string) =>
    api.quotes.get(quoteId).then((dto) => {
      setQuote(dto);
      setClientReference(dto.clientReference ?? '');
      setIssueDate(dto.issueDate);
      setValidityDays(dto.validityDays);
      const matching = PAYMENT_TERMS_OPTIONS.find((o) => dto.paymentTermsLabel.includes(String(o.days)));
      setPaymentTermsDays(matching?.days ?? 30);
      setInternalNotes(dto.internalNotes ?? '');
      setClientMessage(dto.clientMessage ?? '');
      setGlobalDiscountRatePercent(dto.globalDiscountRatePercent);
    });

  useEffect(() => {
    if (!isNew && id) load(id);
  }, [id, isNew]);

  const run = async (action: () => Promise<QuoteDetails>) => {
    try {
      setError(null);
      const result = await action();
      setQuote(result);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleCreate = async (customerId: string) => {
    try {
      const created = await api.quotes.create(customerId);
      navigate(`/devis/${created.id}`, { replace: true });
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const saveAll = async () => {
    if (!quote) return;
    setSaving(true);
    setError(null);
    try {
      await api.quotes.updateGeneralInfo(quote.id, {
        customerId: quote.customer.id,
        issueDate,
        validityDays,
        paymentTermsDays,
        clientReference: clientReference || null,
      });
      await api.quotes.applyDiscount(quote.id, globalDiscountRatePercent);
      const updated = await api.quotes.updateNotes(quote.id, internalNotes || null, clientMessage || null);
      setQuote(updated);
      setSavedAt(new Date());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (isNew) return <CustomerPicker onCreate={handleCreate} />;
  if (!quote) return <div className="p-10 text-slate-500">Chargement…</div>;

  const currentStepIndex = quote.convertedInvoiceId
    ? 3
    : STEPS.findIndex((s) => s.key === quote.status);

  const addLine = () => run(() => api.quotes.addLine(quote.id, emptyLine()));
  const updateLine = (lineId: string, patch: Partial<QuoteLineRequest>) => {
    const line = quote.lines.find((l) => l.id === lineId)!;
    const body: QuoteLineRequest = {
      description: patch.description ?? line.description,
      detail: line.detail,
      quantity: patch.quantity ?? line.quantity,
      unit: patch.unit ?? line.unit,
      unitPriceHt: patch.unitPriceHt ?? line.unitPriceHt,
      discountRatePercent: patch.discountRatePercent ?? line.discountRatePercent,
      taxRatePercent: line.taxRatePercent,
    };
    return run(() => api.quotes.updateLine(quote.id, lineId, body));
  };
  const removeLine = (lineId: string) => run(() => api.quotes.removeLine(quote.id, lineId));

  const isDraft = quote.status === 'Draft';
  const isSent = quote.status === 'Sent';
  const isAccepted = quote.status === 'Accepted';
  const isConverted = !!quote.convertedInvoiceId;
  const customerAddressLine = `${quote.customer.street}, ${quote.customer.postalCode} ${quote.customer.city}`;
  const customerContactLine = quote.customer.contactName
    ? `${quote.customer.contactName} · ${quote.customer.contactEmail}`
    : quote.customer.contactEmail;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-8">
      {/* Frise de statut */}
      <div className="flex overflow-hidden rounded-xl">
        {STEPS.map((step, i) => (
          <div
            key={step.key}
            className={`relative flex-1 px-4 py-3 text-center text-sm font-semibold ${
              i <= currentStepIndex ? 'bg-brand-500 text-white' : 'bg-white/[0.04] text-slate-500'
            }`}
            style={{
              clipPath: i === 0 ? 'polygon(0 0, 92% 0, 100% 50%, 92% 100%, 0 100%)'
                : i === STEPS.length - 1 ? 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 8% 50%)'
                : 'polygon(0 0, 92% 0, 100% 50%, 92% 100%, 0 100%, 8% 50%)',
            }}
          >
            {step.label}
          </div>
        ))}
      </div>

      {error && <div className="rounded-lg bg-rose-400/10 px-4 py-3 text-sm text-rose-300">{error}</div>}

      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500">Devis › {quote.number}</p>
          <h1 className="mt-1 text-2xl font-bold text-white">{quote.number}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {isDraft && (
            <button onClick={saveAll} disabled={saving}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 font-semibold text-slate-200 hover:bg-white/[0.06] disabled:opacity-40">
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          )}
          {isDraft && (
            <button onClick={() => run(() => api.quotes.send(quote.id))} disabled={quote.lines.length === 0}
              className="rounded-xl bg-brand-500 px-4 py-2.5 font-semibold text-white shadow hover:bg-brand-600 disabled:opacity-40">
              Envoyer
            </button>
          )}
          {isSent && (
            <>
              <button onClick={() => run(() => api.quotes.accept(quote.id))}
                className="rounded-xl bg-emerald-500 px-4 py-2.5 font-semibold text-white shadow hover:bg-emerald-600">
                Marquer accepté
              </button>
              <button onClick={() => run(() => api.quotes.decline(quote.id))}
                className="rounded-xl bg-rose-500 px-4 py-2.5 font-semibold text-white shadow hover:bg-rose-600">
                Refuser
              </button>
            </>
          )}
          {isAccepted && !isConverted && (
            <button
              onClick={async () => {
                const invoice = await api.quotes.convertToInvoice(quote.id);
                navigate(`/factures/${invoice.id}`);
              }}
              className="rounded-xl bg-gradient-to-r from-violet-500 to-brand-500 px-4 py-2.5 font-semibold text-white shadow-lg shadow-violet-500/20 hover:opacity-90"
            >
              Transformer en facture
            </button>
          )}
          {isConverted && (
            <button onClick={() => navigate(`/factures/${quote.convertedInvoiceId}`)}
              className="rounded-xl bg-gradient-to-r from-violet-500 to-brand-500 px-4 py-2.5 font-semibold text-white shadow-lg shadow-violet-500/20 hover:opacity-90">
              Voir la facture
            </button>
          )}
        </div>
      </div>

      {savedAt && <p className="text-xs text-emerald-400">Enregistré à {savedAt.toLocaleTimeString('fr-FR')}</p>}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_1fr]">
        {/* Colonne édition */}
        <div className="space-y-6">
          {/* Informations générales */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="mb-4 font-semibold text-white">Informations générales</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">Client</p>
                <p className="mt-1 font-semibold text-white">{quote.customer.companyName}</p>
                <p className="text-sm text-slate-400">{customerAddressLine}</p>
                <p className="text-sm text-slate-400">{customerContactLine}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">Référence client</p>
                <input
                  value={clientReference} disabled={!isDraft}
                  onChange={(e) => setClientReference(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-brand-500 disabled:opacity-50"
                />
              </div>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-6">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">Date du devis</p>
                <input
                  type="date" value={issueDate} disabled={!isDraft}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-brand-500 disabled:opacity-50"
                />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">Validité (jours)</p>
                <input
                  type="number" value={validityDays} disabled={!isDraft}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setValidityDays(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-brand-500 disabled:opacity-50"
                />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">Conditions de paiement</p>
                <select
                  value={paymentTermsDays} disabled={!isDraft}
                  onChange={(e) => setPaymentTermsDays(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-brand-500 disabled:opacity-50"
                >
                  {PAYMENT_TERMS_OPTIONS.map((o) => (
                    <option key={o.days} value={o.days} className="bg-navy-900">{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Lignes */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-white">Lignes de devis</h2>
              {!isConverted && isDraft && (
                <button onClick={addLine} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">
                  + Ajouter une ligne
                </button>
              )}
            </div>
            <div className="grid grid-cols-[1fr_70px_90px_100px_80px_100px_32px] gap-2 text-xs font-semibold uppercase text-slate-500">
              <span>Désignation</span><span>Qté</span><span>Unité</span><span>Prix HT</span><span>Remise %</span><span className="text-right">Total HT</span><span />
            </div>
            {quote.lines.map((line) => (
              <div key={line.id} className="grid grid-cols-[1fr_70px_90px_100px_80px_100px_32px] items-center gap-2 border-t border-white/5 py-2 text-sm">
                <input
                  defaultValue={line.description}
                  disabled={isConverted}
                  onBlur={(e) => e.target.value !== line.description && updateLine(line.id, { description: e.target.value })}
                  className="rounded border-0 bg-transparent px-1 py-1 text-slate-200 focus:bg-white/[0.05] focus:outline-none"
                />
                <input
                  type="number" defaultValue={line.quantity} disabled={isConverted}
                  onFocus={(e) => e.target.select()}
                  onBlur={(e) => updateLine(line.id, { quantity: Number(e.target.value) })}
                  className="rounded border-0 bg-transparent px-1 py-1 text-slate-200 focus:bg-white/[0.05] focus:outline-none"
                />
                <input
                  defaultValue={line.unit} disabled={isConverted}
                  onFocus={(e) => e.target.select()}
                  onBlur={(e) => updateLine(line.id, { unit: e.target.value })}
                  className="rounded border-0 bg-transparent px-1 py-1 text-slate-200 focus:bg-white/[0.05] focus:outline-none"
                />
                <input
                  type="number" defaultValue={line.unitPriceHt} disabled={isConverted}
                  onFocus={(e) => e.target.select()}
                  onBlur={(e) => updateLine(line.id, { unitPriceHt: Number(e.target.value) })}
                  className="rounded border-0 bg-transparent px-1 py-1 text-slate-200 focus:bg-white/[0.05] focus:outline-none"
                />
                <input
                  type="number" defaultValue={line.discountRatePercent} disabled={isConverted}
                  onFocus={(e) => e.target.select()}
                  onBlur={(e) => updateLine(line.id, { discountRatePercent: Number(e.target.value) })}
                  className="rounded border-0 bg-transparent px-1 py-1 text-slate-200 focus:bg-white/[0.05] focus:outline-none"
                />
                <span className="text-right font-semibold text-white">{formatMoney(line.lineTotalHt)}</span>
                {!isConverted && isDraft && (
                  <button onClick={() => removeLine(line.id)} className="text-slate-600 hover:text-rose-400">✕</button>
                )}
              </div>
            ))}

            {/* Totaux */}
            <div className="ml-auto mt-4 w-72 space-y-1 text-sm">
              <div className="flex justify-between text-slate-400"><span>Total HT</span><span>{formatMoney(quote.totals.subtotalHt)}</span></div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Remise globale %</span>
                <input
                  type="number" value={globalDiscountRatePercent} disabled={!isDraft}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setGlobalDiscountRatePercent(Number(e.target.value))}
                  className="w-20 rounded border border-white/10 bg-white/[0.03] px-2 py-1 text-right text-sm text-white outline-none focus:border-brand-500 disabled:opacity-50"
                />
              </div>
              <div className="flex justify-between text-slate-400"><span>Total HT net</span><span>{formatMoney(quote.totals.netHt)}</span></div>
              <div className="flex justify-between text-slate-400"><span>TVA</span><span>{formatMoney(quote.totals.totalTax)}</span></div>
              <div className="flex justify-between border-t border-white/10 pt-2 text-base font-bold text-white">
                <span>Total TTC</span><span>{formatMoney(quote.totals.totalTtc)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="grid grid-cols-2 gap-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div>
              <h2 className="mb-2 font-semibold text-white">Notes internes</h2>
              <textarea
                value={internalNotes} disabled={!isDraft}
                onChange={(e) => setInternalNotes(e.target.value)}
                rows={4}
                className="w-full resize-none rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-brand-500 disabled:opacity-50"
              />
            </div>
            <div>
              <h2 className="mb-2 font-semibold text-white">Message pour le client</h2>
              <textarea
                value={clientMessage} disabled={!isDraft}
                onChange={(e) => setClientMessage(e.target.value)}
                rows={4}
                className="w-full resize-none rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-brand-500 disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        {/* Aperçu live du document : vraie mise en page A4 (feuille posée sur le cockpit sombre) */}
        <div className="flex flex-col items-center">
          <p className="mb-3 self-start text-xs font-semibold uppercase tracking-wider text-slate-500">Aperçu du document</p>
          <div
            className="w-full bg-white text-slate-900 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)]"
            style={{ aspectRatio: '210 / 297', padding: '8%' }}
          >
            {/* En-tête */}
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
              <div>
                <p className="text-xl font-black leading-none">
                  SOLARIS<span className="text-brand-600"> INSTALLATION</span>
                </p>
                <p className="mt-2 text-[11px] leading-snug text-slate-500">4 rue du Soleil, 33700 Mérignac</p>
                <p className="text-[11px] leading-snug text-slate-500">contact@solaris-installation.fr</p>
                <p className="text-[11px] leading-snug text-slate-500">SIRET : 812 345 678 00019</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black tracking-wide text-slate-900">DEVIS</p>
                <p className="mt-1 text-sm font-semibold text-slate-700">{quote.number}</p>
                <p className="mt-2 text-[11px] text-slate-500">Date d'émission : {formatDate(quote.issueDate)}</p>
                <p className="text-[11px] text-slate-500">Valable jusqu'au : {formatDate(quote.expiryDate)}</p>
              </div>
            </div>

            {/* Destinataire */}
            <div className="mt-6 flex justify-between text-[11px]">
              <div>
                <p className="font-semibold uppercase tracking-wide text-slate-400">Adressé à</p>
                <p className="mt-1 text-sm font-bold text-slate-900">{quote.customer.companyName}</p>
                <p className="text-slate-600">{customerAddressLine}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold uppercase tracking-wide text-slate-400">Conditions</p>
                <p className="mt-1 text-slate-600">{quote.paymentTermsLabel}</p>
                {quote.clientReference && <p className="text-slate-600">Réf. : {quote.clientReference}</p>}
              </div>
            </div>

            {/* Tableau des lignes */}
            <table className="mt-6 w-full border-collapse text-[11px]">
              <thead>
                <tr className="border-b border-slate-900 text-left uppercase tracking-wide text-slate-500">
                  <th className="py-1.5 font-semibold">Désignation</th>
                  <th className="py-1.5 text-right font-semibold">Qté</th>
                  <th className="py-1.5 text-right font-semibold">Prix HT</th>
                  <th className="py-1.5 text-right font-semibold">Total HT</th>
                </tr>
              </thead>
              <tbody>
                {quote.lines.map((line) => (
                  <tr key={line.id} className="border-b border-slate-100">
                    <td className="py-2 pr-2 font-medium text-slate-800">{line.description || '—'}</td>
                    <td className="py-2 text-right text-slate-600">{line.quantity} {line.unit}</td>
                    <td className="py-2 text-right text-slate-600">{formatMoney(line.unitPriceHt)}</td>
                    <td className="py-2 text-right font-semibold text-slate-900">{formatMoney(line.lineTotalHt)}</td>
                  </tr>
                ))}
                {quote.lines.length === 0 && (
                  <tr><td colSpan={4} className="py-6 text-center text-slate-400">Aucune ligne pour l'instant</td></tr>
                )}
              </tbody>
            </table>

            {/* Totaux */}
            <div className="ml-auto mt-4 w-1/2 space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-500"><span>Total HT</span><span>{formatMoney(quote.totals.subtotalHt)}</span></div>
              <div className="flex justify-between text-slate-500"><span>Remise</span><span>-{formatMoney(quote.totals.globalDiscountAmount)}</span></div>
              <div className="flex justify-between text-slate-500"><span>TVA</span><span>{formatMoney(quote.totals.totalTax)}</span></div>
              <div className="flex justify-between border-t-2 border-slate-900 pt-1.5 text-sm font-black text-slate-900">
                <span>Total TTC</span><span>{formatMoney(quote.totals.totalTtc)}</span>
              </div>
            </div>

            {clientMessage && (
              <p className="mt-8 whitespace-pre-wrap border-t border-slate-100 pt-4 text-[11px] italic text-slate-500">{clientMessage}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
