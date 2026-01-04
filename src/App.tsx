import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { Login } from './components/Login';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { TransactionsNew } from './pages/TransactionsNew';
import { Recurring } from './pages/Recurring';
import { Stats } from './pages/Stats';
import { Taxes } from './pages/Taxes';
import { TaxReport } from './pages/TaxReport';
import { Settings } from './pages/Settings';
import ImportCsv from './pages/ImportCsv';

function App() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/transactions" element={<TransactionsNew />} />
          <Route path="/import-csv" element={<ImportCsv />} />
          <Route path="/recurring" element={<Recurring />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/taxes" element={<Taxes />} />
          <Route path="/tax-report" element={<TaxReport />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
