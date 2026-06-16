# প্রকল্প পরিচিতি

এইটি একটি Next.js অ্যাপ্লিকেশন যার সঙ্গে Node.js ব্যাকএন্ড/এপিআই স্তর রয়েছে।

ফ্রন্টেন্ড:
- Next.js App Router
- যেখানে সম্ভব React Server Components ব্যবহার করুন
- ইন্টার‌্যাক্টিভ প্রয়োজন হলে মাত্র Client Components ব্যবহার করুন
- স্টাইলিং এর জন্য Tailwind CSS
- TypeScript (strict) ব্যবহার করা উচিত

ব্যাকেন্ড:
- Node.js API রুট/সার্ভার অ্যাকশন
- ডাটাবেস অ্যাক্সেস (Prisma/Drizzle/Mongoose ইত্যাদি)
- অথেন্টিকেশন: NextAuth/Auth.js/JWT জাতীয় উপায়
- পরিবেশ পরিবর্তনশীল `.env.local` এ সংরক্ষণ করুন

# কমান্ডসমূহ

ইনস্টল:
```
npm install
```

ডেভ সার্ভার চালানো:
```
npm run dev
```

প্রোডাকশন বান্ডেল (Build):
```
npm run build
```

লিন্ট চালানো:
```
npm run lint
```

টাইপচেক:
```
npm run typecheck
```

টেস্ট:
```
npm run test
```

# Next.js নিয়মাবলী

- App Router কনভেনশন অনুসরণ করুন।
- রুট ফাইলগুলো `app/` এর ভেতর রাখুন।
- পেজগুলোর জন্য `page.tsx` ব্যবহার করুন।
- লেআউটগুলোর জন্য `layout.tsx` ব্যবহার করুন।
- প্রয়োজন হলে লোডিং UI এর জন্য `loading.tsx` যোগ করুন।
- রুট-লেভেল এরর হ্যান্ডলিং এর জন্য `error.tsx` ব্যবহার করুন।
- ডিফল্টভাবে Server Components প্রেফার করুন।
- শুধুমাত্র তখনই `"use client"` যোগ করুন যখন কম্পোনেন্টে স্টেট, ইফেক্ট, ব্রাউজার API, ইভেন্ট হ্যান্ডলিং বা ক্লায়েন্ট-সাইড লাইব্রেরি দরকার।
- সব কম্পোনেন্টকে Client Component বানাবেন না।
- ইন্টারনাল ন্যাভিগেশনের জন্য `next/link` ব্যবহার করুন।
- অপ্টিমাইজড ইমেজের জন্য `next/image` ব্যবহার করুন।
- স্পষ্ট কোন কারণে না হলে কাঁচা `<img>` ব্যবহার করবেন না।
- SEO মেটাডেটা `metadata` এক্সপোর্ট বা `generateMetadata`-এ রাখুন।

# Node.js / API নিয়মাবলি

- সব ইনকামিং রিকোয়েস্ট ডাটা ভ্যালিডেট করুন।
- `req.body`, সার্চ প্যারাম, হেডার বা কুকি কখনই বিশ্বাস করবেন না — সবসময় যাচাই করুন।
- Zod/Yup বা স্কিমা-ভিত্তিক ভ্যালিডেশন ব্যবহার করুন।
- কনসিস্টেন্ট API রেসপন্স রিটার্ন করুন।
- সঠিক HTTP স্ট্যাটাস কোড ব্যবহার করুন:
  - 200 — সফল
  - 201 — তৈরি হয়েছে
  - 400 — খারাপ ইনপুট
  - 401 — অননুমোদিত (অথেনটিকেশন প্রয়োজন)
  - 403 — নিষিদ্ধ (অথরাইজেশন সমস্যা)
  - 404 — পাওয়া যায়নি
  - 500 — সার্ভার ত্রুটি
- ক্লায়েন্টকে স্ট্যাকট্রেস বা ইন্টারনাল এরর প্রকাশ করবেন না।
- সার্ভার-সাইড ত্রুটি লগ রাখুন (কিন্তু সিক্রেট বিলোপ করবেন না)।
- ব্যবসায়িক লজিক রুট হ্যান্ডলারের বাইরে রাখুন।

# ফাইল স্ট্রাকচার (প্রস্তাবিত)

app/
  page.tsx
  layout.tsx
  api/
  dashboard/
  auth/

components/
  ui/
  shared/
  forms/

lib/
  auth.ts
  db.ts
  utils.ts
  validations/

server/
  services/
  repositories/

types/
  index.ts

prisma/
  schema.prisma

tests/

# কোডিং স্টাইল

- TypeScript ব্যবহার করুন।
- `any` পরিহার করুন।
- API রেসপন্সের জন্য স্পষ্ট টাইপ ব্যবহার করুন।
- কম্পোনেন্টগুলো ছোট ও ফোকাসড রাখুন।
- রিপিটেড লজিক `lib/` বা `server/` এ এক জায়গায় একত্রিত করুন।
- ভ্যালিডেশন লজিক ডুপ্লিকেট করবেন না।
- প্রমিস চেইন না ব্যবহার করে `async/await` প্রেফার করুন।
- নেস্টিং কমাতে early returns ব্যবহার করুন।
- বিদ্যমান নামকরণ কনভেনশন মেনে চলুন।
- অনাবশ্যক ফাইল রিফ্যাক্টর করবেন না।

# সিকিউরিটি নিয়মাবলি

- `.env` বা `.env.local` পরিবর্তন করবেন না যদি না বিশেষভাবে বলা না হয়।
- সিক্রেট, টোকেন, API কী, কুকি বা ডাটাবেস URL কখনই লগ/প্রিন্ট করবেন না।
- সার্ভার-সাইড কোড ক্লায়েন্টে এক্সপোজ করবেন না।
- Client Components-এ ডাটাবেস ক্লায়েন্ট ইমপোর্ট করবেন না।
- কেবল ক্লায়েন্ট-সাইড অথ চেক ভরসা করবেন না — সার্ভারে অথরাইজেশন নিশ্চিত করুন।
- ইউজার ইনপুট সবসময় স্যানিটাইজ ও ভ্যালিডেট করুন।
- ফাইল আপলোড, রিডাইরেক্ট, হুক ও পেমেন্ট লজিক সম্পর্কে সতর্ক থাকুন।

# ডাটাবেস সম্পর্কিত নিয়ম

- মাইগ্রেশন ফাইল বদলানোর আগে পরিবর্তনের ব্যাখ্যা দিন।
- অনুমোদন ছাড়া ডেস্ট্রাকটিভ মাইগ্রেশন করবেন না।
- বড় টেবিল কুয়েরির জন্য প্রাসঙ্গিক ফিল্ডে ইনডেক্স যোগ করুন।
- ডাটাবেস লজিক সার্ভিস/রিপোজিটরি ফাইলেই রাখুন।
- N+1 কুয়েরি এড়াতে সচেতন থাকুন।
- null/undefined রিটার্ন নিরাপদে হ্যান্ডল করুন।

# টেস্টিং নির্দেশাবলি

কমিটের আগে/কাজ শেষে নিচেরগুলি চালান:

```
npm run lint
npm run typecheck
npm run test
npm run build
```

যদি কোনো কমান্ড ফেল করে:
- ত্রুটি দেখান
- মূল কারণ ব্যাখ্যা করুন
- সমস্যার সমাধান করুন
- আবার চালান

# Codex কাজের ধারা (Workflow)

কোডিং শুরু করার আগে:
1. সংশ্লিষ্ট ফাইলগুলো এক্সপ্লোর করুন।
2. বর্তমান আর্কিটেকচার ব্যাখ্যা করুন।
3. কোন ফাইল বদলাতে হবে তা নির্ধারণ করুন।
4. ধাপে ধাপে পরিকল্পনা তৈরি করুন।
5. যদি পরিবর্তন auth, db, payment বা ডেপ্লয়মেন্টকে প্রভাবিত করে, অনুমোদনের জন্য অপেক্ষা করুন।

কোডিং চলাকালীন:
- ছোট-ফোকাসড পরিবর্তন করুন।
- ডিফ দেখান (diff)।
- প্রতিটি পরিবর্তনের কারণ ব্যাখ্যা করুন।
- অনিনির্বাচিত ফাইল স্পর্শ করবেন না।

কোডিং শেষ করার পরে:
- `npm run lint`, `npm run typecheck`, `npm run test`, এবং `npm run build` চালান।
- বদলানো ফাইলগুলোর সারসংক্ষেপ দিন।
- থাকলে ঝুঁকি বা অবশিষ্ট কাজ উল্লেখ করুন।

---

এই ফাইলটিকে Codex এবং নতুন কন্ট্রিবিউটরদের জন্য অথোরিটেটিভ অনবোর্ডিং ডক হিসেবে ব্যবহার করুন।
# Project Overview

This is a Next.js application with a Node.js backend/API layer.

Frontend:
- Next.js App Router
- React Server Components where possible
- Client Components only when interactivity is required
- Tailwind CSS for styling
- TypeScript strict mode

Backend:
- Node.js API routes/server actions
- Database access through Prisma/Drizzle/Mongoose
- Authentication through NextAuth/Auth.js/JWT
- Environment variables stored in `.env.local`

# Commands

Install:
npm install

Run development server:
npm run dev

Build:
npm run build

Lint:
npm run lint

Typecheck:
npm run typecheck

Test:
npm run test

# Next.js Rules

- Use App Router conventions.
- Keep route files inside `app/`.
- Use `page.tsx` for pages.
- Use `layout.tsx` for layouts.
- Use `loading.tsx` for loading UI when needed.
- Use `error.tsx` for route-level error handling when needed.
- Prefer Server Components by default.
- Add `"use client"` only when the component needs state, effects, browser APIs, event handlers, or client-side libraries.
- Do not make every component a Client Component.
- Use `next/link` for internal navigation.
- Use `next/image` for optimized images.
- Do not use raw `<img>` unless there is a clear reason.
- Keep SEO metadata in `metadata` export or `generateMetadata`.

# Node.js/API Rules

- Validate all incoming request data.
- Never trust `req.body`, search params, headers, or cookies without validation.
- Use Zod/Yup/schema validation where possible.
- Return consistent API responses.
- Use proper HTTP status codes:
  - 200 for success
  - 201 for created
  - 400 for bad input
  - 401 for unauthenticated
  - 403 for forbidden
  - 404 for not found
  - 500 for server error
- Do not expose stack traces or internal errors to the client.
- Log useful server-side errors.
- Keep business logic outside route handlers when possible.

# File Structure

Recommended structure:

app/
  page.tsx
  layout.tsx
  api/
  dashboard/
  auth/

components/
  ui/
  shared/
  forms/

lib/
  auth.ts
  db.ts
  utils.ts
  validations/

server/
  services/
  repositories/

types/
  index.ts

prisma/
  schema.prisma

tests/

# Coding Style

- Use TypeScript.
- Avoid `any`.
- Prefer explicit types for API responses.
- Keep components small and focused.
- Extract repeated logic into `lib/` or `server/`.
- Do not duplicate validation logic.
- Use async/await instead of promise chains.
- Use early returns to reduce nesting.
- Follow existing naming conventions.
- Do not randomly refactor unrelated files.

# Security Rules

- Never modify `.env` or `.env.local` unless explicitly asked.
- Never print secrets, tokens, API keys, cookies, or database URLs.
- Never expose server-only code to client components.
- Do not import database clients into Client Components.
- Do not trust client-side auth checks only.
- Always enforce authorization on the server.
- Sanitize/validate user input.
- Be careful with file uploads, redirects, webhooks, and payment logic.

# Database Rules

- Explain any schema change before editing migration files.
- Do not create destructive migrations without confirmation.
- Add indexes when querying large tables by a field.
- Keep database logic in service/repository files when possible.
- Avoid N+1 queries.
- Handle null/undefined database results safely.

# Testing Rules

Before saying the task is complete, run:

npm run lint
npm run typecheck
npm run test
npm run build

If any command fails:
- show the error
- explain the root cause
- fix the issue
- run the command again

# Codex Workflow

Before coding:
1. Explore the relevant files.
2. Explain the current architecture.
3. Identify which files need to change.
4. Make a step-by-step plan.
5. Wait for approval if the change affects auth, database, payments, or deployment.

While coding:
- Make small focused changes.
- Show diffs.
- Explain why each change was made.
- Do not touch unrelated files.

After coding:
- Run lint, typecheck, tests, and build.
- Summarize changed files.
- Mention any remaining risks.