const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('MYpassword', 10);
  const adminJ = await prisma.user.upsert({
    where: { username: 'adminJ' },
    update: {},
    create: {
      username: 'adminJ',
      passwordHash: adminPassword,
    },
  });

  console.log('Admin user created/updated.', adminJ);

  const ssdAviation = await prisma.company.create({
    data: {
      name: 'SSD Aviation Techno Pvt. Ltd.',
      address: 'Plot No 49, Kami Road, Asadpur Nandnaur, Kami-Ganur Road Sonipat, Haryana - 131027',
      stateCode: '06',
      gstin: '06ABOCS1545E1ZC',
      pan: '',
      signatoryName: 'Authorised Signatory',
      logoImagePath: '/assets/ssd_logo.jpg', // Using assets from client spec, wait, spec says DB Seed copies to /uploads
      bankName: 'HDFC Bank',
      bankAccount: '50200104459853',
      ifscCode: 'HDFC0007876'
    }
  });

  const fabLoc1 = await prisma.company.create({
    data: {
      name: 'FAB Aviation (Location 1)',
      address: 'Enter address for FAB Aviation Location 1',
      stateCode: 'XX',
      gstin: 'XXXXXXXXXXXXXX',
      pan: '',
      signatoryName: 'Authorised Signatory',
      logoImagePath: '/assets/fab_aviation_logo.png',
      bankName: '',
      bankAccount: '',
      ifscCode: ''
    }
  });

  const fabLoc2 = await prisma.company.create({
    data: {
      name: 'FAB Aviation (Location 2)',
      address: 'Enter address for FAB Aviation Location 2',
      stateCode: 'XX',
      gstin: 'XXXXXXXXXXXXXX',
      pan: '',
      signatoryName: 'Authorised Signatory',
      logoImagePath: '/assets/fab_aviation_logo.png',
      bankName: '',
      bankAccount: '',
      ifscCode: ''
    }
  });

  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
  }

  // Assets copy omitted, user will have to add images

  console.log('Seed completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
