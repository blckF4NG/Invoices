import { useState, useEffect } from 'react';
import api from '../utils/api';
import { Pencil, Trash2, Plus } from 'lucide-react';
import CompanyModal from '../components/CompanyModal';
import { toast } from 'react-hot-toast';

export default function ManageCompanies() {
  const [companies, setCompanies] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCompanies = async () => {
    try {
      const { data } = await api.get('/api/companies');
      setCompanies(data);
    } catch (error) {
      console.error('Failed to fetch companies', error);
      if (error.response?.status === 401) {
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        await api.delete(`/api/companies/${id}`);
        fetchCompanies();
      } catch (error) {
        toast.error('Failed to delete company');
      }
    }
  };

  const handleEdit = (company) => {
    setEditingCompany(company);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingCompany(null);
    setIsModalOpen(true);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3 justify-between items-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Manage Companies</h2>
        <button 
          onClick={handleAddNew}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
        >
          <Plus size={18} />
          <span>Add New Company</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Loading companies...</div>
      ) : companies.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
          No companies found. Click "Add New Company" to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map(company => (
            <div key={company.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 rounded object-contain bg-gray-50 flex items-center justify-center overflow-hidden border">
                    {company.logoImagePath ? (
                      <img src={`${company.logoImagePath}`} alt="Logo" className="max-h-full max-w-full" />
                    ) : (
                      <span className="text-gray-400 text-xs">No Logo</span>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => handleEdit(company)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                      <Pencil size={18} />
                    </button>
                    <button onClick={() => handleDelete(company.id, company.name)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-1 line-clamp-1" title={company.name}>{company.name}</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><span className="text-gray-400">GST:</span> {company.gstin}</p>
                  <p><span className="text-gray-400">State:</span> {company.stateCode}</p>
                  <p className="line-clamp-2 text-xs text-gray-500 mt-2">{company.address}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <CompanyModal
          company={editingCompany}
          onClose={() => setIsModalOpen(false)}
          onRefresh={fetchCompanies}
        />
      )}
    </div>
  );
}
