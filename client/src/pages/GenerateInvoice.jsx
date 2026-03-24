import { useState, useEffect } from 'react';
import api from '../utils/api';
import AutocompleteInput from '../components/AutocompleteInput';
import LineItemsTable from '../components/LineItemsTable';
import { numberToWords } from '../utils/numberToWords';
import InvoicePreview from '../components/InvoicePreview';
import { toast } from 'react-hot-toast';

export default function GenerateInvoice() {
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  
  const [header, setHeader] = useState({
    invoiceNo: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    deliveryNote: '',
    eWayBillNo: '',
    dispatchFrom: '',
    dispatchedThrough: '',
    destination: '',
    termsOfDelivery: '',
    buyersOrderNo: '',
    orderDated: ''
  });

  const [consignee, setConsignee] = useState({
    partyName: '', address: '', stateCode: '', gstin: ''
  });

  const [buyer, setBuyer] = useState({
    partyName: '', address: '', stateCode: '', gstin: ''
  });
  
  const [sameAsConsignee, setSameAsConsignee] = useState(false);

  const [items, setItems] = useState([
    { id: 1, description: '', hsnCode: '', gstRate: '18_igst', quantity: 1, unit: 'Nos.', rate: 0 }
  ]);

  const [showPreview, setShowPreview] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [wordLoading, setWordLoading] = useState(false);

  useEffect(() => {
    // Fetch companies for dropdown
    api.get('/api/companies')
      .then(res => setCompanies(res.data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (sameAsConsignee) {
      setBuyer({ ...consignee });
    }
  }, [sameAsConsignee, consignee]);

  const handleHeaderChange = (e) => {
    setHeader({ ...header, [e.target.name]: e.target.value });
  };

  const currentCompanyObj = companies.find(c => c.id.toString() === selectedCompany);
  let isSameState = currentCompanyObj && currentCompanyObj.stateCode === buyer.stateCode;
  
  const overrideCgst = items.some(i => i.gstRate && i.gstRate.toString().includes('_cgst'));
  const overrideIgst = items.some(i => i.gstRate && i.gstRate.toString().includes('_igst'));
  
  if (overrideCgst) isSameState = true;
  if (overrideIgst) isSameState = false;

  // Totals calculations
  let taxableValue = 0;
  let totalTax = 0;
  
  const calculatedItems = items.map(item => {
    const amount = Math.floor((parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0));
    taxableValue += amount;
    const tax = Math.floor(amount * ((parseFloat(item.gstRate) || 0) / 100));
    totalTax += tax;
    return { ...item, amount, tax };
  });

  const grandTotal = taxableValue + totalTax;

  const handleSaveInvoice = async (status = 'draft') => {
    const payload = {
      companyId: parseInt(selectedCompany),
      status,
      header,
      consignee,
      buyer,
      items: calculatedItems,
      taxType: isSameState ? 'CGST_SGST' : 'IGST',
      subtotal: taxableValue,
      taxAmount: totalTax,
      total: grandTotal
    };
    
    try {
      await api.post('/api/invoices', payload);
      toast.success(`Invoice ${status === 'draft' ? 'saved as draft' : 'generated'} successfully!`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to save invoice');
    }
  };

  const exportPDFFromPreview = async () => {
    const el = document.getElementById('invoice-print-area');
    if (!el) return;
    setPdfLoading(true);
    try {
      const response = await api.post('/api/export/pdf', {
        htmlContent: el.innerHTML,
        companyName: currentCompanyObj.name,
        invoiceNo: header.invoiceNo || 'Draft',
        invoiceDate: header.invoiceDate
      }, { 
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const shortName = currentCompanyObj.name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
      link.setAttribute('download', `${shortName}_Invoice_${header.invoiceNo || 'Draft'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
    } finally {
      setPdfLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!currentCompanyObj) {
      toast.error('Please select a company first!');
      return;
    }
    // Automatically open preview then export
    setShowPreview(true);
    setTimeout(exportPDFFromPreview, 500);
  };

  const handleExportWord = async () => {
    if (!currentCompanyObj) return;
    setWordLoading(true);
    try {
      const payload = {
        companyId: parseInt(selectedCompany),
        status: 'draft',
        header, consignee, buyer, items: calculatedItems, 
        taxType: isSameState ? 'CGST_SGST' : 'IGST', 
        subtotal: taxableValue, taxAmount: totalTax, total: grandTotal
      };
      const response = await api.post('/api/export/word', {
        invoiceData: payload,
        companyData: currentCompanyObj
      });
      
      const { fileName, fileData } = response.data;
      const byteCharacters = atob(fileData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
    } finally {
      setWordLoading(false);
    }
  };

  return (
    <div className="pb-12 max-w-7xl mx-auto">
      <div className="flex flex-wrap gap-3 justify-between items-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Generate New Invoice</h2>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => handleSaveInvoice('draft')} className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium shadow-sm transition-colors text-sm">
            Save Draft
          </button>
          <button onClick={() => {
            if (!currentCompanyObj) {
              toast.error('Please select a company first!');
              return;
            }
            setShowPreview(true);
          }} className="bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded-lg font-medium shadow-sm transition-colors text-sm">
            Preview Invoice
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Step 1: Select Company</h3>
        </div>
        <div className="p-6">
          <select 
            value={selectedCompany} 
            onChange={(e) => setSelectedCompany(e.target.value)}
            className="w-full md:w-1/2 rounded-md border-gray-300 shadow-sm p-2.5 border focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">-- Select a Company --</option>
            {companies.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.gstin})</option>
            ))}
          </select>
          {currentCompanyObj && (
            <div className="mt-4 p-4 bg-blue-50 rounded-md border border-blue-100 text-sm">
              <p className="font-semibold text-blue-900">{currentCompanyObj.name}</p>
              <p className="text-blue-800">{currentCompanyObj.address}</p>
              <p className="text-blue-800">State: <span className="font-medium">{currentCompanyObj.stateCode}</span> | GSTIN: <span className="font-medium">{currentCompanyObj.gstin}</span></p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Step 2: Invoice Header Details</h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Invoice No</label>
            <AutocompleteInput name="invoiceNo" value={header.invoiceNo} onChange={handleHeaderChange} endpoint="fields/invoiceNo" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Invoice Date</label>
            <input type="date" name="invoiceDate" value={header.invoiceDate} onChange={handleHeaderChange} className="w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Delivery Note</label>
            <AutocompleteInput name="deliveryNote" value={header.deliveryNote} onChange={handleHeaderChange} endpoint="fields/deliveryNote" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">eWay Bill No.</label>
            <AutocompleteInput name="eWayBillNo" value={header.eWayBillNo} onChange={handleHeaderChange} endpoint="fields/eWayBillNo" />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Dispatch From</label>
            <AutocompleteInput name="dispatchFrom" value={header.dispatchFrom} onChange={handleHeaderChange} endpoint="fields/dispatchFrom" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Dispatched Through</label>
            <AutocompleteInput name="dispatchedThrough" value={header.dispatchedThrough} onChange={handleHeaderChange} endpoint="fields/dispatchedThrough" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Destination</label>
            <AutocompleteInput name="destination" value={header.destination} onChange={handleHeaderChange} endpoint="fields/destination" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Terms of Delivery</label>
            <AutocompleteInput name="termsOfDelivery" value={header.termsOfDelivery} onChange={handleHeaderChange} endpoint="fields/termsOfDelivery" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Buyer's Order No</label>
            <AutocompleteInput name="buyersOrderNo" value={header.buyersOrderNo} onChange={handleHeaderChange} endpoint="fields/buyersOrderNo" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Order Dated</label>
            <input type="date" name="orderDated" value={header.orderDated} onChange={handleHeaderChange} className="w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500 text-sm" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Consignee */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Step 3A: Consignee (Ship to)</h3>
          </div>
          <div className="p-6 space-y-4 flex-1">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Party Name</label>
              <AutocompleteInput 
                name="partyName" 
                value={consignee.partyName} 
                onChange={e => setConsignee({...consignee, partyName: e.target.value})} 
                endpoint="parties" 
                onSelect={(party) => setConsignee(party)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Address</label>
              <AutocompleteInput 
                name="address" 
                value={consignee.address} 
                onChange={e => setConsignee({...consignee, address: e.target.value})} 
                endpoint="fields/partyAddress" 
                isTextarea={true}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State Code</label>
                <AutocompleteInput 
                  name="stateCode" 
                  value={consignee.stateCode} 
                  onChange={e => setConsignee({...consignee, stateCode: e.target.value})} 
                  endpoint="fields/stateCode" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label>
                <AutocompleteInput 
                  name="gstin" 
                  value={consignee.gstin} 
                  onChange={e => setConsignee({...consignee, gstin: e.target.value})} 
                  endpoint="fields/gstin" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Buyer */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">Step 3B: Buyer (Bill to)</h3>
            <label className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" checked={sameAsConsignee} onChange={e => setSameAsConsignee(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4" />
              <span>Same as Consignee</span>
            </label>
          </div>
          <div className="p-6 space-y-4 flex-1">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Party Name</label>
              <AutocompleteInput 
                name="partyName" 
                value={buyer.partyName} 
                onChange={e => setBuyer({...buyer, partyName: e.target.value})} 
                endpoint="parties" 
                onSelect={(party) => setBuyer(party)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Address</label>
              <AutocompleteInput 
                name="address" 
                value={buyer.address} 
                onChange={e => setBuyer({...buyer, address: e.target.value})} 
                endpoint="fields/partyAddress" 
                isTextarea={true}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State Code</label>
                <AutocompleteInput 
                  name="stateCode" 
                  value={buyer.stateCode} 
                  onChange={e => setBuyer({...buyer, stateCode: e.target.value})} 
                  endpoint="fields/stateCode" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label>
                <AutocompleteInput 
                  name="gstin" 
                  value={buyer.gstin} 
                  onChange={e => setBuyer({...buyer, gstin: e.target.value})} 
                  endpoint="fields/gstin" 
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">Step 4: Line Items Table</h3>
        </div>
        <div className="p-0">
          <LineItemsTable 
            items={items}
            onChange={(index, field, value) => {
              const newItems = [...items];
              newItems[index][field] = value;
              setItems(newItems);
            }}
            onAddRow={() => setItems([...items, { id: Date.now(), description: '', hsnCode: '', gstRate: '18_igst', quantity: 1, unit: 'Nos.', rate: 0 }])}
            onRemoveRow={(id) => setItems(items.filter(item => item.id !== id))}
          />
        </div>
      </div>

      {/* Summary Box */}
      <div className="bg-slate-800 rounded-xl shadow-lg p-4 sm:p-6 text-white flex flex-col sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div>
          <h4 className="text-slate-400 text-sm font-medium mb-1 uppercase tracking-wider">Amount in Words</h4>
          <p className="font-medium text-sm">{numberToWords(grandTotal)}</p>
        </div>
        <div className="sm:col-span-1 lg:col-span-2 flex flex-wrap justify-start sm:justify-end gap-x-8 gap-y-3">
          <div className="text-right">
            <p className="text-slate-400 text-sm mb-1">Taxable Value</p>
            <p className="text-xl font-semibold">₹ {taxableValue.toFixed(0)}</p>
          </div>
          
          {isSameState ? (
            <>
              <div className="text-right">
                <p className="text-slate-400 text-sm mb-1">CGST</p>
                <p className="text-xl font-semibold">₹ {(totalTax / 2).toFixed(0)}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-400 text-sm mb-1">SGST</p>
                <p className="text-xl font-semibold">₹ {(totalTax / 2).toFixed(0)}</p>
              </div>
            </>
          ) : (
            <div className="text-right">
              <p className="text-slate-400 text-sm mb-1">IGST</p>
              <p className="text-xl font-semibold">₹ {totalTax.toFixed(0)}</p>
            </div>
          )}

          <div className="text-right pl-6 border-l border-slate-600">
            <p className="text-blue-300 text-sm font-medium mb-1 uppercase tracking-wider">Invoice Total</p>
            <p className="text-3xl font-bold text-white">₹ {grandTotal.toFixed(0)}</p>
          </div>
        </div>
      </div>
      
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button 
          onClick={handleExportPDF} 
          disabled={pdfLoading}
          className="bg-white border-2 border-slate-800 text-slate-800 hover:bg-slate-50 px-5 py-2.5 rounded-lg font-bold shadow-sm transition-colors uppercase tracking-wider text-sm flex items-center disabled:opacity-50"
        >
          {pdfLoading ? (
            <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          )}
          <span className="ml-2">{pdfLoading ? 'Generating...' : 'Download PDF'}</span>
        </button>
        <button 
          onClick={handleExportWord} 
          disabled={wordLoading}
          className="bg-blue-600 border-2 border-blue-600 text-white hover:bg-blue-700 px-5 py-2.5 rounded-lg font-bold shadow-md transition-colors uppercase tracking-wider text-sm flex items-center disabled:opacity-50"
        >
          {wordLoading ? (
            <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          )}
          <span className="ml-2">{wordLoading ? 'Generating...' : 'Download Word'}</span>
        </button>
      </div>
      
      {showPreview && currentCompanyObj && (
        <InvoicePreview 
          invoiceData={{ header, consignee, buyer, items: calculatedItems, taxType: isSameState ? 'CGST_SGST' : 'IGST', subtotal: taxableValue, taxAmount: totalTax, total: grandTotal }}
          companyData={currentCompanyObj}
          onClose={() => setShowPreview(false)}
          onDownloadPDF={exportPDFFromPreview}
          onDownloadWord={handleExportWord}
        />
      )}

    </div>
  );
}
