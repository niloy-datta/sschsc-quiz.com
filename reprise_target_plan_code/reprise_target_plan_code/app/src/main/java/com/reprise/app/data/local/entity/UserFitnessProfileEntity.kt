package com.reprise.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "user_fitness_profile")
data class UserFitnessProfileEntity(
    @PrimaryKey
    val id: Int = 1,

    val age: Int,
    val gender: String,
    val heightCm: Double,
    val weightKg: Double,

    val goal: String,
    val level: String,
    val daysPerWeek: Int,
    val equipment: String,

    val hasInjury: Boolean = false,
    val injuryNote: String? = null,

    val targetType: String = "GENERAL_FITNESS",
    val targetWeightKg: Double? = null,
    val targetDays: Int = 30,
    val sessionMinutes: Int = 45,
    val targetSpeed: String = "MODERATE",
    val frequencyMode: String = "NORMAL",
    val priorityMuscle: String = "FULL_BODY",

    val updatedAt: Long = System.currentTimeMillis()
)
