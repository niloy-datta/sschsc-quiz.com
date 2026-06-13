package com.reprise.app.data.mapper

import com.reprise.app.data.local.entity.UserFitnessProfileEntity
import com.reprise.app.domain.model.*

fun UserFitnessProfileEntity.toDomain(): UserFitnessProfile {
    return UserFitnessProfile(
        uid = uid,
        name = name,
        age = age,
        gender = enumValueOrDefault(gender, Gender.OTHER),
        heightCm = heightCm,
        weightKg = weightKg,
        level = enumValueOrDefault(level, TrainingLevel.BEGINNER),
        equipment = enumValueOrDefault(equipment, EquipmentAccess.FULL_GYM),
        hasInjury = hasInjury,
        injuryNote = injuryNote,
        target = WorkoutTarget(
            targetType = enumValueOrDefault(targetType, BodyTargetType.GENERAL_FITNESS),
            currentWeightKg = weightKg,
            targetWeightKg = targetWeightKg,
            targetDays = targetDays,
            gymDaysPerWeek = gymDaysPerWeek,
            sessionMinutes = sessionMinutes,
            targetSpeed = enumValueOrDefault(targetSpeed, TargetSpeed.MODERATE),
            frequencyMode = enumValueOrDefault(frequencyMode, TrainingFrequencyMode.NORMAL),
            priorityMuscle = enumValueOrDefault(priorityMuscle, PriorityMuscle.FULL_BODY)
        )
    )
}

fun UserFitnessProfile.toEntity(): UserFitnessProfileEntity {
    return UserFitnessProfileEntity(
        uid = uid,
        name = name,
        age = age,
        gender = gender.name,
        heightCm = heightCm,
        weightKg = weightKg,
        level = level.name,
        equipment = equipment.name,
        hasInjury = hasInjury,
        injuryNote = injuryNote,
        targetType = target.targetType.name,
        targetWeightKg = target.targetWeightKg,
        targetDays = target.targetDays,
        gymDaysPerWeek = target.gymDaysPerWeek,
        sessionMinutes = target.sessionMinutes,
        targetSpeed = target.targetSpeed.name,
        frequencyMode = target.frequencyMode.name,
        priorityMuscle = target.priorityMuscle.name,
        updatedAt = System.currentTimeMillis()
    )
}

inline fun <reified T : Enum<T>> enumValueOrDefault(value: String, default: T): T {
    return runCatching { enumValueOf<T>(value) }.getOrDefault(default)
}
