package com.reprise.app.domain.model

data class PlanExercise(
    val name: String,
    val muscleGroup: String,
    val sets: Int,
    val reps: String,
    val restSeconds: Int,
    val notes: String
)

data class PersonalWorkoutDay(
    val planId: String,
    val dayNumber: Int,
    val weekNumber: Int,
    val title: String,
    val focus: WorkoutFocus,
    val intensity: String,
    val estimatedMinutes: Int,
    val targetMessage: String,
    val exercises: List<PlanExercise>,
    val nutritionTip: String,
    val safetyNote: String
)
