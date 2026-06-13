package com.reprise.app.domain.model

enum class Gender { MALE, FEMALE, OTHER }

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
    PRIORITY,
    REST
}

enum class SyncStatus { PENDING, SYNCED, FAILED, DELETED_PENDING }
