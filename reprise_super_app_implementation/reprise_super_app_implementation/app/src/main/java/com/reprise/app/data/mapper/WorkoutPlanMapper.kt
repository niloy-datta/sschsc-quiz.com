package com.reprise.app.data.mapper

import com.reprise.app.data.local.entity.*
import com.reprise.app.domain.model.*

fun PersonalWorkoutDay.toEntityPair(uid: String): Pair<WorkoutPlanDayEntity, List<PlanExerciseEntity>> {
    val day = WorkoutPlanDayEntity(
        planId = planId,
        uid = uid,
        dayNumber = dayNumber,
        weekNumber = weekNumber,
        title = title,
        focus = focus.name,
        intensity = intensity,
        estimatedMinutes = estimatedMinutes,
        targetMessage = targetMessage,
        nutritionTip = nutritionTip,
        safetyNote = safetyNote
    )
    val exercises = exercises.map {
        PlanExerciseEntity(
            planDayLocalId = 0,
            name = it.name,
            muscleGroup = it.muscleGroup,
            sets = it.sets,
            reps = it.reps,
            restSeconds = it.restSeconds,
            notes = it.notes
        )
    }
    return day to exercises
}

fun WorkoutPlanDayWithExercises.toDomain(): PersonalWorkoutDay {
    return PersonalWorkoutDay(
        planId = day.planId,
        dayNumber = day.dayNumber,
        weekNumber = day.weekNumber,
        title = day.title,
        focus = enumValueOrDefault(day.focus, WorkoutFocus.REST),
        intensity = day.intensity,
        estimatedMinutes = day.estimatedMinutes,
        targetMessage = day.targetMessage,
        exercises = exercises.map {
            PlanExercise(
                name = it.name,
                muscleGroup = it.muscleGroup,
                sets = it.sets,
                reps = it.reps,
                restSeconds = it.restSeconds,
                notes = it.notes
            )
        },
        nutritionTip = day.nutritionTip,
        safetyNote = day.safetyNote
    )
}
