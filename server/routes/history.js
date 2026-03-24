const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();
const prisma = new PrismaClient();

router.use(requireAuth);

router.get('/parties', async (req, res) => {
  try {
    const term = req.query.q || '';
    const parties = await prisma.savedParty.findMany({
      where: {
        partyName: { contains: term } // Case insensitive by default in sqlite? SQLite contains is case-insensitive
      },
      take: 5,
      orderBy: { lastUsedAt: 'desc' }
    });
    res.json(parties);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch' });
  }
});

router.get('/fields/:fieldName', async (req, res) => {
  try {
    const term = req.query.q || '';
    const fields = await prisma.savedFieldValue.findMany({
      where: {
        fieldName: req.params.fieldName,
        value: { contains: term }
      },
      take: 5,
      orderBy: { lastUsedAt: 'desc' }
    });
    res.json(fields.map(f => f.value));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch' });
  }
});

router.get('/items', async (req, res) => {
  try {
    const term = req.query.q || '';
    const items = await prisma.savedItem.findMany({
      where: {
        description: { contains: term }
      },
      take: 5,
      orderBy: { lastUsedAt: 'desc' }
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch' });
  }
});

// Delete historical party
router.delete('/party/:id', async (req, res) => {
  try {
    await prisma.savedParty.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

// Delete historical item
router.delete('/item/:id', async (req, res) => {
  try {
    await prisma.savedItem.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

// Delete historical field value (generic)
router.delete('/field/:id', async (req, res) => {
  try {
    await prisma.savedFieldValue.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

module.exports = router;

