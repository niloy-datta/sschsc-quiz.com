package com.reprise.app.data.local.entity

import androidx.room.Embedded
import androidx.room.Relation

data class WorkoutWithSets(
    @Embedded val workout: WorkoutLogEntity,
    @Relation(
        parentColumn = "id",
        entityColumn = "workoutId"
    )
    val sets: List<ExerciseSetLogEntity>
)
