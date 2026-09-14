import { LayoutGrid, CreditCard, FileText, Receipt } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { api } from '../api/client';

type CountKey = 'quotes' | 'invoices' | null;
const NAV_ITEMS: { to: string; label: string; icon: typeof LayoutGrid; end: boolean; countKey: CountKey }[] = [
  { to: '/', label: "Vue d'ensemble", icon: LayoutGrid, end: true, countKey: null },
  { to: '/devis', label: 'Devis', icon: FileText, end: false, countKey: 'quotes' },
  { to: '/factures', label: 'Factures', icon: Receipt, end: false, countKey: 'invoices' },
  { to: '/paiements', label: 'Paiements', icon: CreditCard, end: false, countKey: null },
];

export function Layout() {
  const [counts, setCounts] = useState<{ quotes: number; invoices: number }>({ quotes: 0, invoices: 0 });

  useEffect(() => {
    Promise.all([api.quotes.search(), api.invoices.search()]).then(([q, i]) =>
      setCounts({ quotes: q.length, invoices: i.length }),
    );
  }, []);

  return (
    <div className="flex min-h-screen bg-[#070a12]">
      <aside className="flex w-60 shrink-0 flex-col border-r border-white/5 bg-[#0a0e18]">
        <div className="flex flex-col items-center px-2 pb-4 pt-6">
          <img src="/logo.png" alt="Solaris Installation" className="w-full object-contain drop-shadow-[0_0_30px_rgba(59,130,246,0.25)]" />
          <p className="mt-2 text-sm font-semibold text-white">Solaris Installation</p>
          <p className="text-[11px] text-slate-600">v1.0.0</p>
        </div>

        <p className="px-5 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-600">Espace de travail</p>

        <nav className="flex flex-1 flex-col gap-0.5 px-3">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const count = item.countKey ? counts[item.countKey] : null;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive ? 'bg-white/[0.06] text-white' : 'text-slate-400 hover:bg-white/[0.03] hover:text-slate-200'
                  }`
                }
              >
                <Icon size={16} strokeWidth={1.75} />
                <span className="flex-1">{item.label}</span>
                {count !== null && count > 0 && <span className="text-xs text-slate-600">{count}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className="m-3 rounded-xl border border-white/5 bg-white/[0.02] p-4 text-xs text-slate-400">
          <p className="mb-1 font-semibold text-slate-300">💡 Conseil du jour</p>
          <p>Relancez vos devis envoyés depuis plus de 7 jours pour accélérer leur transformation en facture.</p>
        </div>

        <div className="flex items-center gap-2 border-t border-white/5 px-5 py-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500/20 text-xs font-semibold text-brand-300">SI</div>
          <div className="text-xs">
            <p className="font-medium text-slate-200">Studio Solaris</p>
            <p className="text-slate-600">Compte démo</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
