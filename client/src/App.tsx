import { Route, HashRouter, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { InvoicesListPage } from './pages/InvoicesListPage';
import { InvoiceViewerPage } from './pages/InvoiceViewerPage';
import { PaymentsListPage } from './pages/PaymentsListPage';
import { QuoteEditorPage } from './pages/QuoteEditorPage';
import { QuotesListPage } from './pages/QuotesListPage';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="devis" element={<QuotesListPage />} />
          <Route path="devis/:id" element={<QuoteEditorPage />} />
          <Route path="factures" element={<InvoicesListPage />} />
          <Route path="factures/:id" element={<InvoiceViewerPage />} />
          <Route path="paiements" element={<PaymentsListPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
