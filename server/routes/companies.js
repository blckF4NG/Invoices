const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuth } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

const router = express.Router();
const prisma = new PrismaClient();

// Protect all company routes
router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const companies = await prisma.company.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(companies);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

router.post('/', async (req, res) => {
  try {
    const company = await prisma.company.create({
      data: req.body
    });
    res.status(201).json(company);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create company' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const company = await prisma.company.update({
      where: { id: parseInt(req.params.id) },
      data: req.body
    });
    res.json(company);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update company' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.company.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ message: 'Company deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete company' });
  }
});

// Upload company logo
router.post('/:id/upload-logo', upload.single('file'), async (req, res) => {
  try {
    const logoImagePath = '/uploads/' + req.file.filename;
    const company = await prisma.company.update({
      where: { id: parseInt(req.params.id) },
      data: { logoImagePath }
    });
    res.json(company);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to upload logo' });
  }
});

// Upload company signature
router.post('/:id/upload-signature', upload.single('file'), async (req, res) => {
  try {
    const signatureImagePath = '/uploads/' + req.file.filename;
    const company = await prisma.company.update({
      where: { id: parseInt(req.params.id) },
      data: { signatureImagePath }
    });
    res.json(company);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to upload signature' });
  }
});

module.exports = router;
