import { useState, useEffect } from 'react';
import api from '../utils/api';
import { X, Upload } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function CompanyModal({ company, onClose, onRefresh }) {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    stateCode: '',
    gstin: '',
    pan: '',
    signatoryName: '',
    bankName: '',
    bankAccount: '',
    ifscCode: ''
  });
  
  const [logoFile, setLogoFile] = useState(null);
  const [signatureFile, setSignatureFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(company?.logoImagePath || null);
  const [signaturePreview, setSignaturePreview] = useState(company?.signatureImagePath || null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || '',
        address: company.address || '',
        stateCode: company.stateCode || '',
        gstin: company.gstin || '',
        pan: company.pan || '',
        signatoryName: company.signatoryName || '',
        bankName: company.bankName || '',
        bankAccount: company.bankAccount || '',
        ifscCode: company.ifscCode || ''
      });
      setLogoPreview(company.logoImagePath);
      setSignaturePreview(company.signatureImagePath);
    }
  }, [company]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (type === 'logo') {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    } else {
      setSignatureFile(file);
      setSignaturePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      let currentCompanyId = company?.id;
      
      // Step 1: Create or Update based company details
      if (company) {
        await api.put(`/api/companies/${company.id}`, formData);
      } else {
        const { data } = await api.post('/api/companies', formData);
        currentCompanyId = data.id;
      }
      
      // Step 2: Upload files if any
      if (logoFile && currentCompanyId) {
        const fd = new FormData();
        fd.append('file', logoFile);
        await api.post(`/api/companies/${currentCompanyId}/upload-logo`, fd);
      }
      if (signatureFile && currentCompanyId) {
        const fd = new FormData();
        fd.append('file', signatureFile);
        await api.post(`/api/companies/${currentCompanyId}/upload-signature`, fd);
      }

      onRefresh();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Failed to save company details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[95vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">{company ? 'Edit Company' : 'Add New Company'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          <form id="company-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
              <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500 text-sm" />
            </div>
            
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Address *</label>
              <textarea name="address" required rows="2" value={formData.address} onChange={handleChange} className="w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500 text-sm" />
            </div>

            <div className="grid grid-cols-2 gap-4 col-span-1 md:col-span-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State Code *</label>
                <input type="text" name="stateCode" required value={formData.stateCode} onChange={handleChange} className="w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="e.g. 06" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN *</label>
                <input type="text" name="gstin" required value={formData.gstin} onChange={handleChange} className="w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500 text-sm" maxLength={15} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PAN (optional)</label>
              <input type="text" name="pan" value={formData.pan} onChange={handleChange} className="w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500 text-sm" maxLength={10} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Signatory Authority Name *</label>
              <input type="text" name="signatoryName" required value={formData.signatoryName} onChange={handleChange} className="w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500 text-sm" />
            </div>

            {/* File Uploads */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">Company Logo</label>
              <div className="flex items-center space-x-4">
                <div className="h-20 w-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
                  {logoPreview ? (
                    <img src={logoPreview.startsWith('blob:') ? logoPreview : logoPreview} alt="Logo" className="max-h-full max-w-full" />
                  ) : (
                    <Upload className="text-gray-300" size={24} />
                  )}
                </div>
                <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'logo')} className="text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" />
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">Signature Image</label>
              <div className="flex items-center space-x-4">
                <div className="h-20 w-40 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
                  {signaturePreview ? (
                    <img src={signaturePreview.startsWith('blob:') ? signaturePreview : signaturePreview} alt="Signature" className="max-h-full max-w-full" />
                  ) : (
                    <Upload className="text-gray-300" size={24} />
                  )}
                </div>
                <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'signature')} className="text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" />
              </div>
            </div>

            <div className="col-span-1 md:col-span-2 pt-2 border-t mt-2">
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3">Bank Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Bank Name</label>
                  <input type="text" name="bankName" required value={formData.bankName} onChange={handleChange} className="w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Account Number</label>
                  <input type="text" name="bankAccount" required value={formData.bankAccount} onChange={handleChange} className="w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">IFSC Code</label>
                  <input type="text" name="ifscCode" required value={formData.ifscCode} onChange={handleChange} className="w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500 text-sm" />
                </div>
              </div>
            </div>

          </form>
        </div>
        
        <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3 rounded-b-xl">
          <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 shadow-sm transition-colors">
            Cancel
          </button>
          <button 
            type="submit" 
            form="company-form" 
            disabled={isSubmitting}
            className="px-5 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 shadow-md transition-colors disabled:opacity-50 flex items-center"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Saving...
              </>
            ) : 'Save Company Details'}
          </button>
        </div>
      </div>
    </div>
  );
}
