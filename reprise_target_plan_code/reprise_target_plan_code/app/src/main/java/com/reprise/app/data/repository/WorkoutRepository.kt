package com.reprise.app.data.repository

import com.reprise.app.data.local.entity.ExerciseSetLogEntity
import com.reprise.app.data.local.entity.WorkoutLogEntity
import com.reprise.app.data.local.entity.WorkoutWithSets
import kotlinx.coroutines.flow.Flow

interface WorkoutRepository {
    fun observeAllWorkouts(): Flow<List<WorkoutWithSets>>
    fun searchWorkouts(query: String): Flow<List<WorkoutWithSets>>
    fun observeWorkoutById(workoutId: Long): Flow<WorkoutWithSets?>
    suspend fun saveWorkout(workout: WorkoutLogEntity, sets: List<ExerciseSetLogEntity>): Result<Long>
    suspend fun deleteWorkout(workoutId: Long): Result<Unit>
    suspend fun getWeeklyVolume(start: Long, end: Long): Double
    suspend fun getWorkoutCount(start: Long, end: Long): Int
    suspend fun getMaxWeight(exerciseName: String): Double
}
