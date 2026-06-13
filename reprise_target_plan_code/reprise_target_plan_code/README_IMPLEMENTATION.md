# RepRise Target-Based 30-Day Workout Planner Module

This package is for an existing RepRise Android app. Do not rebuild the project from scratch. Merge these files into the existing app package `com.reprise.app`.

## What this adds

- User fitness profile saved in Room
- Target-based 30-day workout plan
- Weight loss, weight gain, muscle gain, strength, maintain, general fitness logic
- Gym days per week logic
- Session duration logic
- High-frequency training mode
- Priority muscle mode
- Injury, age, BMI safety adjustment
- Monthly repeat logic: day 1 to day 30 repeats every month
- Compose screen for profile + generated plan
- Hilt repository/planner injection
- Navigation route and dashboard button

## Merge order

1. Add domain models.
2. Add Room entity and DAO.
3. Update `RepRiseDatabase` to version 3.
4. Add migrations.
5. Add mapper.
6. Add repository.
7. Add planner engine.
8. Add `PersonalPlanViewModel`.
9. Add Compose screen.
10. Add route `PERSONAL_PLAN`.
11. Add Dashboard button.
12. Run `./gradlew clean build`.

## Important

- Keep your current MVVM + Room + Compose architecture.
- Do not delete existing workout tracking/history/progress code.
- If your existing package name is different, replace `com.reprise.app` with your package.
