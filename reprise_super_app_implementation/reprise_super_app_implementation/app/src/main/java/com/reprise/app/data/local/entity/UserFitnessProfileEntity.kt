package com.reprise.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "user_fitness_profile")
data class UserFitnessProfileEntity(
    @PrimaryKey val id: Int = 1,
    val uid: String,
    val name: String,
    val age: Int,
    val gender: String,
    val heightCm: Double,
    val weightKg: Double,
    val level: String,
    val equipment: String,
    val hasInjury: Boolean,
    val injuryNote: String?,
    val targetType: String,
    val targetWeightKg: Double?,
    val targetDays: Int,
    val gymDaysPerWeek: Int,
    val sessionMinutes: Int,
    val targetSpeed: String,
    val frequencyMode: String,
    val priorityMuscle: String,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis(),
    val syncStatus: String = "PENDING",
    val lastSyncedAt: Long? = null
)
