package com.reprise.app.data.local.entity

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "plan_exercises",
    foreignKeys = [
        ForeignKey(
            entity = WorkoutPlanDayEntity::class,
            parentColumns = ["localId"],
            childColumns = ["planDayLocalId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("planDayLocalId")]
)
data class PlanExerciseEntity(
    @PrimaryKey(autoGenerate = true) val localId: Long = 0,
    val planDayLocalId: Long,
    val name: String,
    val muscleGroup: String,
    val sets: Int,
    val reps: String,
    val restSeconds: Int,
    val notes: String
)
