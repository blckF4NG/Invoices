import { Plus, Trash2 } from 'lucide-react';
import AutocompleteInput from './AutocompleteInput';

export default function LineItemsTable({ items, onChange, onAddRow, onRemoveRow }) {
  const handleChange = (index, field, value) => {
    onChange(index, field, value);
  };
  const gsts = [
    { label: '0%', value: '0' },
    { label: '5%', value: '5' },
    { label: '12%', value: '12' },
    { label: '18%', value: '18_igst' },
    { label: '9% CGST + 9% SGST', value: '18_cgst' },
    { label: '28%', value: '28' }
  ];
  
  return (
    <div className="overflow-x-auto w-full">
      <table className="w-full text-sm border-collapse border border-gray-300 shadow-sm">
        <thead className="bg-gray-50 text-xs text-gray-700 uppercase border-b border-gray-300">
          <tr>
            <th className="px-3 py-2 border border-gray-300 w-12 text-center">S.No</th>
            <th className="px-3 py-2 border border-gray-300">Description of Goods</th>
            <th className="px-3 py-2 border border-gray-300 w-24 text-center">HSN</th>
            <th className="px-3 py-2 border border-gray-300 w-20 text-center">GST %</th>
            <th className="px-3 py-2 border border-gray-300 w-20 text-center">Qty</th>
            <th className="px-3 py-2 border border-gray-300 w-24 text-center">Unit</th>
            <th className="px-3 py-2 border border-gray-300 w-32 text-center">Rate (₹)</th>
            <th className="px-3 py-2 border border-gray-300 w-32 text-center">Amount (₹)</th>
            <th className="px-3 py-2 border border-gray-300 w-12 text-center"></th>
          </tr>
        </thead>
        <tbody className="bg-white">
          {items.map((item, index) => {
            const amount = (parseFloat(item.quantity || 0) * parseFloat(item.rate || 0)).toFixed(2);
            return (
              <tr key={item.id} className="hover:bg-blue-50/50 transition-colors">
                <td className="px-3 py-2 border border-gray-300 text-center text-gray-500 font-medium">{index + 1}</td>
                <td className="px-3 py-2 border border-gray-300 p-0 relative">
                  <AutocompleteInput 
                    name="description"
                    value={item.description}
                    onChange={(e) => handleChange(index, 'description', e.target.value)}
                    endpoint="items"
                    onSelect={(selected) => {
                      handleChange(index, 'description', selected.description || '');
                      handleChange(index, 'hsnCode', selected.hsnCode || '');
                      handleChange(index, 'gstRate', selected.defaultGstRate || selected.gstRate || 0);
                      handleChange(index, 'rate', selected.defaultRate || selected.rate || 0);
                      handleChange(index, 'unit', selected.defaultUnit || selected.unit || 'Nos.');
                    }}
                    placeholder="Enter item description"
                    className="w-full p-2 border-0 bg-transparent text-sm focus:ring-2 focus:ring-inset focus:ring-blue-500 outline-none h-full"
                  />
                </td>
                <td className="p-0 border border-gray-300">
                  <input type="text" value={item.hsnCode} onChange={(e) => handleChange(index, 'hsnCode', e.target.value)} className="w-full p-2 text-center border-0 bg-transparent text-sm focus:ring-2 focus:ring-inset focus:ring-blue-500 outline-none" placeholder="HSN" />
                </td>
                <td className="p-0 border border-gray-300">
                  <select value={item.gstRate} onChange={(e) => handleChange(index, 'gstRate', e.target.value)} className="w-full p-2 text-center border-0 bg-transparent text-sm focus:ring-2 focus:ring-inset focus:ring-blue-500 outline-none cursor-pointer">
                    {gsts.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </td>
                <td className="p-0 border border-gray-300">
                  <input type="number" min="0" step="1" value={item.quantity} onChange={(e) => handleChange(index, 'quantity', e.target.value)} className="w-full p-2 text-center border-0 bg-transparent text-sm focus:ring-2 focus:ring-inset focus:ring-blue-500 outline-none" />
                </td>
                <td className="p-0 border border-gray-300">
                  <select value={item.unit} onChange={(e) => handleChange(index, 'unit', e.target.value)} className="w-full p-2 text-center border-0 bg-transparent text-sm focus:ring-2 focus:ring-inset focus:ring-blue-500 outline-none cursor-pointer">
                    <option value="Nos.">Nos.</option>
                    <option value="Kg">Kg</option>
                    <option value="Pcs">Pcs</option>
                    <option value="Set">Set</option>
                    <option value="Meters">Meters</option>
                    <option value="Liters">Liters</option>
                  </select>
                </td>
                <td className="p-0 border border-gray-300">
                  <input type="number" min="0" step="0.01" value={item.rate} onChange={(e) => handleChange(index, 'rate', e.target.value)} className="w-full p-2 text-right border-0 bg-transparent text-sm focus:ring-2 focus:ring-inset focus:ring-blue-500 outline-none" />
                </td>
                <td className="px-3 py-2 border border-gray-300 text-right font-medium text-gray-800 bg-gray-50/50">
                  {new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)}
                </td>
                <td className="px-3 py-2 border border-gray-300 text-center">
                  <button 
                    type="button"
                    onClick={() => onRemoveRow(item.id)} 
                    className="text-gray-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-md transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400" 
                    disabled={items.length <= 1}
                    title={items.length <= 1 ? "Cannot remove the last row" : "Remove row"}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      
      <div className="mt-3 flex gap-4">
        <button 
          type="button"
          onClick={onAddRow}
          className="flex items-center space-x-1 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-2 rounded-md transition-colors"
        >
          <Plus size={16} />
          <span>Add Row</span>
        </button>
      </div>
    </div>
  );
}
