package com.reprise.app.domain.planner

import com.reprise.app.domain.model.*
import kotlin.math.abs
import kotlin.math.roundToInt

class TargetBasedWorkoutPlanner {

    fun generate30DayPlan(profile: UserFitnessProfile): List<PersonalWorkoutDay> {
        val safe = normalize(profile)
        return (1..30).map { day -> buildDay(day, safe) }
    }

    fun todayPlan(profile: UserFitnessProfile, dayOfMonth: Int): PersonalWorkoutDay {
        val index = ((dayOfMonth - 1) % 30).coerceIn(0, 29)
        return generate30DayPlan(profile)[index]
    }

    private fun buildDay(dayNumber: Int, profile: UserFitnessProfile): PersonalWorkoutDay {
        val week = ((dayNumber - 1) / 7) + 1
        val dayOfWeek = ((dayNumber - 1) % 7) + 1
        val workoutDays = workoutDays(profile.target.gymDaysPerWeek)

        if (dayOfWeek !in workoutDays) return recoveryDay(dayNumber, week, profile)

        val index = workoutDays.indexOf(dayOfWeek)
        val focus = focus(profile, index)
        val exercises = exercises(focus, profile, week)

        return PersonalWorkoutDay(
            planId = "monthly-${profile.uid}-${profile.target.targetType.name}",
            dayNumber = dayNumber,
            weekNumber = week,
            title = "Day $dayNumber - ${title(focus, profile)}",
            focus = focus,
            intensity = intensity(profile, week),
            estimatedMinutes = profile.target.sessionMinutes,
            targetMessage = targetMessage(profile),
            exercises = exercises,
            nutritionTip = nutritionTip(profile),
            safetyNote = safetyNote(profile)
        )
    }

    private fun normalize(profile: UserFitnessProfile): UserFitnessProfile {
        val t = profile.target
        return profile.copy(
            age = profile.age.coerceIn(13, 80),
            heightCm = profile.heightCm.coerceIn(120.0, 230.0),
            weightKg = profile.weightKg.coerceIn(30.0, 220.0),
            target = t.copy(
                currentWeightKg = profile.weightKg.coerceIn(30.0, 220.0),
                targetWeightKg = t.targetWeightKg?.coerceIn(30.0, 220.0),
                targetDays = t.targetDays.coerceIn(30, 365),
                gymDaysPerWeek = t.gymDaysPerWeek.coerceIn(2, 6),
                sessionMinutes = t.sessionMinutes.coerceIn(25, 90)
            )
        )
    }

    private fun workoutDays(days: Int): List<Int> = when (days.coerceIn(2, 6)) {
        2 -> listOf(1, 4)
        3 -> listOf(1, 3, 5)
        4 -> listOf(1, 2, 4, 5)
        5 -> listOf(1, 2, 3, 5, 6)
        else -> listOf(1, 2, 3, 4, 5, 6)
    }

    private fun focus(profile: UserFitnessProfile, index: Int): WorkoutFocus {
        if (profile.target.frequencyMode == TrainingFrequencyMode.HIGH_FREQUENCY) return highFrequencyFocus(profile, index)

        return when (profile.target.targetType) {
            BodyTargetType.LOSE_WEIGHT -> listOf(
                WorkoutFocus.FULL_BODY, WorkoutFocus.CORE_CARDIO, WorkoutFocus.UPPER,
                WorkoutFocus.LOWER, WorkoutFocus.CORE_CARDIO, WorkoutFocus.FULL_BODY
            )[index.coerceAtMost(5)]

            BodyTargetType.GAIN_WEIGHT, BodyTargetType.BUILD_MUSCLE -> listOf(
                WorkoutFocus.PUSH, WorkoutFocus.PULL, WorkoutFocus.LEGS,
                WorkoutFocus.UPPER, WorkoutFocus.LOWER, WorkoutFocus.PRIORITY
            )[index.coerceAtMost(5)]

            BodyTargetType.BUILD_STRENGTH -> listOf(
                WorkoutFocus.UPPER, WorkoutFocus.LOWER, WorkoutFocus.PUSH,
                WorkoutFocus.PULL, WorkoutFocus.LEGS, WorkoutFocus.PRIORITY
            )[index.coerceAtMost(5)]

            BodyTargetType.MAINTAIN_WEIGHT, BodyTargetType.GENERAL_FITNESS -> listOf(
                WorkoutFocus.FULL_BODY, WorkoutFocus.UPPER, WorkoutFocus.LOWER,
                WorkoutFocus.CORE_CARDIO, WorkoutFocus.PUSH, WorkoutFocus.PULL
            )[index.coerceAtMost(5)]
        }
    }

    private fun highFrequencyFocus(profile: UserFitnessProfile, index: Int): WorkoutFocus {
        return when (profile.target.priorityMuscle) {
            PriorityMuscle.CHEST -> listOf(WorkoutFocus.PUSH, WorkoutFocus.PULL, WorkoutFocus.LEGS, WorkoutFocus.PRIORITY, WorkoutFocus.UPPER, WorkoutFocus.CORE_CARDIO)[index.coerceAtMost(5)]
            PriorityMuscle.BACK -> listOf(WorkoutFocus.PULL, WorkoutFocus.PUSH, WorkoutFocus.LEGS, WorkoutFocus.PRIORITY, WorkoutFocus.UPPER, WorkoutFocus.CORE_CARDIO)[index.coerceAtMost(5)]
            PriorityMuscle.LEGS -> listOf(WorkoutFocus.LEGS, WorkoutFocus.UPPER, WorkoutFocus.LOWER, WorkoutFocus.PRIORITY, WorkoutFocus.CORE_CARDIO, WorkoutFocus.FULL_BODY)[index.coerceAtMost(5)]
            PriorityMuscle.ARMS, PriorityMuscle.SHOULDERS, PriorityMuscle.CORE, PriorityMuscle.FULL_BODY ->
                listOf(WorkoutFocus.FULL_BODY, WorkoutFocus.PUSH, WorkoutFocus.PULL, WorkoutFocus.LEGS, WorkoutFocus.PRIORITY, WorkoutFocus.CORE_CARDIO)[index.coerceAtMost(5)]
        }
    }

    private fun exercises(focus: WorkoutFocus, profile: UserFitnessProfile, week: Int): List<PlanExercise> {
        val base = when (focus) {
            WorkoutFocus.FULL_BODY -> fullBody(profile)
            WorkoutFocus.PUSH -> push(profile)
            WorkoutFocus.PULL -> pull(profile)
            WorkoutFocus.LEGS -> legs(profile)
            WorkoutFocus.UPPER -> push(profile).take(2) + pull(profile).take(3)
            WorkoutFocus.LOWER -> legs(profile).take(4) + exercise("Plank", "Core", profile)
            WorkoutFocus.CORE_CARDIO -> coreCardio(profile)
            WorkoutFocus.PRIORITY -> priority(profile)
            WorkoutFocus.MOBILITY -> mobility(profile)
            WorkoutFocus.REST -> emptyList()
        }
        return base.map { progression(it, profile, week) }
    }

    private fun fullBody(p: UserFitnessProfile): List<PlanExercise> = when (p.equipment) {
        EquipmentAccess.NO_EQUIPMENT -> listOf(exercise("Bodyweight Squat","Legs",p), exercise("Push-up","Chest",p), exercise("Glute Bridge","Glutes",p), exercise("Plank","Core",p), exercise("Superman Hold","Back",p))
        EquipmentAccess.HOME_DUMBBELL -> listOf(exercise("Dumbbell Goblet Squat","Legs",p), exercise("Dumbbell Floor Press","Chest",p), exercise("One Arm Dumbbell Row","Back",p), exercise("Dumbbell Romanian Deadlift","Hamstrings",p), exercise("Plank","Core",p))
        EquipmentAccess.FULL_GYM -> listOf(exercise("Barbell Squat","Legs",p), exercise("Bench Press","Chest",p), exercise("Lat Pulldown","Back",p), exercise("Romanian Deadlift","Hamstrings",p), exercise("Cable Crunch","Core",p))
    }

    private fun push(p: UserFitnessProfile): List<PlanExercise> = when (p.equipment) {
        EquipmentAccess.NO_EQUIPMENT -> listOf(exercise("Push-up","Chest",p), exercise("Pike Push-up","Shoulders",p), exercise("Diamond Push-up","Triceps",p), exercise("Bench Dip","Triceps",p))
        EquipmentAccess.HOME_DUMBBELL -> listOf(exercise("Dumbbell Bench Press","Chest",p), exercise("Dumbbell Shoulder Press","Shoulders",p), exercise("Dumbbell Lateral Raise","Shoulders",p), exercise("Dumbbell Triceps Extension","Triceps",p))
        EquipmentAccess.FULL_GYM -> listOf(exercise("Bench Press","Chest",p), exercise("Incline Dumbbell Press","Chest",p), exercise("Machine Shoulder Press","Shoulders",p), exercise("Cable Lateral Raise","Shoulders",p), exercise("Rope Triceps Pushdown","Triceps",p))
    }

    private fun pull(p: UserFitnessProfile): List<PlanExercise> = when (p.equipment) {
        EquipmentAccess.NO_EQUIPMENT -> listOf(exercise("Towel Row","Back",p), exercise("Superman Pull","Back",p), exercise("Reverse Snow Angel","Back",p), exercise("Prone Y Raise","Rear Delt",p))
        EquipmentAccess.HOME_DUMBBELL -> listOf(exercise("One Arm Dumbbell Row","Back",p), exercise("Dumbbell Pullover","Back",p), exercise("Dumbbell Rear Delt Fly","Rear Delt",p), exercise("Dumbbell Curl","Biceps",p))
        EquipmentAccess.FULL_GYM -> listOf(exercise("Lat Pulldown","Back",p), exercise("Seated Cable Row","Back",p), exercise("Face Pull","Rear Delt",p), exercise("Barbell Curl","Biceps",p), exercise("Hammer Curl","Biceps",p))
    }

    private fun legs(p: UserFitnessProfile): List<PlanExercise> {
        val low = lowImpact(p)
        return when (p.equipment) {
            EquipmentAccess.NO_EQUIPMENT -> listOf(exercise(if (low) "Box Squat" else "Bodyweight Squat","Legs",p), exercise("Reverse Lunge","Legs",p), exercise("Glute Bridge","Glutes",p), exercise("Standing Calf Raise","Calves",p))
            EquipmentAccess.HOME_DUMBBELL -> listOf(exercise("Dumbbell Goblet Squat","Legs",p), exercise("Dumbbell Romanian Deadlift","Hamstrings",p), exercise("Dumbbell Split Squat","Legs",p), exercise("Dumbbell Calf Raise","Calves",p))
            EquipmentAccess.FULL_GYM -> listOf(exercise(if (low) "Leg Press" else "Barbell Squat","Legs",p), exercise("Romanian Deadlift","Hamstrings",p), exercise("Leg Curl","Hamstrings",p), exercise("Leg Extension","Quads",p), exercise("Standing Calf Raise","Calves",p))
        }
    }

    private fun coreCardio(p: UserFitnessProfile): List<PlanExercise> {
        val cardio = if (lowImpact(p)) "Incline Walk" else "Treadmill Run"
        return listOf(exercise("Plank","Core",p), exercise("Dead Bug","Core",p), exercise("Mountain Climber","Core",p), exercise(cardio,"Cardio",p), exercise("Side Plank","Core",p))
    }

    private fun priority(p: UserFitnessProfile): List<PlanExercise> = when (p.target.priorityMuscle) {
        PriorityMuscle.CHEST -> listOf(exercise("Incline Dumbbell Press","Chest",p), exercise("Chest Press Machine","Chest",p), exercise("Cable Fly","Chest",p), exercise("Push-up Burnout","Chest",p))
        PriorityMuscle.BACK -> listOf(exercise("Lat Pulldown","Back",p), exercise("Seated Cable Row","Back",p), exercise("Single Arm Row","Back",p), exercise("Face Pull","Rear Delt",p))
        PriorityMuscle.SHOULDERS -> listOf(exercise("Machine Shoulder Press","Shoulders",p), exercise("Cable Lateral Raise","Shoulders",p), exercise("Rear Delt Fly","Rear Delt",p), exercise("Front Raise","Shoulders",p))
        PriorityMuscle.ARMS -> listOf(exercise("Barbell Curl","Biceps",p), exercise("Hammer Curl","Biceps",p), exercise("Rope Pushdown","Triceps",p), exercise("Overhead Triceps Extension","Triceps",p))
        PriorityMuscle.LEGS -> legs(p)
        PriorityMuscle.CORE -> coreCardio(p)
        PriorityMuscle.FULL_BODY -> fullBody(p)
    }

    private fun mobility(p: UserFitnessProfile) = listOf(
        PlanExercise("Light Walk","Cardio",1,"15-25 min",30,"Easy recovery pace"),
        PlanExercise("Shoulder Mobility","Mobility",2,"45 sec",30,"Slow controlled movement"),
        PlanExercise("Hip Opener Stretch","Mobility",2,"45 sec",30,"Do not force range"),
        PlanExercise("Cat Cow","Mobility",2,"12 reps",30,"Control breathing")
    )

    private fun exercise(name: String, muscle: String, p: UserFitnessProfile) =
        PlanExercise(name, muscle, baseSets(p), reps(p), rest(p), notes(p))

    private fun progression(ex: PlanExercise, p: UserFitnessProfile, week: Int): PlanExercise {
        if (p.hasInjury || p.age >= 50) return ex.copy(sets = ex.sets.coerceAtMost(3), notes = ex.notes + " Keep it pain-free and controlled.")
        return when (week) {
            1 -> ex.copy(notes = ex.notes + " Week 1: learn form and keep 2 reps in reserve.")
            2 -> ex.copy(notes = ex.notes + " Week 2: add 1-2 reps if form is clean.")
            3 -> ex.copy(sets = (ex.sets + 1).coerceAtMost(5), notes = ex.notes + " Week 3: highest training week.")
            else -> ex.copy(sets = (ex.sets - 1).coerceAtLeast(2), notes = ex.notes + " Week 4: deload and recover.")
        }
    }

    private fun baseSets(p: UserFitnessProfile): Int {
        val base = when (p.target.targetType) {
            BodyTargetType.BUILD_STRENGTH -> when (p.level) { TrainingLevel.BEGINNER -> 3; TrainingLevel.INTERMEDIATE -> 4; TrainingLevel.ADVANCED -> 5 }
            BodyTargetType.LOSE_WEIGHT -> when (p.level) { TrainingLevel.BEGINNER -> 3; TrainingLevel.INTERMEDIATE -> 3; TrainingLevel.ADVANCED -> 4 }
            else -> when (p.level) { TrainingLevel.BEGINNER -> 3; TrainingLevel.INTERMEDIATE -> 4; TrainingLevel.ADVANCED -> 5 }
        }
        return (base - if (p.hasInjury || p.age >= 50) 1 else 0).coerceIn(2, 5)
    }

    private fun reps(p: UserFitnessProfile) = when (p.target.targetType) {
        BodyTargetType.BUILD_STRENGTH -> when (p.level) { TrainingLevel.BEGINNER -> "5-8 reps"; TrainingLevel.INTERMEDIATE -> "4-6 reps"; TrainingLevel.ADVANCED -> "3-5 reps" }
        BodyTargetType.LOSE_WEIGHT -> "12-15 reps"
        BodyTargetType.GAIN_WEIGHT, BodyTargetType.BUILD_MUSCLE -> "8-12 reps"
        BodyTargetType.MAINTAIN_WEIGHT, BodyTargetType.GENERAL_FITNESS -> "10-12 reps"
    }

    private fun rest(p: UserFitnessProfile) = when (p.target.targetType) {
        BodyTargetType.BUILD_STRENGTH -> 150
        BodyTargetType.GAIN_WEIGHT, BodyTargetType.BUILD_MUSCLE -> 90
        BodyTargetType.LOSE_WEIGHT -> 45
        BodyTargetType.MAINTAIN_WEIGHT, BodyTargetType.GENERAL_FITNESS -> 60
    }

    private fun intensity(p: UserFitnessProfile, week: Int): String {
        if (p.hasInjury) return "Low"
        if (p.age >= 50) return "Low to Moderate"
        val base = when (p.target.targetSpeed) { TargetSpeed.SLOW_SAFE -> "Moderate"; TargetSpeed.MODERATE -> "Moderate+"; TargetSpeed.AGGRESSIVE -> "High" }
        return when (week) { 1 -> "Moderate"; 2 -> base; 3 -> if (p.target.frequencyMode == TrainingFrequencyMode.HIGH_FREQUENCY) "High Frequency" else base; else -> "Deload / Recovery" }
    }

    private fun recoveryDay(day: Int, week: Int, p: UserFitnessProfile) = PersonalWorkoutDay(
        planId = "monthly-${p.uid}-${p.target.targetType.name}",
        dayNumber = day,
        weekNumber = week,
        title = "Day $day - Recovery / Mobility",
        focus = WorkoutFocus.REST,
        intensity = "Recovery",
        estimatedMinutes = 20,
        targetMessage = targetMessage(p),
        exercises = if (p.target.targetType == BodyTargetType.LOSE_WEIGHT)
            listOf(PlanExercise("Light Walk","Cardio",1,"25-40 min",30,"Easy pace for extra calorie burn"), PlanExercise("Mobility Flow","Mobility",2,"10 min",30,"Keep body fresh"))
        else mobility(p),
        nutritionTip = nutritionTip(p),
        safetyNote = safetyNote(p)
    )

    private fun targetMessage(p: UserFitnessProfile): String {
        val tw = p.target.targetWeightKg
        return when {
            p.target.targetType == BodyTargetType.LOSE_WEIGHT && tw != null -> {
                val total = (p.target.currentWeightKg - tw).coerceAtLeast(0.0)
                val weekly = total / (p.target.targetDays / 7.0)
                "Target: lose ${round(total)} kg in ${p.target.targetDays} days. Weekly target: ${round(weekly)} kg."
            }
            p.target.targetType == BodyTargetType.GAIN_WEIGHT && tw != null -> {
                val total = (tw - p.target.currentWeightKg).coerceAtLeast(0.0)
                val weekly = total / (p.target.targetDays / 7.0)
                "Target: gain ${round(total)} kg in ${p.target.targetDays} days. Weekly target: ${round(weekly)} kg."
            }
            p.target.targetType == BodyTargetType.BUILD_STRENGTH -> "Target: increase strength with progressive overload and longer rest."
            p.target.targetType == BodyTargetType.BUILD_MUSCLE -> "Target: build muscle with volume, form, and progressive overload."
            else -> "Target: stay consistent and improve overall fitness."
        }
    }

    private fun nutritionTip(p: UserFitnessProfile) = when (p.target.targetType) {
        BodyTargetType.LOSE_WEIGHT -> "Keep protein high, use a small calorie deficit, and avoid crash dieting."
        BodyTargetType.GAIN_WEIGHT -> "Eat a controlled calorie surplus with protein, carbs, and enough recovery."
        BodyTargetType.BUILD_MUSCLE -> "Prioritize protein, progressive overload, and sleep."
        BodyTargetType.BUILD_STRENGTH -> "Eat enough carbs before training and rest longer between heavy sets."
        BodyTargetType.MAINTAIN_WEIGHT -> "Keep calories stable and focus on consistency."
        BodyTargetType.GENERAL_FITNESS -> "Eat balanced meals and stay hydrated."
    }

    private fun safetyNote(p: UserFitnessProfile): String = when {
        p.hasInjury -> "Injury selected: avoid painful movements and consult a professional if needed."
        p.age < 16 -> "Teen user: avoid max lifting. Focus on form and supervision."
        p.age >= 50 -> "Warm up longer and progress slowly."
        bmi(p) >= 30.0 -> "Use low-impact cardio and avoid sudden high-impact jumps."
        unsafeTarget(p) -> "Target may be aggressive. Use safe pace and adjust if recovery becomes poor."
        else -> "Warm up properly and stop if sharp pain appears."
    }

    private fun notes(p: UserFitnessProfile) = when (p.target.targetType) {
        BodyTargetType.LOSE_WEIGHT -> "Short rest, clean form, keep heart rate active."
        BodyTargetType.GAIN_WEIGHT, BodyTargetType.BUILD_MUSCLE -> "Controlled reps, full range, progressive overload."
        BodyTargetType.BUILD_STRENGTH -> "Heavy but safe load. Rest fully before next set."
        BodyTargetType.MAINTAIN_WEIGHT, BodyTargetType.GENERAL_FITNESS -> "Smooth controlled reps with proper breathing."
    }

    private fun unsafeTarget(p: UserFitnessProfile): Boolean {
        val tw = p.target.targetWeightKg ?: return false
        return abs(p.weightKg - tw) / (p.target.targetDays / 7.0) > 1.0
    }

    private fun title(f: WorkoutFocus, p: UserFitnessProfile) = when (f) {
        WorkoutFocus.FULL_BODY -> "Full Body"
        WorkoutFocus.PUSH -> "Push Day"
        WorkoutFocus.PULL -> "Pull Day"
        WorkoutFocus.LEGS -> "Leg Day"
        WorkoutFocus.UPPER -> "Upper Body"
        WorkoutFocus.LOWER -> "Lower Body"
        WorkoutFocus.CORE_CARDIO -> "Core + Cardio"
        WorkoutFocus.PRIORITY -> "${p.target.priorityMuscle.name.replace("_", " ")} Priority"
        WorkoutFocus.MOBILITY -> "Mobility"
        WorkoutFocus.REST -> "Recovery"
    }

    private fun lowImpact(p: UserFitnessProfile) = p.hasInjury || p.age >= 50 || bmi(p) >= 30.0
    private fun bmi(p: UserFitnessProfile): Double = (p.heightCm / 100.0).let { if (it > 0) p.weightKg / (it * it) else 0.0 }
    private fun round(value: Double): Double = (value * 10).roundToInt() / 10.0
}
