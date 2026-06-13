package com.reprise.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "workout_plan_days")
data class WorkoutPlanDayEntity(
    @PrimaryKey(autoGenerate = true) val localId: Long = 0,
    val planId: String,
    val uid: String,
    val dayNumber: Int,
    val weekNumber: Int,
    val title: String,
    val focus: String,
    val intensity: String,
    val estimatedMinutes: Int,
    val targetMessage: String,
    val nutritionTip: String,
    val safetyNote: String,
    val generatedAt: Long = System.currentTimeMillis()
)
