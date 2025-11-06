import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('password123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {},
    create: {
      email: 'admin@test.com',
      password: hashedPassword,
      name: 'Admin User',
    },
  });

  console.log('✅ User created:', user.email);

  // Create Provider Types
  const hotelType = await prisma.providerType.upsert({
    where: { name: 'hotel' },
    update: {},
    create: {
      name: 'hotel',
      label: 'Hôtel',
      jsonSchema: JSON.stringify({
        nombreEtoiles: { type: 'number', min: 1, max: 5, required: true },
        capacite: { type: 'number', required: true },
        services: { type: 'array', items: 'string' },
        tarifsParNuit: { type: 'number', required: true },
      }),
    },
  });

  const audiovisuelType = await prisma.providerType.upsert({
    where: { name: 'audiovisuel' },
    update: {},
    create: {
      name: 'audiovisuel',
      label: 'Prestataire audiovisuel',
      jsonSchema: JSON.stringify({
        materiel: { type: 'array', items: 'string', required: true },
        services: { type: 'array', items: 'string' },
        tarifJournalier: { type: 'number', required: true },
        nombreTechniciens: { type: 'number' },
      }),
    },
  });

  const traiteurType = await prisma.providerType.upsert({
    where: { name: 'traiteur' },
    update: {},
    create: {
      name: 'traiteur',
      label: 'Traiteur',
      jsonSchema: JSON.stringify({
        typeCuisine: { type: 'array', items: 'string', required: true },
        capaciteMax: { type: 'number', required: true },
        prixParPersonne: { type: 'number', required: true },
        serviceInclus: { type: 'boolean' },
      }),
    },
  });

  const lieuType = await prisma.providerType.upsert({
    where: { name: 'lieu' },
    update: {},
    create: {
      name: 'lieu',
      label: 'Lieu',
      jsonSchema: JSON.stringify({
        typeLieu: { type: 'string', required: true },
        superficie: { type: 'number', required: true },
        capacitePersonnes: { type: 'number', required: true },
        equipements: { type: 'array', items: 'string' },
        tarifJournalier: { type: 'number', required: true },
      }),
    },
  });

  console.log('✅ Provider types created');

  // Create sample providers
  await prisma.provider.deleteMany({}); // Clean up existing providers

  // Sample hotels
  await prisma.provider.create({
    data: {
      name: 'Hôtel du Parc',
      email: 'contact@hotelduparc.fr',
      phone: '0123456789',
      address: '1 rue de Paris, 75001 Paris',
      providerTypeId: hotelType.id,
      specificities: JSON.stringify({
        nombreEtoiles: 4,
        capacite: 50,
        services: ['wifi', 'parking', 'restaurant', 'spa'],
        tarifsParNuit: 150,
      }),
      status: 'active',
    },
  });

  await prisma.provider.create({
    data: {
      name: 'Grand Hôtel de Lyon',
      email: 'info@grandhotel-lyon.fr',
      phone: '0478901234',
      address: '10 Place Bellecour, 69002 Lyon',
      providerTypeId: hotelType.id,
      specificities: JSON.stringify({
        nombreEtoiles: 5,
        capacite: 120,
        services: ['wifi', 'parking', 'restaurant', 'spa', 'salle-conference'],
        tarifsParNuit: 250,
      }),
      status: 'active',
    },
  });

  // Sample audiovisuel
  await prisma.provider.create({
    data: {
      name: 'Prod Vidéo Pro',
      email: 'contact@prodvideopro.fr',
      phone: '0612345678',
      address: '15 avenue des Studios, 92100 Boulogne',
      providerTypeId: audiovisuelType.id,
      specificities: JSON.stringify({
        materiel: ['camera 4K', 'drone', 'steadicam', 'eclairage LED'],
        services: ['tournage', 'montage', 'post-production', 'animation'],
        tarifJournalier: 1500,
        nombreTechniciens: 5,
      }),
      status: 'active',
    },
  });

  // Sample traiteur
  await prisma.provider.create({
    data: {
      name: 'Traiteur Gourmet',
      email: 'contact@traiteur-gourmet.fr',
      phone: '0145678901',
      address: '20 rue de la Cuisine, 75015 Paris',
      providerTypeId: traiteurType.id,
      specificities: JSON.stringify({
        typeCuisine: ['française', 'italienne', 'fusion'],
        capaciteMax: 200,
        prixParPersonne: 45,
        serviceInclus: true,
      }),
      status: 'active',
    },
  });

  // Sample lieu
  await prisma.provider.create({
    data: {
      name: 'Espace Événementiel Central',
      email: 'reservation@espace-central.fr',
      phone: '0156789012',
      address: '30 boulevard Central, 75009 Paris',
      providerTypeId: lieuType.id,
      specificities: JSON.stringify({
        typeLieu: 'salle',
        superficie: 500,
        capacitePersonnes: 300,
        equipements: ['scene', 'sonorisation', 'eclairage', 'cuisine'],
        tarifJournalier: 2000,
      }),
      status: 'active',
    },
  });

  console.log('✅ Sample providers created');
  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
