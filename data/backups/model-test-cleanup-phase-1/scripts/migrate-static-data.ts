/**
 * migrate-static-data.ts
 * ETL script: reads static TypeScript question data and seeds it into the Prisma DB.
 *
 * Usage:
 *   cd packages/database
 *   pnpm ts-node ../../scripts/migrate-static-data.ts
 *
 * Env:
 *   DATABASE_URL must be set (e.g., in packages/database/.env)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Taxonomy seed — creates ClassLevel > Subject hierarchy
const TAXONOMY = [
  {
    level: { name: 'HSC', slug: 'hsc' },
    subjects: [
      { name: 'পদার্থবিজ্ঞান ১ম পত্র', slug: 'physics-1st-paper' },
      { name: 'পদার্থবিজ্ঞান ২য় পত্র', slug: 'physics-2nd-paper' },
      { name: 'রসায়ন ১ম পত্র', slug: 'chemistry-1st-paper' },
      { name: 'রসায়ন ২য় পত্র', slug: 'chemistry-2nd-paper' },
      { name: 'উচ্চতর গণিত ১ম পত্র', slug: 'higher-math-1st-paper' },
      { name: 'উচ্চতর গণিত ২য় পত্র', slug: 'higher-math-2nd-paper' },
      { name: 'জীববিজ্ঞান ১ম পত্র', slug: 'biology-1st-paper' },
      { name: 'জীববিজ্ঞান ২য় পত্র', slug: 'biology-2nd-paper' },
    ],
  },
  {
    level: { name: 'SSC', slug: 'ssc' },
    subjects: [
      { name: 'পদার্থবিজ্ঞান', slug: 'physics' },
      { name: 'রসায়ন', slug: 'chemistry' },
      { name: 'গণিত', slug: 'math' },
      { name: 'জীববিজ্ঞান', slug: 'biology' },
    ],
  },
];

async function main() {
  console.log('🌱 Seeding taxonomy...');

  for (const { level, subjects } of TAXONOMY) {
    const classLevel = await prisma.classLevel.upsert({
      where: { slug: level.slug },
      update: {},
      create: { name: level.name, slug: level.slug },
    });
    console.log(`  ✅ ClassLevel: ${classLevel.name}`);

    for (const sub of subjects) {
      const subject = await prisma.subject.upsert({
        where: { slug: sub.slug },
        update: {},
        create: {
          name: sub.name,
          slug: sub.slug,
          classLevelId: classLevel.id,
        },
      });
      console.log(`     📚 Subject: ${subject.name}`);
    }
  }

  console.log('\n✅ Taxonomy seed complete.');
  console.log('\n📝 Next steps:');
  console.log('   1. Add chapter data per subject (extend this script)');
  console.log('   2. Import question JSON into public/quiz-data/ then run pnpm data:split');
  console.log('   3. Run: pnpm db:push to sync schema, then re-run this script');
}

main()
  .catch(err => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
