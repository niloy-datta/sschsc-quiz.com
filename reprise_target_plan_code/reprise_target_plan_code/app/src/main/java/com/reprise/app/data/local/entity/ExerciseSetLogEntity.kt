package com.reprise.app.data.local.entity

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "exercise_set_logs",
    foreignKeys = [
        ForeignKey(
            entity = WorkoutLogEntity::class,
            parentColumns = ["id"],
            childColumns = ["workoutId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("workoutId")]
)
data class ExerciseSetLogEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0L,
    val workoutId: Long,
    val exerciseName: String,
    val muscleGroup: String,
    val equipment: String? = null,
    val setNumber: Int,
    val reps: Int,
    val weight: Double,
    val restSeconds: Int? = null,
    val notes: String? = null,
    val createdAt: Long = System.currentTimeMillis()
)
