package com.reprise.app.ui.navigation

object Routes {
    const val DASHBOARD = "dashboard"
    const val START_WORKOUT = "start_workout"
    const val HISTORY = "history"
    const val PROGRESS = "progress"
    const val PROFILE = "profile"
    const val PERSONAL_PLAN = "personal_plan"
    const val WORKOUT_DETAIL = "workout_detail/{workoutId}"

    fun workoutDetail(workoutId: Long): String = "workout_detail/$workoutId"
}
