package com.reprise.app.data.local.entity

import androidx.room.Embedded
import androidx.room.Relation

data class WorkoutPlanDayWithExercises(
    @Embedded val day: WorkoutPlanDayEntity,
    @Relation(parentColumn = "localId", entityColumn = "planDayLocalId")
    val exercises: List<PlanExerciseEntity>
)
