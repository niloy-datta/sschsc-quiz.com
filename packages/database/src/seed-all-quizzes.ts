import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface ParsedQuestion {
  question_text: string;
  options: {
    A: string;
    B: string;
    C: string;
    D?: string;
  };
  answer: string;
  explanation?: string;
}

// Map path keywords to canonical subject slugs and names
function mapPathToSubject(filePathStr: string): { slug: string; name: string } | null {
  const normalizedPath = filePathStr.toLowerCase().replace(/\\/g, '/');
  
  if (normalizedPath.startsWith('hsc')) {
    if (normalizedPath.includes('ict')) {
      return { slug: 'ict', name: 'Information & Communication Technology (ICT)' };
    }
    
    // Physics
    if (normalizedPath.includes('physics')) {
      if (normalizedPath.includes('1st-paper') || normalizedPath.includes('firstpaper') || normalizedPath.includes('1st')) {
        return { slug: 'physics-1st-paper', name: 'পদার্থবিজ্ঞান ১ম পত্র' };
      }
      if (normalizedPath.includes('2nd-paper') || normalizedPath.includes('secondpaper') || normalizedPath.includes('2nd')) {
        return { slug: 'physics-2nd-paper', name: 'পদার্থবিজ্ঞান ২য় পত্র' };
      }
      return { slug: 'physics-1st-paper', name: 'পদার্থবিজ্ঞান ১ম পত্র' };
    }
    
    // Chemistry
    if (normalizedPath.includes('chemistry')) {
      if (normalizedPath.includes('1st-paper') || normalizedPath.includes('1st')) {
        return { slug: 'chemistry-1st-paper', name: 'রসায়ন ১ম পত্র' };
      }
      if (normalizedPath.includes('2nd-paper') || normalizedPath.includes('2nd')) {
        return { slug: 'chemistry-2nd-paper', name: 'রসায়ন ২য় পত্র' };
      }
      return { slug: 'chemistry-1st-paper', name: 'রসায়ন ১ম পত্র' };
    }
    
    // Higher Math
    if (normalizedPath.includes('higher-math') || normalizedPath.includes('math')) {
      if (normalizedPath.includes('1st-paper') || normalizedPath.includes('1st')) {
        return { slug: 'higher-math-1st-paper', name: 'উচ্চতর গণিত ১ম পত্র' };
      }
      if (normalizedPath.includes('2nd-paper') || normalizedPath.includes('2nd')) {
        return { slug: 'higher-math-2nd-paper', name: 'উচ্চতর গণিত ২য় পত্র' };
      }
      return { slug: 'higher-math-1st-paper', name: 'উচ্চতর গণিত ১ম পত্র' };
    }
    
    // Biology
    if (normalizedPath.includes('biology')) {
      if (normalizedPath.includes('1st-paper') || normalizedPath.includes('1st')) {
        return { slug: 'biology-1st-paper', name: 'জীববিজ্ঞান ১ম পত্র' };
      }
      if (normalizedPath.includes('2nd-paper') || normalizedPath.includes('2nd')) {
        return { slug: 'biology-2nd-paper', name: 'জীববিজ্ঞান ২য় পত্র' };
      }
      return { slug: 'biology-1st-paper', name: 'জীববিজ্ঞান ১ম পত্র' };
    }
  } else if (normalizedPath.startsWith('ssc')) {
    if (normalizedPath.includes('physics')) {
      return { slug: 'physics', name: 'পদার্থবিজ্ঞান' };
    }
    if (normalizedPath.includes('chemistry')) {
      return { slug: 'chemistry', name: 'রসায়ন' };
    }
    if (normalizedPath.includes('general-math') || normalizedPath.includes('math')) {
      return { slug: 'math', name: 'গণিত' };
    }
    if (normalizedPath.includes('higher-math')) {
      return { slug: 'higher-math', name: 'উচ্চতর গণিত' }; // Extra SSC subject
    }
    if (normalizedPath.includes('biology')) {
      return { slug: 'biology', name: 'জীববিজ্ঞান' };
    }
  }
  
  return null;
}

// Clean up chapter name from file path
function extractChapterInfo(filePathStr: string): { slug: string; title: string } {
  // Normalize slash
  const cleanPath = filePathStr.replace(/\\/g, '/');
  const filename = cleanPath.split('/').pop() || 'general';
  const slug = filename.replace('.ts', '').replace('.js', '');
  
  // Format title (replace dashes with spaces and capitalize)
  let title = slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
    
  // If it's a board question, e.g. "dhaka", format it nicer
  if (cleanPath.includes('board-questions/year-wise/')) {
    const parts = cleanPath.split('/');
    const yearIdx = parts.indexOf('year-wise') + 1;
    if (yearIdx > 0 && yearIdx < parts.length) {
      const year = parts[yearIdx];
      title = `${title} Board ${year}`;
    }
  }
  
  return { slug, title };
}

async function main() {
  console.log('📦 Loading parsed quizzes from scratch/parsed_quizzes.json...');
  const jsonPath = path.resolve(process.cwd(), '../../scratch/parsed_quizzes.json');
  
  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ Parsed quizzes JSON not found at: ${jsonPath}`);
    process.exit(1);
  }
  
  const parsedData = JSON.parse(fs.readFileSync(jsonPath, 'utf8')) as Record<string, ParsedQuestion[]>;
  
  console.log('🧹 Cleaning existing questions, chapters, subjects, and class levels from SQLite DB...');
  await prisma.question.deleteMany({});
  await prisma.chapter.deleteMany({});
  await prisma.subject.deleteMany({});
  await prisma.classLevel.deleteMany({});
  console.log('✅ DB clean complete.');
  
  let totalSeeded = 0;
  
  for (const [filePathStr, questions] of Object.entries(parsedData)) {
    // Determine level (HSC or SSC)
    const normalizedPath = filePathStr.toLowerCase().replace(/\\/g, '/');
    const levelSlug = normalizedPath.startsWith('ssc') ? 'ssc' : 'hsc';
    const levelName = levelSlug.toUpperCase();
    
    // Find subject
    const subjectInfo = mapPathToSubject(filePathStr);
    if (!subjectInfo) {
      console.warn(`⚠️ Warning: Could not map subject for path: ${filePathStr}`);
      continue;
    }
    
    // Extract chapter
    const chapterInfo = extractChapterInfo(filePathStr);
    
    // Create/get ClassLevel
    const classLevel = await prisma.classLevel.upsert({
      where: { slug: levelSlug },
      update: {},
      create: { name: levelName, slug: levelSlug }
    });
    
    // Create/get Subject
    const subject = await prisma.subject.upsert({
      where: { slug: subjectInfo.slug },
      update: {},
      create: {
        name: subjectInfo.name,
        slug: subjectInfo.slug,
        classLevelId: classLevel.id
      }
    });
    
    // Create/get Chapter (scoped unique slug per subject to avoid global collision)
    const chapterSlugScoped = `${subject.slug}-${chapterInfo.slug}`;
    const chapter = await prisma.chapter.upsert({
      where: { slug: chapterSlugScoped },
      update: {},
      create: {
        title: chapterInfo.title,
        slug: chapterSlugScoped,
        subjectId: subject.id
      }
    });
    
    // Batch create questions for this chapter
    const questionsData = questions.map(q => {
      const optionA = q.options.A || '';
      const optionB = q.options.B || '';
      const optionC = q.options.C || '';
      const optionD = q.options.D || '';
      
      return {
        questionText: q.question_text,
        optionA,
        optionB,
        optionC,
        optionD,
        correctOption: q.answer,
        explanation: q.explanation || null,
        subjectId: subject.id,
        chapterId: chapter.id,
        category: levelName,
        isLive: normalizedPath.includes('live') || normalizedPath.includes('model-tests')
      };
    });
    
    // Use createMany to seed questions fast
    const result = await prisma.question.createMany({
      data: questionsData
    });
    
    totalSeeded += result.count;
    console.log(`  🚀 Seeded ${result.count} questions into ${levelName} > ${subjectInfo.name} > ${chapterInfo.title}`);
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`🎉 SUCCESS! Seeded a total of ${totalSeeded} questions into dev.db.`);
  console.log('='.repeat(50));
}

main()
  .catch(err => {
    console.error('❌ Database seeding failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
