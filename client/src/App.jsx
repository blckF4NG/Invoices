import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import DashboardLayout from './components/DashboardLayout';
import GenerateInvoice from './pages/GenerateInvoice';
import ManageCompanies from './pages/ManageCompanies';
import InvoiceHistory from './pages/InvoiceHistory';
import Settings from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/invoice/new" replace />} />
          <Route path="invoice/new" element={<GenerateInvoice />} />
          <Route path="companies" element={<ManageCompanies />} />
          <Route path="invoice/history" element={<InvoiceHistory />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App;
