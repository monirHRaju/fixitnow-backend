/**
 * Seed script: creates an admin user and sample data.
 *
 * Usage: npm run db:seed
 *
 * Admin credentials (default):
 *   Email:    admin@fixitnow.com
 *   Password: Admin@123456
 *
 * Change these in production!
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL || "";

const prisma = new PrismaClient({
  adapter: new PrismaPg(new pg.Pool({ connectionString: DATABASE_URL })),
});

const SALT_ROUNDS = 12;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function main() {
  console.log("🌱 Seeding database...\n");

  // ── Admin User ──
  const adminEmail = "admin@fixitnow.com";
  const adminPassword = await hashPassword("Admin@123456");

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: "Platform Admin",
      email: adminEmail,
      password: adminPassword,
      phone: "+8801700000000",
      role: "ADMIN",
      address: "Dhaka, Bangladesh",
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  console.log("✅ Admin user created:");
  console.log(`   Email:    ${admin.email}`);
  console.log(`   Password: Admin@123456`);
  console.log(`   Role:     ${admin.role}\n`);

  // ── Sample Categories ──
  const categories = [
    { name: "Plumbing", description: "Pipe repair, faucet installation, drainage solutions" },
    { name: "Electrical", description: "Wiring, switch installation, electrical repairs" },
    { name: "Cleaning", description: "Home and office deep cleaning services" },
    { name: "Painting", description: "Interior and exterior painting services" },
    { name: "Carpentry", description: "Furniture assembly, woodwork, cabinet installation" },
    { name: "Appliance Repair", description: "AC, fridge, washing machine, and oven repair" },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }

  console.log("✅ Sample categories created:");
  categories.forEach((c) => console.log(`   - ${c.name}`));

  console.log("\n🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
