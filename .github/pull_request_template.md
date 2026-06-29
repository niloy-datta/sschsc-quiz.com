## Summary

<!-- Provide a 2–3 sentence description of what this PR does and why. -->

## Changed Files

<!-- List all files changed in this PR. -->

| File | Change Type | Description |
|------|-------------|-------------|
| `public/questions/...` | Modified | ... |
| `backend/data/answers/...` | Modified | ... |
| `public/images/quiz/premium/...` | Added/Modified | ... |

## Validation Commands Run

<!-- Paste the output of each command. All must pass before merge. -->

```
npm install          ✅ / ❌
npm run lint         ✅ / ❌
npm run typecheck    ✅ / ❌
npm run test         ✅ / ❌
npm run build        ✅ / ❌
```

## Screenshots / SVG Preview

<!-- If any SVG files were changed or added, paste or link previews here. -->

## Manual Review Needed

<!-- List any items that need human review before merging. -->

- [ ] No items need manual review
- [ ] Answer key changes require manual verification
- [ ] New SVG files need visual inspection

## Risk Level

<!-- Choose one: Low / Medium / High and explain briefly -->

**Risk Level:** Low / Medium / High

> Reason: ...

## Checklist

- [ ] I have run `npm install`, `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`
- [ ] I have NOT pushed directly to `main`
- [ ] I have NOT exposed answer keys in public question files
- [ ] Backend answer files are updated to match question changes
- [ ] `answerIndex` is aligned with the option order in each question
- [ ] SVG files (if any) are valid: have `xmlns`, `viewBox`, `role="img"`, `aria-label`
- [ ] No secrets, tokens, or `.env` files are included
