package com.reprise.app.domain.planner

import com.reprise.app.domain.model.*
import kotlin.math.abs
import kotlin.math.roundToInt

class TargetBasedWorkoutPlanner {

    fun generate30DayPlan(profile: UserFitnessProfile): List<PersonalWorkoutDay> {
        val safeProfile = normalizeProfile(profile)
        return (1..30).map { day -> buildTargetBasedDay(day, safeProfile) }
    }

    fun getMonthlyRepeatDay(
        profile: UserFitnessProfile,
        calendarDayOfMonth: Int
    ): PersonalWorkoutDay {
        val plan = generate30DayPlan(profile)
        val index = ((calendarDayOfMonth - 1) % 30).coerceIn(0, 29)
        return plan[index]
    }

    private fun buildTargetBasedDay(dayNumber: Int, profile: UserFitnessProfile): PersonalWorkoutDay {
        val weekNumber = ((dayNumber - 1) / 7) + 1
        val dayOfWeek = ((dayNumber - 1) % 7) + 1
        val workoutDays = workoutDaysFor(profile.target.gymDaysPerWeek)

        if (dayOfWeek !in workoutDays) {
            return restOrMobilityDay(dayNumber, weekNumber, profile)
        }

        val workoutIndex = workoutDays.indexOf(dayOfWeek)
        val focus = focusByTarget(profile, workoutIndex)
        val exercises = exercisesByFocusAndTarget(focus, profile, weekNumber)

        return PersonalWorkoutDay(
            dayNumber = dayNumber,
            weekNumber = weekNumber,
            title = "Day $dayNumber - ${titleForFocus(focus, profile)}",
            focus = focus,
            intensity = intensityByTarget(profile, weekNumber),
            estimatedMinutes = profile.target.sessionMinutes,
            targetMessage = targetMessage(profile),
            exercises = exercises,
            nutritionTip = nutritionTipByTarget(profile),
            safetyNote = safetyNote(profile)
        )
    }

    private fun normalizeProfile(profile: UserFitnessProfile): UserFitnessProfile {
        val target = profile.target
        return profile.copy(
            age = profile.age.coerceIn(13, 80),
            heightCm = profile.heightCm.coerceIn(120.0, 230.0),
            weightKg = profile.weightKg.coerceIn(30.0, 220.0),
            daysPerWeek = profile.daysPerWeek.coerceIn(2, 6),
            target = target.copy(
                currentWeightKg = profile.weightKg.coerceIn(30.0, 220.0),
                targetWeightKg = target.targetWeightKg?.coerceIn(30.0, 220.0),
                targetDays = target.targetDays.coerceIn(30, 365),
                gymDaysPerWeek = target.gymDaysPerWeek.coerceIn(2, 6),
                sessionMinutes = target.sessionMinutes.coerceIn(25, 90)
            )
        )
    }

    private fun workoutDaysFor(daysPerWeek: Int): List<Int> {
        return when (daysPerWeek.coerceIn(2, 6)) {
            2 -> listOf(1, 4)
            3 -> listOf(1, 3, 5)
            4 -> listOf(1, 2, 4, 5)
            5 -> listOf(1, 2, 3, 5, 6)
            else -> listOf(1, 2, 3, 4, 5, 6)
        }
    }

    private fun focusByTarget(profile: UserFitnessProfile, workoutIndex: Int): WorkoutFocus {
        val target = profile.target
        if (target.frequencyMode == TrainingFrequencyMode.HIGH_FREQUENCY) {
            return highFrequencyFocus(profile, workoutIndex)
        }

        return when (target.targetType) {
            BodyTargetType.LOSE_WEIGHT -> listOf(
                WorkoutFocus.FULL_BODY,
                WorkoutFocus.CORE_CARDIO,
                WorkoutFocus.UPPER,
                WorkoutFocus.LOWER,
                WorkoutFocus.CORE_CARDIO,
                WorkoutFocus.FULL_BODY
            )[workoutIndex.coerceAtMost(5)]

            BodyTargetType.GAIN_WEIGHT,
            BodyTargetType.BUILD_MUSCLE -> listOf(
                WorkoutFocus.PUSH,
                WorkoutFocus.PULL,
                WorkoutFocus.LEGS,
                WorkoutFocus.UPPER,
                WorkoutFocus.LOWER,
                WorkoutFocus.PRIORITY
            )[workoutIndex.coerceAtMost(5)]

            BodyTargetType.BUILD_STRENGTH -> listOf(
                WorkoutFocus.UPPER,
                WorkoutFocus.LOWER,
                WorkoutFocus.PUSH,
                WorkoutFocus.PULL,
                WorkoutFocus.LEGS,
                WorkoutFocus.PRIORITY
            )[workoutIndex.coerceAtMost(5)]

            BodyTargetType.MAINTAIN_WEIGHT,
            BodyTargetType.GENERAL_FITNESS -> listOf(
                WorkoutFocus.FULL_BODY,
                WorkoutFocus.UPPER,
                WorkoutFocus.LOWER,
                WorkoutFocus.CORE_CARDIO,
                WorkoutFocus.PUSH,
                WorkoutFocus.PULL
            )[workoutIndex.coerceAtMost(5)]
        }
    }

    private fun highFrequencyFocus(profile: UserFitnessProfile, workoutIndex: Int): WorkoutFocus {
        return when (profile.target.priorityMuscle) {
            PriorityMuscle.CHEST -> listOf(
                WorkoutFocus.PUSH,
                WorkoutFocus.PULL,
                WorkoutFocus.LEGS,
                WorkoutFocus.PRIORITY,
                WorkoutFocus.UPPER,
                WorkoutFocus.CORE_CARDIO
            )[workoutIndex.coerceAtMost(5)]

            PriorityMuscle.BACK -> listOf(
                WorkoutFocus.PULL,
                WorkoutFocus.PUSH,
                WorkoutFocus.LEGS,
                WorkoutFocus.PRIORITY,
                WorkoutFocus.UPPER,
                WorkoutFocus.CORE_CARDIO
            )[workoutIndex.coerceAtMost(5)]

            PriorityMuscle.LEGS -> listOf(
                WorkoutFocus.LEGS,
                WorkoutFocus.UPPER,
                WorkoutFocus.LOWER,
                WorkoutFocus.PRIORITY,
                WorkoutFocus.CORE_CARDIO,
                WorkoutFocus.FULL_BODY
            )[workoutIndex.coerceAtMost(5)]

            PriorityMuscle.ARMS,
            PriorityMuscle.SHOULDERS,
            PriorityMuscle.CORE,
            PriorityMuscle.FULL_BODY -> listOf(
                WorkoutFocus.FULL_BODY,
                WorkoutFocus.PUSH,
                WorkoutFocus.PULL,
                WorkoutFocus.LEGS,
                WorkoutFocus.PRIORITY,
                WorkoutFocus.CORE_CARDIO
            )[workoutIndex.coerceAtMost(5)]
        }
    }

    private fun exercisesByFocusAndTarget(
        focus: WorkoutFocus,
        profile: UserFitnessProfile,
        weekNumber: Int
    ): List<PlanExercise> {
        val base = when (focus) {
            WorkoutFocus.FULL_BODY -> fullBody(profile)
            WorkoutFocus.PUSH -> push(profile)
            WorkoutFocus.PULL -> pull(profile)
            WorkoutFocus.LEGS -> legs(profile)
            WorkoutFocus.UPPER -> upper(profile)
            WorkoutFocus.LOWER -> lower(profile)
            WorkoutFocus.CORE_CARDIO -> coreCardio(profile)
            WorkoutFocus.PRIORITY -> priorityExercises(profile)
            WorkoutFocus.MOBILITY -> mobility(profile)
            WorkoutFocus.REST -> emptyList()
        }
        return base.map { applyTargetProgression(it, profile, weekNumber) }
    }

    private fun fullBody(profile: UserFitnessProfile): List<PlanExercise> {
        return when (profile.equipment) {
            EquipmentAccess.NO_EQUIPMENT -> listOf(
                exercise("Bodyweight Squat", "Legs", profile),
                exercise("Push-up", "Chest", profile),
                exercise("Glute Bridge", "Glutes", profile),
                exercise("Plank", "Core", profile),
                exercise("Superman Hold", "Back", profile)
            )

            EquipmentAccess.HOME_DUMBBELL -> listOf(
                exercise("Dumbbell Goblet Squat", "Legs", profile),
                exercise("Dumbbell Floor Press", "Chest", profile),
                exercise("One Arm Dumbbell Row", "Back", profile),
                exercise("Dumbbell Romanian Deadlift", "Hamstrings", profile),
                exercise("Plank", "Core", profile)
            )

            EquipmentAccess.FULL_GYM -> listOf(
                exercise("Barbell Squat", "Legs", profile),
                exercise("Bench Press", "Chest", profile),
                exercise("Lat Pulldown", "Back", profile),
                exercise("Romanian Deadlift", "Hamstrings", profile),
                exercise("Cable Crunch", "Core", profile)
            )
        }
    }

    private fun push(profile: UserFitnessProfile): List<PlanExercise> {
        return when (profile.equipment) {
            EquipmentAccess.NO_EQUIPMENT -> listOf(
                exercise("Push-up", "Chest", profile),
                exercise("Pike Push-up", "Shoulders", profile),
                exercise("Diamond Push-up", "Triceps", profile),
                exercise("Bench Dip", "Triceps", profile)
            )

            EquipmentAccess.HOME_DUMBBELL -> listOf(
                exercise("Dumbbell Bench Press", "Chest", profile),
                exercise("Dumbbell Shoulder Press", "Shoulders", profile),
                exercise("Dumbbell Lateral Raise", "Shoulders", profile),
                exercise("Dumbbell Triceps Extension", "Triceps", profile)
            )

            EquipmentAccess.FULL_GYM -> listOf(
                exercise("Bench Press", "Chest", profile),
                exercise("Incline Dumbbell Press", "Chest", profile),
                exercise("Machine Shoulder Press", "Shoulders", profile),
                exercise("Cable Lateral Raise", "Shoulders", profile),
                exercise("Rope Triceps Pushdown", "Triceps", profile)
            )
        }
    }

    private fun pull(profile: UserFitnessProfile): List<PlanExercise> {
        return when (profile.equipment) {
            EquipmentAccess.NO_EQUIPMENT -> listOf(
                exercise("Towel Row", "Back", profile),
                exercise("Superman Pull", "Back", profile),
                exercise("Reverse Snow Angel", "Back", profile),
                exercise("Prone Y Raise", "Rear Delt", profile)
            )

            EquipmentAccess.HOME_DUMBBELL -> listOf(
                exercise("One Arm Dumbbell Row", "Back", profile),
                exercise("Dumbbell Pullover", "Back", profile),
                exercise("Dumbbell Rear Delt Fly", "Rear Delt", profile),
                exercise("Dumbbell Curl", "Biceps", profile)
            )

            EquipmentAccess.FULL_GYM -> listOf(
                exercise("Lat Pulldown", "Back", profile),
                exercise("Seated Cable Row", "Back", profile),
                exercise("Face Pull", "Rear Delt", profile),
                exercise("Barbell Curl", "Biceps", profile),
                exercise("Hammer Curl", "Biceps", profile)
            )
        }
    }

    private fun legs(profile: UserFitnessProfile): List<PlanExercise> {
        val lowImpact = lowImpactNeeded(profile)
        return when (profile.equipment) {
            EquipmentAccess.NO_EQUIPMENT -> listOf(
                exercise(if (lowImpact) "Box Squat" else "Bodyweight Squat", "Legs", profile),
                exercise("Reverse Lunge", "Legs", profile),
                exercise("Glute Bridge", "Glutes", profile),
                exercise("Standing Calf Raise", "Calves", profile)
            )

            EquipmentAccess.HOME_DUMBBELL -> listOf(
                exercise("Dumbbell Goblet Squat", "Legs", profile),
                exercise("Dumbbell Romanian Deadlift", "Hamstrings", profile),
                exercise("Dumbbell Split Squat", "Legs", profile),
                exercise("Dumbbell Calf Raise", "Calves", profile)
            )

            EquipmentAccess.FULL_GYM -> listOf(
                exercise(if (lowImpact) "Leg Press" else "Barbell Squat", "Legs", profile),
                exercise("Romanian Deadlift", "Hamstrings", profile),
                exercise("Leg Curl", "Hamstrings", profile),
                exercise("Leg Extension", "Quads", profile),
                exercise("Standing Calf Raise", "Calves", profile)
            )
        }
    }

    private fun upper(profile: UserFitnessProfile): List<PlanExercise> {
        return push(profile).take(2) + pull(profile).take(3)
    }

    private fun lower(profile: UserFitnessProfile): List<PlanExercise> {
        return legs(profile).take(4) + listOf(exercise("Plank", "Core", profile))
    }

    private fun coreCardio(profile: UserFitnessProfile): List<PlanExercise> {
        val cardio = if (lowImpactNeeded(profile)) "Incline Walk" else "Treadmill Run"
        return listOf(
            exercise("Plank", "Core", profile),
            exercise("Dead Bug", "Core", profile),
            exercise("Mountain Climber", "Core", profile),
            exercise(cardio, "Cardio", profile),
            exercise("Side Plank", "Core", profile)
        )
    }

    private fun priorityExercises(profile: UserFitnessProfile): List<PlanExercise> {
        return when (profile.target.priorityMuscle) {
            PriorityMuscle.CHEST -> listOf(
                exercise("Incline Dumbbell Press", "Chest", profile),
                exercise("Chest Press Machine", "Chest", profile),
                exercise("Cable Fly", "Chest", profile),
                exercise("Push-up Burnout", "Chest", profile)
            )

            PriorityMuscle.BACK -> listOf(
                exercise("Lat Pulldown", "Back", profile),
                exercise("Seated Cable Row", "Back", profile),
                exercise("Single Arm Row", "Back", profile),
                exercise("Face Pull", "Rear Delt", profile)
            )

            PriorityMuscle.SHOULDERS -> listOf(
                exercise("Machine Shoulder Press", "Shoulders", profile),
                exercise("Cable Lateral Raise", "Shoulders", profile),
                exercise("Rear Delt Fly", "Rear Delt", profile),
                exercise("Front Raise", "Shoulders", profile)
            )

            PriorityMuscle.ARMS -> listOf(
                exercise("Barbell Curl", "Biceps", profile),
                exercise("Hammer Curl", "Biceps", profile),
                exercise("Rope Pushdown", "Triceps", profile),
                exercise("Overhead Triceps Extension", "Triceps", profile)
            )

            PriorityMuscle.LEGS -> legs(profile)
            PriorityMuscle.CORE -> coreCardio(profile)
            PriorityMuscle.FULL_BODY -> fullBody(profile)
        }
    }

    private fun mobility(profile: UserFitnessProfile): List<PlanExercise> {
        return listOf(
            PlanExercise("Light Walk", "Cardio", 1, "15-25 min", 30, "Easy recovery pace."),
            PlanExercise("Shoulder Mobility", "Mobility", 2, "45 sec", 30, "Slow controlled movement."),
            PlanExercise("Hip Opener Stretch", "Mobility", 2, "45 sec", 30, "Do not force range."),
            PlanExercise("Cat Cow", "Mobility", 2, "12 reps", 30, "Control breathing.")
        )
    }

    private fun exercise(name: String, muscleGroup: String, profile: UserFitnessProfile): PlanExercise {
        return PlanExercise(
            name = name,
            muscleGroup = muscleGroup,
            sets = baseSets(profile),
            reps = repRange(profile),
            restSeconds = restSeconds(profile),
            notes = notesByTarget(profile)
        )
    }

    private fun applyTargetProgression(
        exercise: PlanExercise,
        profile: UserFitnessProfile,
        weekNumber: Int
    ): PlanExercise {
        if (profile.hasInjury || profile.age >= 50) {
            return exercise.copy(
                sets = exercise.sets.coerceAtMost(3),
                notes = exercise.notes + " Keep it pain-free and controlled."
            )
        }

        return when (weekNumber) {
            1 -> exercise.copy(notes = exercise.notes + " Week 1: learn form and keep 2 reps in reserve.")
            2 -> exercise.copy(notes = exercise.notes + " Week 2: add 1-2 reps if form is clean.")
            3 -> exercise.copy(
                sets = (exercise.sets + 1).coerceAtMost(5),
                notes = exercise.notes + " Week 3: highest training week."
            )
            else -> exercise.copy(
                sets = (exercise.sets - 1).coerceAtLeast(2),
                notes = exercise.notes + " Week 4: deload and recover."
            )
        }
    }

    private fun baseSets(profile: UserFitnessProfile): Int {
        val base = when (profile.target.targetType) {
            BodyTargetType.BUILD_STRENGTH -> when (profile.level) {
                TrainingLevel.BEGINNER -> 3
                TrainingLevel.INTERMEDIATE -> 4
                TrainingLevel.ADVANCED -> 5
            }
            BodyTargetType.LOSE_WEIGHT -> when (profile.level) {
                TrainingLevel.BEGINNER -> 3
                TrainingLevel.INTERMEDIATE -> 3
                TrainingLevel.ADVANCED -> 4
            }
            else -> when (profile.level) {
                TrainingLevel.BEGINNER -> 3
                TrainingLevel.INTERMEDIATE -> 4
                TrainingLevel.ADVANCED -> 5
            }
        }

        val reduction = if (profile.hasInjury || profile.age >= 50) 1 else 0
        return (base - reduction).coerceIn(2, 5)
    }

    private fun repRange(profile: UserFitnessProfile): String {
        return when (profile.target.targetType) {
            BodyTargetType.BUILD_STRENGTH -> when (profile.level) {
                TrainingLevel.BEGINNER -> "5-8 reps"
                TrainingLevel.INTERMEDIATE -> "4-6 reps"
                TrainingLevel.ADVANCED -> "3-5 reps"
            }
            BodyTargetType.LOSE_WEIGHT -> "12-15 reps"
            BodyTargetType.GAIN_WEIGHT,
            BodyTargetType.BUILD_MUSCLE -> "8-12 reps"
            BodyTargetType.MAINTAIN_WEIGHT,
            BodyTargetType.GENERAL_FITNESS -> "10-12 reps"
        }
    }

    private fun restSeconds(profile: UserFitnessProfile): Int {
        return when (profile.target.targetType) {
            BodyTargetType.BUILD_STRENGTH -> 150
            BodyTargetType.GAIN_WEIGHT,
            BodyTargetType.BUILD_MUSCLE -> 90
            BodyTargetType.LOSE_WEIGHT -> 45
            BodyTargetType.MAINTAIN_WEIGHT,
            BodyTargetType.GENERAL_FITNESS -> 60
        }
    }

    private fun intensityByTarget(profile: UserFitnessProfile, weekNumber: Int): String {
        if (profile.hasInjury) return "Low"
        if (profile.age >= 50) return "Low to Moderate"

        val base = when (profile.target.targetSpeed) {
            TargetSpeed.SLOW_SAFE -> "Moderate"
            TargetSpeed.MODERATE -> "Moderate+"
            TargetSpeed.AGGRESSIVE -> "High"
        }

        return when (weekNumber) {
            1 -> "Moderate"
            2 -> base
            3 -> if (profile.target.frequencyMode == TrainingFrequencyMode.HIGH_FREQUENCY) "High Frequency" else base
            else -> "Deload / Recovery"
        }
    }

    private fun restOrMobilityDay(dayNumber: Int, weekNumber: Int, profile: UserFitnessProfile): PersonalWorkoutDay {
        val exercises = when (profile.target.targetType) {
            BodyTargetType.LOSE_WEIGHT -> listOf(
                PlanExercise("Light Walk", "Cardio", 1, "25-40 min", 30, "Easy pace for extra calorie burn."),
                PlanExercise("Mobility Flow", "Mobility", 2, "10 min", 30, "Keep body fresh.")
            )
            else -> mobility(profile)
        }

        return PersonalWorkoutDay(
            dayNumber = dayNumber,
            weekNumber = weekNumber,
            title = "Day $dayNumber - Recovery / Mobility",
            focus = WorkoutFocus.REST,
            intensity = "Recovery",
            estimatedMinutes = 20,
            targetMessage = targetMessage(profile),
            exercises = exercises,
            nutritionTip = nutritionTipByTarget(profile),
            safetyNote = safetyNote(profile)
        )
    }

    private fun targetMessage(profile: UserFitnessProfile): String {
        val target = profile.target
        val targetWeight = target.targetWeightKg
        return when {
            target.targetType == BodyTargetType.LOSE_WEIGHT && targetWeight != null -> {
                val totalLoss = (target.currentWeightKg - targetWeight).coerceAtLeast(0.0)
                val weekly = totalLoss / (target.targetDays / 7.0)
                "Target: lose ${round(totalLoss)} kg in ${target.targetDays} days. Weekly target: ${round(weekly)} kg."
            }
            target.targetType == BodyTargetType.GAIN_WEIGHT && targetWeight != null -> {
                val totalGain = (targetWeight - target.currentWeightKg).coerceAtLeast(0.0)
                val weekly = totalGain / (target.targetDays / 7.0)
                "Target: gain ${round(totalGain)} kg in ${target.targetDays} days. Weekly target: ${round(weekly)} kg."
            }
            target.targetType == BodyTargetType.BUILD_STRENGTH -> "Target: increase strength with progressive overload and longer rest."
            target.targetType == BodyTargetType.BUILD_MUSCLE -> "Target: build muscle with volume, form, and progressive overload."
            else -> "Target: stay consistent and improve overall fitness."
        }
    }

    private fun nutritionTipByTarget(profile: UserFitnessProfile): String {
        return when (profile.target.targetType) {
            BodyTargetType.LOSE_WEIGHT -> "Keep protein high, use a small calorie deficit, and avoid crash dieting."
            BodyTargetType.GAIN_WEIGHT -> "Eat a controlled calorie surplus with protein, carbs, and enough recovery."
            BodyTargetType.BUILD_MUSCLE -> "Prioritize protein, progressive overload, and sleep."
            BodyTargetType.BUILD_STRENGTH -> "Eat enough carbs before training and rest longer between heavy sets."
            BodyTargetType.MAINTAIN_WEIGHT -> "Keep calories stable and focus on consistency."
            BodyTargetType.GENERAL_FITNESS -> "Eat balanced meals and stay hydrated."
        }
    }

    private fun safetyNote(profile: UserFitnessProfile): String {
        return when {
            profile.hasInjury -> "Injury selected: avoid painful movements and consult a professional if needed."
            profile.age < 16 -> "Teen user: avoid max lifting. Focus on form and supervision."
            profile.age >= 50 -> "Warm up longer and progress slowly."
            bmi(profile) >= 30.0 -> "Use low-impact cardio and avoid sudden high-impact jumps."
            unsafeWeightTarget(profile) -> "Target may be aggressive. Use safe pace and adjust if recovery becomes poor."
            else -> "Warm up properly and stop if sharp pain appears."
        }
    }

    private fun unsafeWeightTarget(profile: UserFitnessProfile): Boolean {
        val targetWeight = profile.target.targetWeightKg ?: return false
        val difference = abs(profile.weightKg - targetWeight)
        val weeklyChange = difference / (profile.target.targetDays / 7.0)
        return weeklyChange > 1.0
    }

    private fun notesByTarget(profile: UserFitnessProfile): String {
        return when (profile.target.targetType) {
            BodyTargetType.LOSE_WEIGHT -> "Short rest, clean form, keep heart rate active."
            BodyTargetType.GAIN_WEIGHT,
            BodyTargetType.BUILD_MUSCLE -> "Controlled reps, full range, progressive overload."
            BodyTargetType.BUILD_STRENGTH -> "Heavy but safe load. Rest fully before next set."
            BodyTargetType.MAINTAIN_WEIGHT,
            BodyTargetType.GENERAL_FITNESS -> "Smooth controlled reps with proper breathing."
        }
    }

    private fun titleForFocus(focus: WorkoutFocus, profile: UserFitnessProfile): String {
        return when (focus) {
            WorkoutFocus.FULL_BODY -> "Full Body"
            WorkoutFocus.PUSH -> "Push Day"
            WorkoutFocus.PULL -> "Pull Day"
            WorkoutFocus.LEGS -> "Leg Day"
            WorkoutFocus.UPPER -> "Upper Body"
            WorkoutFocus.LOWER -> "Lower Body"
            WorkoutFocus.CORE_CARDIO -> "Core + Cardio"
            WorkoutFocus.PRIORITY -> "${profile.target.priorityMuscle.name.replace("_", " ")} Priority"
            WorkoutFocus.MOBILITY -> "Mobility"
            WorkoutFocus.REST -> "Recovery"
        }
    }

    private fun lowImpactNeeded(profile: UserFitnessProfile): Boolean {
        return profile.hasInjury || profile.age >= 50 || bmi(profile) >= 30.0
    }

    private fun bmi(profile: UserFitnessProfile): Double {
        val meter = profile.heightCm / 100.0
        return if (meter > 0) profile.weightKg / (meter * meter) else 0.0
    }

    private fun round(value: Double): Double = (value * 10).roundToInt() / 10.0
}
