package com.reprise.app.domain.model

enum class Gender { MALE, FEMALE, OTHER }

enum class FitnessGoal { FAT_LOSS, MUSCLE_GAIN, STRENGTH, GENERAL_FITNESS }

enum class TrainingLevel { BEGINNER, INTERMEDIATE, ADVANCED }

enum class EquipmentAccess { NO_EQUIPMENT, HOME_DUMBBELL, FULL_GYM }

enum class BodyTargetType {
    LOSE_WEIGHT,
    GAIN_WEIGHT,
    MAINTAIN_WEIGHT,
    BUILD_MUSCLE,
    BUILD_STRENGTH,
    GENERAL_FITNESS
}

enum class TargetSpeed { SLOW_SAFE, MODERATE, AGGRESSIVE }

enum class TrainingFrequencyMode { NORMAL, HIGH_FREQUENCY }

enum class PriorityMuscle { FULL_BODY, CHEST, BACK, SHOULDERS, ARMS, LEGS, CORE }

enum class WorkoutFocus {
    FULL_BODY,
    PUSH,
    PULL,
    LEGS,
    UPPER,
    LOWER,
    CORE_CARDIO,
    MOBILITY,
    REST,
    PRIORITY
}

data class WorkoutTarget(
    val targetType: BodyTargetType,
    val currentWeightKg: Double,
    val targetWeightKg: Double?,
    val targetDays: Int,
    val gymDaysPerWeek: Int,
    val sessionMinutes: Int,
    val targetSpeed: TargetSpeed,
    val frequencyMode: TrainingFrequencyMode,
    val priorityMuscle: PriorityMuscle
)

data class UserFitnessProfile(
    val age: Int,
    val gender: Gender,
    val heightCm: Double,
    val weightKg: Double,
    val goal: FitnessGoal,
    val level: TrainingLevel,
    val daysPerWeek: Int,
    val equipment: EquipmentAccess,
    val hasInjury: Boolean,
    val injuryNote: String?,
    val target: WorkoutTarget
)

data class PlanExercise(
    val name: String,
    val muscleGroup: String,
    val sets: Int,
    val reps: String,
    val restSeconds: Int,
    val notes: String
)

data class PersonalWorkoutDay(
    val dayNumber: Int,
    val weekNumber: Int,
    val title: String,
    val focus: WorkoutFocus,
    val intensity: String,
    val estimatedMinutes: Int,
    val targetMessage: String,
    val exercises: List<PlanExercise>,
    val nutritionTip: String,
    val safetyNote: String
)
