# Debug Prompts for Aider - dev-quiz-dashboard

## 🐛 Priority Debug Prompts

### Prompt 1: Full Project Diagnosis

```
Perform a complete health check on the dev-quiz-dashboard project:

1. Run npm run typecheck and capture all TypeScript errors
2. Run npm run lint and capture linting issues
3. Run npm run test and report test failures
4. Check for missing dependencies in package.json
5. Review app/layout.tsx and app/page.tsx for any console errors
6. List all TODO/FIXME comments in src/ and app/
7. Check backend/app/main.py for Python syntax/import errors

Summarize findings as a prioritized list of issues to fix.
```

### Prompt 2: Fix TypeScript Strict Mode Violations

```
Fix all TypeScript strict mode errors:

1. Go through src/ and app/ directories
2. Add proper type annotations to all functions and variables
3. Remove or properly type any 'any' types
4. Fix null/undefined handling
5. Ensure all imports have correct types
6. Add return types to all functions

Run npm run typecheck after fixing and ensure zero errors.
```

### Prompt 3: Fix Backend API Errors

```
Debug and fix backend/app/:

1. Check if backend/app/main.py can be imported without errors
2. Verify all route files (quiz.py, user.py, leaderboard.py) are correct
3. Check Firestore connection logic in backend/app/firestore.py
4. Ensure all Pydantic schemas are valid
5. Test that the FastAPI app starts without errors
6. Check for any missing environment variables

Provide a report of what was broken and how it was fixed.
```

### Prompt 4: Frontend Route Issues

```
Check all Next.js routes for issues:

1. Verify all route files in app/ follow naming conventions
2. Check that dynamic routes [slug] are correctly implemented
3. Look for any 404 or redirect issues
4. Ensure layout.tsx is properly structured
5. Check for missing page.tsx files in nested routes
6. Verify API routes in app/api/ have correct response formats
7. Test error boundaries (error.tsx) where needed

Fix any issues and summarize changes.
```

### Prompt 5: Data Integration Issues

```
Debug quiz data integration:

1. Check if scratch/parsed_quizzes.json exists and is valid JSON
2. Verify data loading in backend/app/routes/quiz.py
3. Check if questions are being properly formatted before sending to client
4. Ensure answer keys are stripped before client response
5. Verify Firestore queries are returning data correctly
6. Check for any N+1 query problems
7. Test the full quiz submission flow

Provide data flow diagram and fix any issues.
```

### Prompt 6: Authentication & Security

```
Review and fix authentication issues:

1. Check Firebase token verification in backend
2. Verify session cookie is set correctly with HttpOnly, Secure flags
3. Check JWT token validation logic
4. Ensure API endpoints check authorization properly
5. Look for any hardcoded secrets or API keys
6. Verify CORS settings are correct
7. Check for SQL injection or XSS vulnerabilities

Report security issues found and how they were fixed.
```

### Prompt 7: Performance Optimization

```
Identify and fix performance issues:

1. Check for unused imports in all files
2. Identify components that should be Server Components
3. Find any N+1 query patterns in backend
4. Check image optimization (should use next/image)
5. Look for unnecessary re-renders or state updates
6. Check bundle size and identify large dependencies
7. Review caching strategies

Provide optimization recommendations and implement quick wins.
```

### Prompt 8: Database Sync Issues

```
Debug backend/data/answers/ sync:

1. List all directories and files in backend/data/answers/
2. Check if all board exam years are represented
3. Verify JSON format of answer files
4. Check for missing answer files for existing questions
5. Ensure answer loader service (backend/app/services/answer_loader.py) is working
6. Test loading answers for specific exams
7. Compare question count with answer count

Report missing or misaligned data.
```

### Prompt 9: Build All SVGs Beautiful

```
Enhance all SVG files in public/images/quiz/:

For each SVG file:
1. Add beautiful gradient fills (blue for physics/mitochondria, green for biology/chloroplast, orange for chemistry)
2. Add soft glow effects using SVG filters
3. Improve text hierarchy with better fonts and sizes
4. Make organelles/diagrams more 3D with shadows
5. Add subtle animations if SVG supports it
6. Ensure consistent color scheme across all diagrams
7. Test responsiveness at different sizes

Show list of modified files and display 3-5 examples.
```

### Prompt 10: Make Homepage Beautiful & Fast

```
Improve app/page.tsx (homepage):

1. Add engaging hero section with gradient background
2. Create feature cards showcasing quiz categories
3. Add statistics/leaderboard preview
4. Implement smooth scrolling and animations
5. Add call-to-action buttons (Login, Start Quiz)
6. Make fully responsive for mobile/tablet/desktop
7. Optimize images using next/image
8. Add proper meta tags for SEO
9. Ensure Core Web Vitals pass (LCP, FID, CLS)

Test on mobile and desktop. Show performance metrics.
```

### Prompt 11: Complete Quiz Flow (End-to-End)

```
Build complete quiz flow from start to finish:

1. User clicks quiz → loads questions from API
2. Display question with options and timer
3. User selects answer
4. Submit answer → validate and record in database
5. Show result (correct/wrong with explanation)
6. Save to user's progress
7. Move to next question
8. End quiz → show score & analytics
9. Show weak subjects analysis
10. Save to leaderboard

Ensure all 10 steps work without errors. Test with real data.
```

### Prompt 12: Fix All API Endpoints

```
Audit and fix all API endpoints in backend/app/routes/:

1. GET /api/questions - fix response format and pagination
2. GET /api/quizzes - ensure filtering works
3. POST /api/answers - validate submission payload
4. GET /api/user/profile - check auth middleware
5. PUT /api/user/profile - validate all fields
6. GET /api/leaderboard - ensure correct sorting by score
7. POST /api/quiz/submit - calculate score correctly
8. GET /api/subjects - return all subjects with counts

Test each endpoint with curl. Fix any errors.
Show which endpoints were broken and how they were fixed.
```

### Prompt 13: Make Dark Mode Work Perfectly

```
Ensure dark mode works across entire app:

1. Check all text colors in light mode vs dark mode
2. Ensure contrast ratios meet WCAG AA standards (4.5:1 for text)
3. Fix any text that's hard to read in dark mode
4. Check gradients look good in both modes
5. Ensure images don't look washed out in dark
6. Test on mobile and desktop
7. Ensure theme preference persists on refresh
8. Add smooth transition when switching modes
9. Fix any hardcoded colors that break dark mode

List all colors that need adjustment. Show before/after screenshots.
```

### Prompt 14: Refactor for Server Components

```
Convert unnecessary Client Components to Server Components:

1. Analyze src/components/ - identify components with no interactivity
2. Move state-independent components to Server Components (remove 'use client')
3. Keep Client Components only for: forms, buttons, modals, interactive widgets
4. Check performance improvement with npm run build
5. Ensure no hydration mismatches or console errors

Show which components were changed and why. Report bundle size reduction.
```

### Prompt 15: Add Real-Time Leaderboard Updates

```
Implement real-time features for leaderboard:

1. Add WebSocket or Server-Sent Events (SSE) connection to backend
2. Broadcast leaderboard updates when users submit scores
3. Update live quiz stats in real-time
4. Show notifications when user enters top 10
5. Add fallback to polling if WebSocket fails
6. Ensure no memory leaks from event listeners
7. Test with 10+ concurrent users

Show which endpoints were modified and performance metrics.
```

### Prompt 16: Complete Authentication Flow

```
Fix and test complete auth system:

1. Firebase sign-up with email verification
2. Password reset functionality
3. Session management (JWT token)
4. Logout and session cleanup
5. Refresh token logic
6. Protected routes (redirect to login if not authed)
7. Role-based access (admin, student, teacher)
8. Rate limiting on auth endpoints (max 5 attempts per min)
9. Ensure no credentials are exposed in logs

Test all flows. Ensure no security holes. Show test results.
```

### Prompt 17: Database Query Optimization

```
Optimize database queries and structure:

1. Review all Firestore queries for N+1 problems
2. Add indexes to frequently queried fields
3. Batch operations where possible
4. Add caching for static data (subjects, colleges)
5. Optimize user profile queries
6. Speed up leaderboard queries with pagination
7. Add query result pagination (max 100 per page)
8. Test query performance before/after

Show which queries were optimized and performance improvement %.
```

### Prompt 18: Mobile App Polish

```
Make mobile experience perfect:

1. Fix all responsive layout issues (test on 320px, 375px, 768px screens)
2. Ensure buttons are touch-friendly (min 44x44 pixels)
3. Test on iPhone SE, iPhone 14, Samsung Galaxy A
4. Optimize text size for mobile (readable but not huge)
5. Add mobile-specific navigation (bottom tab bar)
6. Optimize images for mobile bandwidth (use WebP)
7. Add mobile-friendly error pages
8. Test offline mode (cache critical assets)

Screenshot all pages on mobile. List issues found and fixed.
```

### Prompt 19: Accessibility Audit (WCAG 2.1 AA)

```
Ensure app meets WCAG 2.1 AA accessibility standards:

1. Add alt text to all images (descriptive, not "image.jpg")
2. Ensure proper heading hierarchy (h1, h2, h3, etc)
3. Test keyboard navigation (Tab, Enter, Escape keys)
4. Check color contrast using WebAIM Contrast Checker (4.5:1 for text)
5. Add ARIA labels to buttons and form fields
6. Test with screen readers (NVDA or JAWS)
7. Ensure forms are properly labeled
8. Add focus indicators on all interactive elements

Report violations and how to fix them. List fixed items.
```

### Prompt 20: Deploy & Scale Checklist

```
Prepare project for production deployment:

1. Remove all console.log, console.error statements
2. Add error tracking (Sentry or Rollbar)
3. Set up environment variables for production
4. Enable HTTPS/SSL certificates
5. Add rate limiting on all API endpoints
6. Set up CDN for static assets (images, JS bundles)
7. Add monitoring and alerting (CPU, memory, errors)
8. Enable database backups and disaster recovery
9. Set up auto-scaling for backend
10. Create and test deployment checklist

Generate deployment checklist. Verify all critical items are done.
```

---

## 🔧 How to Use These Prompts:

1. Copy any prompt above
2. Open Aider in VS Code: **Ctrl+Shift+P** → "Aider"
3. Paste the prompt into Aider
4. Wait for Aider to analyze and fix issues
5. Review the changes suggested
6. Ask follow-up questions if needed

## ✅ After Debugging:

Run these commands to verify:

```bash
npm run typecheck    # No TypeScript errors
npm run lint         # No linting issues
npm run test         # All tests pass
npm run build        # Builds successfully
```

---

## 🎯 Recommended Order:

1. **Start:** Prompt 1 (Full Diagnosis)
2. **Fix:** Prompt 2 (TypeScript), Prompt 3 (Backend)
3. **Build:** Prompt 10 (Homepage), Prompt 11 (Quiz Flow)
4. **Polish:** Prompt 9 (SVGs), Prompt 13 (Dark Mode), Prompt 19 (Accessibility)
5. **Deploy:** Prompt 20 (Production Checklist)

**Pick any prompt and paste into Aider! 🚀**

### Prompt 21: Antigravity Audit (Repo Scan)

```
Run the Antigravity Audit Engine prompt located at .commandcode/taste/antigravity-prompt.md. Execute a case-insensitive scan for the token "antigravity" across the repository and return a JSON summary with matches, suggested actions, and remediation commands.
```
