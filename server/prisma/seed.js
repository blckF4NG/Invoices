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

  const ssdAviation = await prisma.company.upsert({
    where: { id: 1 },
    update: { logoImagePath: '/assets/ssd_logo.png' },
    create: {
      name: 'SSD Aviation Techno Pvt. Ltd.',
      address: 'Plot No 49, Kami Road, Asadpur Nandnaur, Kami-Ganur Road Sonipat, Haryana - 131027',
      stateCode: '06',
      gstin: '06ABOCS1545E1ZC',
      pan: '',
      signatoryName: 'Authorised Signatory',
      logoImagePath: '/assets/ssd_logo.png',
      bankName: 'HDFC Bank',
      bankAccount: '50200104459853',
      ifscCode: 'HDFC0007876'
    }
  });

  const fabLoc1 = await prisma.company.upsert({
    where: { id: 2 },
    update: { logoImagePath: '/assets/fab_logo.png' },
    create: {
      name: 'FAB Aviation (Location 1)',
      address: 'Enter address for FAB Aviation Location 1',
      stateCode: 'XX',
      gstin: 'XXXXXXXXXXXXXX',
      pan: '',
      signatoryName: 'Authorised Signatory',
      logoImagePath: '/assets/fab_logo.png',
      bankName: '',
      bankAccount: '',
      ifscCode: ''
    }
  });

  const fabLoc2 = await prisma.company.upsert({
    where: { id: 3 },
    update: { logoImagePath: '/assets/fab_logo.png' },
    create: {
      name: 'FAB Aviation (Location 2)',
      address: 'Enter address for FAB Aviation Location 2',
      stateCode: 'XX',
      gstin: 'XXXXXXXXXXXXXX',
      pan: '',
      signatoryName: 'Authorised Signatory',
      logoImagePath: '/assets/fab_logo.png',
      bankName: '',
      bankAccount: '',
      ifscCode: ''
    }
  });

  const uploadsDir = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Copy default logos if they exist in the source
  const sourceDir = path.join(__dirname, '..', 'uploads'); 
  const logos = ['ssd_logo.png', 'fab_logo.png'];
  
  logos.forEach(logo => {
    const src = path.join(sourceDir, logo);
    const dest = path.join(uploadsDir, logo);
    if (fs.existsSync(src) && !fs.existsSync(dest)) {
      try {
        fs.copyFileSync(src, dest);
        console.log(`Copied default logo: ${logo}`);
      } catch (err) {
        console.error(`Failed to copy ${logo}:`, err);
      }
    }
  });

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
