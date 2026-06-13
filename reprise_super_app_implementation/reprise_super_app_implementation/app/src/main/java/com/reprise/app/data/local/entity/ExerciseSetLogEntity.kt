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
            parentColumns = ["localId"],
            childColumns = ["workoutLocalId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("workoutLocalId")]
)
data class ExerciseSetLogEntity(
    @PrimaryKey(autoGenerate = true) val localId: Long = 0,
    val workoutLocalId: Long,
    val exerciseName: String,
    val muscleGroup: String,
    val setNumber: Int,
    val reps: Int,
    val weight: Double,
    val restSeconds: Int?,
    val notes: String?,
    val createdAt: Long = System.currentTimeMillis()
)
