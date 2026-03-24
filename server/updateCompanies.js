const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateCompanies() {
  try {
    // Delete existing companies to replace them cleanly
    await prisma.invoice.deleteMany({});
    await prisma.company.deleteMany({});

    await prisma.company.create({
      data: {
        name: 'SSD Aviation Techno Pvt. Ltd.',
        address: 'Plot No 49, Kami Road, Asadpur Nandnaur, Kami-Ganur Road Sonipat, Haryana - 131027',
        stateCode: '06',
        gstin: '06ABOCS1545E1ZC',
        pan: '',
        signatoryName: 'Authorised Signatory',
        logoImagePath: '/uploads/ssd_logo.png',
        signatureImagePath: '/uploads/signature.png',
        bankName: 'HDFC Bank',
        bankAccount: '50200104459853',
        ifscCode: 'HDFC0007876'
      }
    });

    await prisma.company.create({
      data: {
        name: 'FAB AVIATION',
        address: 'R-3A-2 H.No. 20/3, Mohan Garden, Uttam Nagar, West Delhi, New Delhi - 110059',
        stateCode: '07',
        gstin: '07AFEPA9149M2Z5',
        pan: '',
        signatoryName: 'Authorised Signatory',
        logoImagePath: '/uploads/fab_logo.png',
        signatureImagePath: '/uploads/signature.png',
        bankName: 'Kotak Mahindra Bank',
        bankAccount: '5545549540',
        ifscCode: 'KKBK0004607'
      }
    });

    await prisma.company.create({
      data: {
        name: 'FAB AVIATION',
        address: 'Khewat No. 92, Khata No. 147, Tharya Road, Jawahri, Jawahri Part 172, Sonipat, Haryana - 131001',
        stateCode: '06',
        gstin: '06MRFPS7284C1Z9',
        pan: '',
        signatoryName: 'Authorised Signatory',
        logoImagePath: '/uploads/fab_logo.png',
        signatureImagePath: '/uploads/signature.png',
        bankName: 'HDFC Bank',
        bankAccount: '50200080127840',
        ifscCode: 'HDFC0007876'
      }
    });

    console.log('Companies successfully updated!');
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

updateCompanies();
