package com.reprise.app.data.repository

import com.reprise.app.data.local.entity.ExerciseSetLogEntity
import com.reprise.app.data.local.entity.WorkoutLogEntity
import com.reprise.app.data.local.entity.WorkoutWithSets
import kotlinx.coroutines.flow.Flow

interface WorkoutRepository {
    fun observeWorkouts(uid: String, query: String = ""): Flow<List<WorkoutWithSets>>
    fun observeWorkout(localId: Long): Flow<WorkoutWithSets?>
    suspend fun saveWorkout(workout: WorkoutLogEntity, sets: List<ExerciseSetLogEntity>): Result<Long>
    suspend fun deleteWorkout(uid: String, localId: Long): Result<Unit>
    suspend fun weeklyVolume(uid: String, start: Long, end: Long): Double
    suspend fun weeklyWorkoutCount(uid: String, start: Long, end: Long): Int
}
