import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import * as readline from 'readline';

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function createUser() {
  try {
    console.log('🔐 Création d\'un nouvel utilisateur\n');

    const email = await question('Email: ');
    const password = await question('Mot de passe: ');
    const name = await question('Nom: ');

    // Hash le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crée l'utilisateur
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    console.log('\n✅ Utilisateur créé avec succès!');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Nom: ${user.name}`);
  } catch (error: any) {
    if (error.code === 'P2002') {
      console.error('\n❌ Erreur: Un utilisateur avec cet email existe déjà.');
    } else {
      console.error('\n❌ Erreur lors de la création:', error.message);
    }
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

createUser();
