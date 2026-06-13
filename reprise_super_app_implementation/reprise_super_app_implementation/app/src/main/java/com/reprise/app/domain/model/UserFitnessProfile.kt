package com.reprise.app.domain.model

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
    val uid: String,
    val name: String,
    val age: Int,
    val gender: Gender,
    val heightCm: Double,
    val weightKg: Double,
    val level: TrainingLevel,
    val equipment: EquipmentAccess,
    val hasInjury: Boolean,
    val injuryNote: String?,
    val target: WorkoutTarget
)
