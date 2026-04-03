const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, WidthType, BorderStyle, ImageRun, AlignmentType } = require('docx');

const router = express.Router();

router.use(requireAuth);

function numToWords(number) {
  // simple wrapper for backend
  if (number === 0) return "Zero";
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  function convertChunk(num) {
      if ((num = num.toString()).length > 9) return 'overflow';
      let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
      if (!n) return ''; 
      let str = '';
      str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
      str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
      str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
      str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
      str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
      return str.trim();
  }
  const parts = number.toString().split('.');
  const wholePart = parseInt(parts[0], 10);
  const decimalPart = parts.length > 1 ? parseInt(parts[1].padEnd(2, '0').slice(0, 2), 10) : 0;
  let words = "Rupees " + convertChunk(wholePart);
  if (decimalPart > 0) words += " and " + convertChunk(decimalPart) + " Paise";
  return words + " Only";
}

// Convert image to base64
function getBase64Image(urlPath) {
  if (!urlPath) return null;
  
  // Use same upload directory logic as index.js
  const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads');
  
  // If the path starts with /uploads/, strip it to find the filename
  const fileName = urlPath.startsWith('/uploads/') ? urlPath.replace('/uploads/', '') : path.basename(urlPath);
  const fullPath = path.join(uploadDir, fileName);

  if (!fs.existsSync(fullPath)) {
    console.error(`File NOT found: ${fullPath}`);
    return null;
  }
  
  const ext = path.extname(fullPath).substring(1) || 'png';
  const data = fs.readFileSync(fullPath).toString('base64');
  return `data:image/${ext};base64,${data}`;
}

router.post('/pdf', async (req, res) => {
  try {
    const { htmlContent, companyName, invoiceNo, invoiceDate, companyData } = req.body;
    
    if (!htmlContent) {
      return res.status(400).json({ error: 'Missing HTML content' });
    }

    console.log(`Starting PDF generation for: ${companyName} - ${invoiceNo}`);
    
    // Process logo and signature to Base64
    const logoBase64 = companyData && companyData.logoImagePath ? getBase64Image(companyData.logoImagePath) : null;
    const signatureBase64 = companyData && companyData.signatureImagePath ? getBase64Image(companyData.signatureImagePath) : null;

    let processedHtml = htmlContent;
    if (logoBase64 && companyData.logoImagePath) {
      processedHtml = processedHtml.split(companyData.logoImagePath).join(logoBase64);
    }
    if (signatureBase64 && companyData.signatureImagePath) {
      processedHtml = processedHtml.split(companyData.signatureImagePath).join(signatureBase64);
    }

    // Inject styles and logo if needed
    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          body { 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact;
          }
        </style>
        <script>
          tailwind.config = {
            theme: {
              extend: {
                fontFamily: {
                  sans: ['Inter', 'sans-serif'],
                }
              }
            }
          }
        </script>
      </head>
      <body>
        <div class="bg-white p-4 sm:p-8 md:p-12 text-black text-xs font-sans">
          ${processedHtml}
        </div>
      </body>
      </html>
    `;

    const browser = await puppeteer.launch({ 
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || (process.env.NODE_ENV === 'production' ? '/nix/var/nix/profiles/default/bin/chromium' : null),
      timeout: 30000 // 30s launch timeout
    });
    const page = await browser.newPage();
    
    // 30s timeout for setting content
    await page.setContent(fullHtml, { waitUntil: 'networkidle0', timeout: 30000 });
    
    const shortName = companyName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
    const dateStr = new Date(invoiceDate).toISOString().split('T')[0];
    const fileName = `${shortName}_Invoice_${invoiceNo}_${dateStr}.pdf`;

    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
      printBackground: true,
      timeout: 30000 // 30s pdf timeout
    });

    await browser.close();

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    });
    
    res.end(pdfBuffer);
  } catch (error) {
    console.error('PDF Export Detailed Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate PDF', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

router.post('/word', async (req, res) => {
  try {
    const { invoiceData, companyData } = req.body;
    const { header, consignee, buyer, items, taxType, subtotal, taxAmount, total } = invoiceData;

    const tableRows = [];

    // Logo Row
    const logoBase64 = getBase64Image(companyData.logoImagePath);
    if (logoBase64) {
      const logoBuffer = Buffer.from(logoBase64.split(',')[1], 'base64');
      tableRows.push(new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [
                   new ImageRun({
                    data: logoBuffer,
                    transformation: { width: 150, height: 60 }
                  })
                ]
              })
            ],
            columnSpan: 7,
            borders: { bottom: { style: BorderStyle.NONE } }
          })
        ]
      }));
    }

    // Company Header Info
    tableRows.push(new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ text: companyData.name, bold: true, size: 28 })],
          columnSpan: 7,
          borders: { bottom: { style: BorderStyle.SINGLE, size: 1 } }
        })
      ]
    }));

    // Consignee & Buyer Section
    tableRows.push(new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({ text: "Consignee (Ship to):", bold: true, size: 20 }),
            new Paragraph({ text: consignee.partyName }),
            new Paragraph({ text: consignee.address }),
            new Paragraph({ text: `GST: ${consignee.gstin}` })
          ],
          columnSpan: 4
        }),
        new TableCell({
          children: [
            new Paragraph({ text: `Invoice No: ${header.invoiceNo}`, bold: true }),
            new Paragraph({ text: `Date: ${header.invoiceDate}` }),
            new Paragraph({ text: `Order No: ${header.buyersOrderNo}` }),
            new Paragraph({ text: `Destination: ${header.destination}` })
          ],
          columnSpan: 3
        })
      ]
    }));

    // Table Header
    tableRows.push(new TableRow({
      children: ['S.No', 'Description', 'HSN', 'GST%', 'Qty', 'Rate', 'Amount'].map(h => 
        new TableCell({ children: [new Paragraph({ text: h, bold: true })] })
      )
    }));

    // Items
    items.forEach((item, idx) => {
      tableRows.push(new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ text: (idx + 1).toString() })] }),
          new TableCell({ children: [new Paragraph({ text: item.description })] }),
          new TableCell({ children: [new Paragraph({ text: item.hsnCode || '-' })] }),
          new TableCell({ children: [new Paragraph({ text: item.gstRate.replace('_igst', '').replace('_cgst', '') + '%' })] }),
          new TableCell({ children: [new Paragraph({ text: item.quantity.toString() })] }),
          new TableCell({ children: [new Paragraph({ text: item.rate.toString() })] }),
          new TableCell({ children: [new Paragraph({ text: item.amount.toString() })] }),
        ]
      }));
    });

    // Footer / Totals
    tableRows.push(new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ text: "Total", bold: true })], columnSpan: 6 }),
        new TableCell({ children: [new Paragraph({ text: total.toFixed(0), bold: true })] }),
      ]
    }));

    // Amount in Words
    tableRows.push(new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({ text: "Amount in Words:", size: 16, italic: true }),
            new Paragraph({ text: numToWords(total), bold: true })
          ],
          columnSpan: 7
        })
      ]
    }));

    // Bank & Signature
    const signatureBase64 = getBase64Image(companyData.signatureImagePath);
    const signatureChildren = [];
    if (signatureBase64) {
      const sigBuffer = Buffer.from(signatureBase64.split(',')[1], 'base64');
      signatureChildren.push(new ImageRun({
        data: sigBuffer,
        transformation: { width: 100, height: 40 }
      }));
    }

    tableRows.push(new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({ text: `Bank: ${companyData.bankName} | A/c: ${companyData.bankAccount} | IFSC: ${companyData.ifscCode}` }),
            new Paragraph({ text: "Declaration: We declare that this invoice shows the actual price of goods described..." })
          ],
          columnSpan: 4
        }),
        new TableCell({
          children: [
            new Paragraph({ text: `For ${companyData.name}`, bold: true, alignment: AlignmentType.RIGHT }),
            new Paragraph({ children: signatureChildren, alignment: AlignmentType.RIGHT }),
            new Paragraph({ text: "Authorised Signatory", bold: true, alignment: AlignmentType.RIGHT })
          ],
          columnSpan: 3
        })
      ]
    }));

    const doc = new Document({
      sections: [{
        children: [
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: tableRows
          })
        ]
      }]
    });

    const b64string = await Packer.toBase64String(doc);
    const shortName = companyData.name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
    const fileName = `${shortName}_Invoice_${header.invoiceNo}.docx`;

    res.json({ fileName, fileData: b64string });
  } catch (error) {
    console.error('Word error', error);
    res.status(500).json({ error: 'Failed' });
  }
});

module.exports = router;
