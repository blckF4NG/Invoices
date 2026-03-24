import { useState, useEffect } from 'react';
import api from '../utils/api';
import { Trash2, User, FileText, Package, Database } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('parties');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      let endpoint = '';
      if (activeTab === 'parties') endpoint = '/api/history/parties';
      else if (activeTab === 'fields') endpoint = '/api/history/fields/dispatchFrom'; // generic placeholder for fields
      else if (activeTab === 'items') endpoint = '/api/history/items';

      const { data } = await api.get(endpoint);
      setData(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [activeTab]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this historical entry?')) return;
    try {
      let type = activeTab === 'parties' ? 'party' : activeTab === 'items' ? 'item' : 'field';
      await api.delete(`/api/history/${type}/${id}`);
      fetchHistory();
      toast.success('Deleted successfully');
    } catch (error) {
      toast.error('Failed to delete entry');
    }
  };

  const tabs = [
    { id: 'parties', label: 'Saved Parties', icon: User },
    { id: 'items', label: 'Saved Items', icon: Package },
    { id: 'fields', label: 'Field Values', icon: FileText },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Settings & Data Management</h2>
        <p className="text-gray-500 text-sm mt-1">Manage all your saved autocomplete data and app preferences.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="p-6 min-h-[400px]">
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <Database className="mx-auto mb-3" size={40} />
              <p>No saved data found for this category.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.map((item, idx) => (
                <div key={item.id || idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group">
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="font-semibold text-gray-800 truncate">
                      {activeTab === 'parties' ? item.partyName : activeTab === 'items' ? item.description : item.value || (typeof item === 'string' ? item : JSON.stringify(item))}
                    </p>
                    {activeTab === 'parties' && <p className="text-xs text-gray-500 truncate">{item.address}</p>}
                    {activeTab === 'items' && <p className="text-xs text-gray-500">HSN: {item.hsnCode} | GST: {item.defaultGstRate}%</p>}
                  </div>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
