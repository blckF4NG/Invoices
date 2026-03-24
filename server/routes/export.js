const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, WidthType, BorderStyle, ImageRun } = require('docx');

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
  // local path
  const fullPath = path.join(__dirname, '..', urlPath);
  if (!fs.existsSync(fullPath)) return null;
  const ext = path.extname(fullPath).substring(1);
  const data = fs.readFileSync(fullPath).toString('base64');
  return `data:image/${ext};base64,${data}`;
}

router.post('/pdf', async (req, res) => {
  try {
    const { htmlContent, companyName, invoiceNo, invoiceDate } = req.body;
    
    // We expect the frontend to send the processed HTML snippet
    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          body { font-family: 'Arial', sans-serif; -webkit-print-color-adjust: exact; }
          table { width: 100%; border-collapse: collapse; }
          td, th { border: 1px solid black; padding: 4px; font-size: 11px; }
          .no-border { border: none !important; }
        </style>
      </head>
      <body class="p-8">
        ${htmlContent}
      </body>
      </html>
    `;

    const browser = await puppeteer.launch({ 
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null
    });
    const page = await browser.newPage();
    await page.setContent(fullHtml, { waitUntil: 'networkidle0' });
    
    const shortName = companyName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
    const dateStr = new Date(invoiceDate).toISOString().split('T')[0];
    const fileName = `${shortName}_Invoice_${invoiceNo}_${dateStr}.pdf`;

    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
      printBackground: true
    });

    await browser.close();

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    });
    
    res.end(pdfBuffer);
  } catch (error) {
    console.error('PDF error', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

router.post('/word', async (req, res) => {
  try {
    const { invoiceData, companyData } = req.body;
    const { header, consignee, buyer, items, taxType, subtotal, taxAmount, total } = invoiceData;

    const tableRows = [];

    // Header Info
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

    // Totals
    tableRows.push(new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ text: "Total", bold: true })], columnSpan: 6 }),
        new TableCell({ children: [new Paragraph({ text: total.toString(), bold: true })] }),
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
