import { useState, useEffect } from 'react';
import api from '../utils/api';
import { FileText, Eye, Download, Search } from 'lucide-react';
import InvoicePreview from '../components/InvoicePreview';
import moment from 'moment';
import { toast } from 'react-hot-toast';

export default function InvoiceHistory() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const { data } = await api.get('/api/invoices');
      setInvoices(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (invoice) => {
    try {
      // We need to render it to HTML first to use the existing PDF export
      // For history, usually we'd have a backend-side HTML generator.
      // But here we'll follow the same pattern: open preview then export.
      setSelectedInvoice(invoice);
      setShowPreview(true);
      // Wait for modal to mount then trigger download
      setTimeout(() => {
        const el = document.getElementById('invoice-print-area');
        if (el) {
          api.post('/api/export/pdf', {
            htmlContent: el.innerHTML,
            companyName: invoice.company.name,
            invoiceNo: invoice.invoiceNumber,
            invoiceDate: moment(invoice.invoiceDate).format('YYYY-MM-DD')
          }, { responseType: 'blob' }).then(response => {
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${invoice.company.name.substring(0,10)}_Inv_${invoice.invoiceNumber}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
          });
        }
      }, 1000);
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF');
    }
  };

  const filteredInvoices = invoices.filter(inv => 
    inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.company.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Invoice History</h2>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search invoice or company..."
            className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
          <FileText className="mx-auto mb-4 text-gray-300" size={48} />
          <p>No invoices found. Generate your first invoice to see it here!</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Invoice No</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-4 font-medium text-gray-900">{inv.invoiceNumber}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{moment(inv.invoiceDate).format('DD MMM YYYY')}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{inv.company.name}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900">₹ {inv.total.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter ${
                        inv.status === 'final' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button 
                        onClick={() => { setSelectedInvoice(inv); setShowPreview(true); }}
                        className="inline-flex items-center p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="View Invoice"
                      >
                        <Eye size={18} />
                      </button>
                      <button 
                        onClick={() => handleDownloadPDF(inv)}
                        className="inline-flex items-center p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Download PDF"
                      >
                        <Download size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showPreview && selectedInvoice && (
        <InvoicePreview
          invoiceData={{
            header: {
              invoiceNo: selectedInvoice.invoiceNumber,
              invoiceDate: moment(selectedInvoice.invoiceDate).format('YYYY-MM-DD'),
              deliveryNote: selectedInvoice.deliveryNote,
              eWayBillNo: selectedInvoice.eWayBillNo,
              dispatchFrom: selectedInvoice.dispatchFrom,
              dispatchedThrough: selectedInvoice.dispatchedThrough,
              destination: selectedInvoice.destination,
              termsOfDelivery: selectedInvoice.termsOfDelivery,
              buyersOrderNo: selectedInvoice.buyersOrderNo,
              orderDated: selectedInvoice.orderDated ? moment(selectedInvoice.orderDated).format('YYYY-MM-DD') : ''
            },
            // Note: Consignee and Buyer objects are not included in the 'invoices' response currently
            // A production app would fetch full associations or populate from history.
            // For now, we'll try to reconstruct from savedParty if we fetch it.
            // Since we don't have full associated data in the list, we'll show dummy for party for now or update backend.
            consignee: { partyName: 'Reconstructed', address: 'See database record', stateCode: '', gstin: '' },
            buyer: { partyName: 'Reconstructed', address: 'See database record', stateCode: '', gstin: '' },
            items: JSON.parse(selectedInvoice.lineItemsJSON),
            taxType: selectedInvoice.taxType,
            subtotal: selectedInvoice.subtotal,
            taxAmount: selectedInvoice.taxAmount,
            total: selectedInvoice.total
          }}
          companyData={selectedInvoice.company}
          onClose={() => { setShowPreview(false); setSelectedInvoice(null); }}
          onDownloadPDF={() => handleDownloadPDF(selectedInvoice)}
        />
      )}
    </div>
  );
}
