import { numberToWords } from '../utils/numberToWords';
import { X } from 'lucide-react';

export default function InvoicePreview({ 
  invoiceData, 
  companyData, 
  onClose,
  onDownloadPDF,
  onDownloadWord
}) {
  const { header, consignee, buyer, items, taxType, subtotal, taxAmount, total } = invoiceData;
  const isPrintMode = false;

  // Render the structured table
  return (
    <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 overflow-y-auto p-2 sm:p-4">
      <div className="bg-gray-100 w-full max-w-4xl shadow-2xl relative my-2 sm:my-8 flex flex-col">
        {/* Toolbar */}
        <div className="bg-gray-800 text-white p-3 flex justify-between items-center sticky top-0 z-10 print:hidden">
          <h2 className="font-semibold px-2 text-sm uppercase tracking-wider">Invoice Preview</h2>
          <div className="space-x-4 flex items-center">
            {onDownloadPDF && (
              <button onClick={onDownloadPDF} className="bg-white text-gray-800 hover:bg-gray-200 px-4 py-1.5 rounded text-sm font-semibold transition-colors">
                Download PDF
              </button>
            )}
            {onDownloadWord && (
              <button onClick={onDownloadWord} className="bg-blue-600 text-white hover:bg-blue-500 px-4 py-1.5 rounded text-sm font-semibold transition-colors">
                Download Word
              </button>
            )}
            <button onClick={onClose} className="hover:bg-gray-700 p-2 rounded-md transition-colors text-gray-300 hover:text-white">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Invoice Paper content */}
        <div className="bg-white p-4 sm:p-8 md:p-12 text-black text-xs font-sans border-b-4 border-gray-800 overflow-x-auto" id="invoice-print-area">
          {companyData.logoImagePath && (
            <div className="mb-6 flex justify-start">
              <img src={companyData.logoImagePath} alt="Logo" className="h-20 object-contain" />
            </div>
          )}
          <table className="w-full border-collapse border border-black mb-4">
            <tbody>
              {/* Row 1 */}
              <tr>
                <td className="border border-black p-2 w-1/2 align-top" rowSpan="2">
                  <div className="font-bold text-sm mb-1">{companyData.name}</div>
                  <div className="mb-2 whitespace-pre-line leading-relaxed">{companyData.address}</div>
                  <div>State Code: {companyData.stateCode}</div>
                  <div>GSTIN: {companyData.gstin}</div>
                </td>
                <td className="border border-black p-2 w-1/4 align-top">
                  <div className="text-[10px] text-gray-600">Invoice No</div>
                  <div className="font-semibold">{header.invoiceNo}</div>
                </td>
                <td className="border border-black p-2 w-1/4 align-top">
                  <div className="text-[10px] text-gray-600">Invoice Dated</div>
                  <div className="font-semibold">{header.invoiceDate}</div>
                </td>
              </tr>
              {/* Row 2 */}
              <tr>
                <td className="border border-black p-2 align-top">
                  <div className="text-[10px] text-gray-600">Delivery Note</div>
                  <div className="font-semibold">{header.deliveryNote || 'N/A'}</div>
                </td>
                <td className="border border-black p-2 align-top">
                  <div className="text-[10px] text-gray-600">eWay Bill No.</div>
                  <div className="font-semibold">{header.eWayBillNo || 'N/A'}</div>
                </td>
              </tr>

              {/* Row 3 */}
              <tr>
                <td className="border border-black p-2 align-top" rowSpan="2">
                  <div className="text-[10px] text-gray-600 mb-1">Consignee (Ship to)</div>
                  <div className="font-bold">{consignee.partyName}</div>
                  <div className="mb-2 whitespace-pre-line leading-relaxed">{consignee.address}</div>
                  <div>State Code: {consignee.stateCode}</div>
                  <div>GSTIN: {consignee.gstin}</div>
                </td>
                <td className="border border-black p-2 align-top">
                  <div className="text-[10px] text-gray-600">Buyer's Order No.</div>
                  <div className="font-semibold">{header.buyersOrderNo || 'N/A'}</div>
                </td>
                <td className="border border-black p-2 align-top">
                  <div className="text-[10px] text-gray-600">Order Dated</div>
                  <div className="font-semibold">{header.orderDated || 'N/A'}</div>
                </td>
              </tr>
              {/* Row 4 */}
              <tr>
                <td className="border border-black p-2 align-top" colSpan="2">
                  <div className="text-[10px] text-gray-600">Dispatch From</div>
                  <div className="font-semibold">{header.dispatchFrom || 'N/A'}</div>
                </td>
              </tr>

              {/* Row 5 */}
              <tr>
                <td className="border border-black p-2 align-top" rowSpan="2">
                  <div className="text-[10px] text-gray-600 mb-1">Buyer (Bill to)</div>
                  <div className="font-bold">{buyer.partyName}</div>
                  <div className="mb-2 whitespace-pre-line leading-relaxed">{buyer.address}</div>
                  <div>State Code: {buyer.stateCode}</div>
                  <div>GSTIN: {buyer.gstin}</div>
                </td>
                <td className="border border-black p-2 align-top">
                  <div className="text-[10px] text-gray-600">Dispatched Through</div>
                  <div className="font-semibold">{header.dispatchedThrough || 'N/A'}</div>
                </td>
                <td className="border border-black p-2 align-top">
                  <div className="text-[10px] text-gray-600">Destination/Place of Supply</div>
                  <div className="font-semibold">{header.destination || 'N/A'}</div>
                </td>
              </tr>
              {/* Row 6 */}
              <tr>
                <td className="border border-black p-2 align-top" colSpan="2">
                  <div className="text-[10px] text-gray-600">Terms of Delivery</div>
                  <div className="font-semibold">{header.termsOfDelivery || 'N/A'}</div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Line items table */}
          <table className="w-full border-collapse border border-black mb-4 text-center">
            <thead>
              <tr className="bg-gray-50 border-b border-black">
                <th className="border border-black p-1 w-8">S. No.</th>
                <th className="border border-black p-1">Description of Goods</th>
                <th className="border border-black p-1 w-16">HSN</th>
                <th className="border border-black p-1 whitespace-nowrap px-2">GST Rate</th>
                <th className="border border-black p-1 w-16">Quantity</th>
                <th className="border border-black p-1 w-20">Rate (₹)</th>
                <th className="border border-black p-1 w-16">Per</th>
                <th className="border border-black p-1 w-24">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx} className="border-b border-black">
                  <td className="border-r border-black p-1.5 align-top">{idx + 1}</td>
                  <td className="border-r border-black p-1.5 align-top text-left font-semibold">{item.description}</td>
                  <td className="border-r border-black p-1.5 align-top">{item.hsnCode}</td>
                  <td className="border-r border-black p-1.5 align-top whitespace-nowrap">
                    {item.gstRate && item.gstRate.toString().includes('_cgst') ? '9% + 9%' : `${parseFloat(item.gstRate)}%`}
                  </td>
                  <td className="border-r border-black p-1.5 align-top font-semibold">{item.quantity} {item.unit}</td>
                  <td className="border-r border-black p-1.5 align-top">{parseFloat(item.rate).toFixed(0)}</td>
                  <td className="border-r border-black p-1.5 align-top">{item.unit}</td>
                  <td className="p-1.5 align-top font-semibold">{parseFloat(item.amount).toFixed(0)}</td>
                </tr>
              ))}
              {/* Spacer rows if few items */}
              {items.length < 3 && Array.from({ length: 3 - items.length }).map((_, i) => (
                <tr key={'space'+i}>
                  <td className="border-r border-black p-4"></td>
                  <td className="border-r border-black"></td><td className="border-r border-black"></td><td className="border-r border-black"></td><td className="border-r border-black"></td><td className="border-r border-black"></td><td className="border-r border-black"></td><td></td>
                </tr>
              ))}
              
              {/* Tax totals row */}
              {taxType === 'IGST' ? (
                <tr className="border-t border-black">
                  <td className="border-r border-black p-1.5 text-right font-medium italic" colSpan="7">IGST</td>
                  <td className="p-1.5 font-semibold">{taxAmount.toFixed(0)}</td>
                </tr>
              ) : (
                <>
                  <tr className="border-t border-black">
                    <td className="border-r border-black p-1.5 text-right font-medium italic" colSpan="7">CGST</td>
                    <td className="border-b border-black p-1.5 font-semibold">{(taxAmount / 2).toFixed(0)}</td>
                  </tr>
                  <tr className="border-t border-black">
                    <td className="border-r border-black p-1.5 text-right font-medium italic" colSpan="7">SGST</td>
                    <td className="p-1.5 font-semibold">{(taxAmount / 2).toFixed(0)}</td>
                  </tr>
                </>
              )}
              
              <tr className="border-t border-black bg-gray-50">
                <td className="border-r border-black p-1.5 text-right font-bold" colSpan="7">Total</td>
                <td className="p-1.5 font-bold">₹ {total.toFixed(0)}</td>
              </tr>
            </tbody>
          </table>

          {/* Amount in words */}
          <div className="mb-6">
            <div className="text-[10px] text-gray-600 italic">Amount Chargeable (in words)</div>
            <div className="font-bold">₹ {numberToWords(total)}</div>
          </div>

          {/* HSN Summary table */}
          <table className="w-full border-collapse border border-black mb-6 text-center">
            <thead>
              <tr className="bg-gray-50 border-b border-black">
                <th className="border border-black p-1" rowSpan="2">HSN/SAC</th>
                <th className="border border-black p-1" rowSpan="2">Taxable Value</th>
                {taxType === 'IGST' ? (
                  <th className="border border-black p-1" colSpan="2">Integrated Tax</th>
                ) : (
                  <>
                    <th className="border border-black p-1" colSpan="2">Central Tax</th>
                    <th className="border border-black p-1" colSpan="2">State Tax</th>
                  </>
                )}
                <th className="border border-black p-1" rowSpan="2">Total Tax Amount</th>
              </tr>
              <tr className="bg-gray-50 border-b border-black">
                {taxType === 'IGST' ? (
                  <>
                    <th className="border border-black p-1 text-xs">Rate</th>
                    <th className="border border-black p-1 text-xs">Amount</th>
                  </>
                ) : (
                  <>
                    <th className="border border-black p-1 text-xs">Rate</th>
                    <th className="border border-black p-1 text-xs">Amount</th>
                    <th className="border border-black p-1 text-xs">Rate</th>
                    <th className="border border-black p-1 text-xs">Amount</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx} className="border-b border-black">
                  <td className="border-r border-black p-1.5">{item.hsnCode}</td>
                  <td className="border-r border-black p-1.5">{parseFloat(item.amount).toFixed(0)}</td>
                  {taxType === 'IGST' ? (
                    <>
                      <td className="border-r border-black p-1.5">{parseFloat(item.gstRate)}%</td>
                      <td className="border-r border-black p-1.5">{parseFloat(item.tax).toFixed(0)}</td>
                    </>
                  ) : (
                    <>
                      <td className="border-r border-black p-1.5">{parseFloat(item.gstRate) / 2}%</td>
                      <td className="border-r border-black p-1.5">{(parseFloat(item.tax) / 2).toFixed(0)}</td>
                      <td className="border-r border-black p-1.5">{parseFloat(item.gstRate) / 2}%</td>
                      <td className="border-r border-black p-1.5">{(parseFloat(item.tax) / 2).toFixed(0)}</td>
                    </>
                  )}
                  <td className="p-1.5">{parseFloat(item.tax).toFixed(0)}</td>
                </tr>
              ))}
              <tr className="border-t border-black font-bold bg-gray-50">
                <td className="border-r border-black p-1.5 text-right">Total</td>
                <td className="border-r border-black p-1.5">{subtotal.toFixed(0)}</td>
                {taxType === 'IGST' ? (
                  <>
                    <td className="border-r border-black p-1.5 bg-gray-200"></td>
                    <td className="border-r border-black p-1.5">{taxAmount.toFixed(0)}</td>
                  </>
                ) : (
                  <>
                    <td className="border-r border-black p-1.5 bg-gray-200"></td>
                    <td className="border-r border-black p-1.5">{(taxAmount / 2).toFixed(0)}</td>
                    <td className="border-r border-black p-1.5 bg-gray-200"></td>
                    <td className="border-r border-black p-1.5">{(taxAmount / 2).toFixed(0)}</td>
                  </>
                )}
                <td className="p-1.5">{taxAmount.toFixed(0)}</td>
              </tr>
            </tbody>
          </table>

          <div className="flex justify-between items-start">
            {/* Left bottom details */}
            <div className="w-1/2 pr-4">
              <div className="mb-4">
                <div>Company's Bank Details</div>
                <div>Bank Name: <span className="font-bold">{companyData.bankName}</span></div>
                <div>A/c No.: <span className="font-bold">{companyData.bankAccount}</span></div>
                <div>IFSC Code: <span className="font-bold">{companyData.ifscCode}</span></div>
              </div>
              <div>
                <div className="underline mb-1">Declaration</div>
                <div className="text-xs">
                  We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
                </div>
              </div>
            </div>

            {/* Right bottom details */}
            <div className="w-1/2 flex flex-col items-end pt-2 text-right">
              <div className="font-bold mb-8 text-sm">For {companyData.name}</div>
              {companyData.signatureImagePath && (
                <img src={companyData.signatureImagePath} alt="Signature" className="h-12 mb-2 object-contain" />
              )}
              <div className="mt-4">Authorised Signatory</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
