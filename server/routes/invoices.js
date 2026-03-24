const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();
const prisma = new PrismaClient();

router.use(requireAuth);

router.post('/', async (req, res) => {
  try {
    const { 
      companyId, status, header, consignee, buyer, items, taxType, subtotal, taxAmount, total 
    } = req.body;

    let savedBuyer = null;
    if (buyer.partyName) {
      savedBuyer = await prisma.savedParty.upsert({
        where: { partyName: buyer.partyName },
        update: { address: buyer.address, stateCode: String(buyer.stateCode), gstin: buyer.gstin, lastUsedAt: new Date() },
        create: { partyName: buyer.partyName, address: buyer.address, stateCode: String(buyer.stateCode), gstin: buyer.gstin }
      });
    }

    let savedConsignee = null;
    if (consignee.partyName) {
      savedConsignee = await prisma.savedParty.upsert({
        where: { partyName: consignee.partyName },
        update: { address: consignee.address, stateCode: String(consignee.stateCode), gstin: consignee.gstin, lastUsedAt: new Date() },
        create: { partyName: consignee.partyName, address: consignee.address, stateCode: String(consignee.stateCode), gstin: consignee.gstin }
      });
    }

    const fieldsToSave = ['invoiceNo', 'deliveryNote', 'eWayBillNo', 'dispatchFrom', 'dispatchedThrough', 'destination', 'termsOfDelivery', 'buyersOrderNo'];
    for (const field of fieldsToSave) {
      if (header[field]) {
        try {
          const existing = await prisma.savedFieldValue.findFirst({
            where: { fieldName: field, value: header[field] }
          });
          if (existing) {
            await prisma.savedFieldValue.update({ where: { id: existing.id }, data: { lastUsedAt: new Date() }});
          } else {
            await prisma.savedFieldValue.create({ data: { fieldName: field, value: header[field] }});
          }
        } catch (e) {
          console.error("Field save error (ignored)", e);
        }
      }
    }

    for (const item of items) {
      if (item.description) {
        await prisma.savedItem.upsert({
          where: { description: item.description },
          update: {
            hsnCode: item.hsnCode,
            defaultGstRate: parseFloat(item.gstRate || 0),
            defaultRate: parseFloat(item.rate || 0),
            defaultUnit: item.unit,
            lastUsedAt: new Date()
          },
          create: {
            description: item.description,
            hsnCode: item.hsnCode,
            defaultGstRate: parseFloat(item.gstRate || 0),
            defaultRate: parseFloat(item.rate || 0),
            defaultUnit: item.unit
          }
        });
      }
    }

    const invoice = await prisma.invoice.create({
      data: {
        companyId,
        invoiceNumber: header.invoiceNo || `TEMP-${Date.now()}`,
        invoiceDate: header.invoiceDate ? new Date(header.invoiceDate) : new Date(),
        consigneeId: savedConsignee ? savedConsignee.id : null,
        buyerId: savedBuyer ? savedBuyer.id : null,
        lineItemsJSON: JSON.stringify(items),
        taxType,
        subtotal: parseFloat(subtotal),
        taxAmount: parseFloat(taxAmount),
        total: parseFloat(total),
        status,
        deliveryNote: header.deliveryNote || null,
        eWayBillNo: header.eWayBillNo || null,
        dispatchFrom: header.dispatchFrom || null,
        dispatchedThrough: header.dispatchedThrough || null,
        destination: header.destination || null,
        termsOfDelivery: header.termsOfDelivery || null,
        buyersOrderNo: header.buyersOrderNo || null,
        orderDated: header.orderDated ? new Date(header.orderDated) : null,
      }
    });

    res.status(201).json(invoice);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

router.get('/', async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      include: {
        company: true,
        consignee: true,
        buyer: true
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

module.exports = router;
