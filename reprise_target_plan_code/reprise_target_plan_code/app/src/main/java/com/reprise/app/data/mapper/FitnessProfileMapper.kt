package com.reprise.app.data.mapper

import com.reprise.app.data.local.entity.UserFitnessProfileEntity
import com.reprise.app.domain.model.*

fun UserFitnessProfileEntity.toDomain(): UserFitnessProfile {
    val targetTypeValue = runCatching { BodyTargetType.valueOf(targetType) }
        .getOrDefault(BodyTargetType.GENERAL_FITNESS)

    val speedValue = runCatching { TargetSpeed.valueOf(targetSpeed) }
        .getOrDefault(TargetSpeed.MODERATE)

    val frequencyValue = runCatching { TrainingFrequencyMode.valueOf(frequencyMode) }
        .getOrDefault(TrainingFrequencyMode.NORMAL)

    val priorityValue = runCatching { PriorityMuscle.valueOf(priorityMuscle) }
        .getOrDefault(PriorityMuscle.FULL_BODY)

    return UserFitnessProfile(
        age = age,
        gender = runCatching { Gender.valueOf(gender) }.getOrDefault(Gender.OTHER),
        heightCm = heightCm,
        weightKg = weightKg,
        goal = runCatching { FitnessGoal.valueOf(goal) }.getOrDefault(FitnessGoal.GENERAL_FITNESS),
        level = runCatching { TrainingLevel.valueOf(level) }.getOrDefault(TrainingLevel.BEGINNER),
        daysPerWeek = daysPerWeek.coerceIn(2, 6),
        equipment = runCatching { EquipmentAccess.valueOf(equipment) }.getOrDefault(EquipmentAccess.FULL_GYM),
        hasInjury = hasInjury,
        injuryNote = injuryNote,
        target = WorkoutTarget(
            targetType = targetTypeValue,
            currentWeightKg = weightKg,
            targetWeightKg = targetWeightKg,
            targetDays = targetDays.coerceIn(30, 365),
            gymDaysPerWeek = daysPerWeek.coerceIn(2, 6),
            sessionMinutes = sessionMinutes.coerceIn(25, 90),
            targetSpeed = speedValue,
            frequencyMode = frequencyValue,
            priorityMuscle = priorityValue
        )
    )
}

fun UserFitnessProfile.toEntity(): UserFitnessProfileEntity {
    return UserFitnessProfileEntity(
        age = age,
        gender = gender.name,
        heightCm = heightCm,
        weightKg = weightKg,
        goal = goal.name,
        level = level.name,
        daysPerWeek = target.gymDaysPerWeek.coerceIn(2, 6),
        equipment = equipment.name,
        hasInjury = hasInjury,
        injuryNote = injuryNote,
        targetType = target.targetType.name,
        targetWeightKg = target.targetWeightKg,
        targetDays = target.targetDays.coerceIn(30, 365),
        sessionMinutes = target.sessionMinutes.coerceIn(25, 90),
        targetSpeed = target.targetSpeed.name,
        frequencyMode = target.frequencyMode.name,
        priorityMuscle = target.priorityMuscle.name,
        updatedAt = System.currentTimeMillis()
    )
}
