package com.reprise.app.data.remote.firebase

object FirestorePaths {
    fun profile(uid: String) = "users/$uid/profile/main"
    fun target(uid: String) = "users/$uid/targets/current"
    fun workoutPlans(uid: String) = "users/$uid/workoutPlans"
    fun workoutLogs(uid: String) = "users/$uid/workoutLogs"
    fun bodyWeights(uid: String) = "users/$uid/bodyWeights"
    fun measurements(uid: String) = "users/$uid/measurements"
    fun achievements(uid: String) = "users/$uid/achievements"
    fun settings(uid: String) = "users/$uid/settings/main"
}
