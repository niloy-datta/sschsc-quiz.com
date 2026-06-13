package com.reprise.app.data.repository

import com.reprise.app.data.local.dao.WorkoutDao
import com.reprise.app.data.local.entity.ExerciseSetLogEntity
import com.reprise.app.data.local.entity.WorkoutLogEntity
import com.reprise.app.data.local.entity.WorkoutWithSets
import com.reprise.app.sync.CloudSyncManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.withContext
import javax.inject.Inject

class WorkoutRepositoryImpl @Inject constructor(
    private val workoutDao: WorkoutDao,
    private val cloudSyncManager: CloudSyncManager
) : WorkoutRepository {

    override fun observeAllWorkouts(): Flow<List<WorkoutWithSets>> = workoutDao.observeAllWorkouts()

    override fun searchWorkouts(query: String): Flow<List<WorkoutWithSets>> {
        return if (query.isBlank()) workoutDao.observeAllWorkouts() else workoutDao.searchWorkouts(query.trim())
    }

    override fun observeWorkoutById(workoutId: Long): Flow<WorkoutWithSets?> = workoutDao.observeWorkoutById(workoutId)

    override suspend fun saveWorkout(
        workout: WorkoutLogEntity,
        sets: List<ExerciseSetLogEntity>
    ): Result<Long> = withContext(Dispatchers.IO) {
        try {
            val id = workoutDao.insertWorkoutWithSets(workout.copy(isSynced = false), sets)
            cloudSyncManager.trySyncInBackground()
            Result.success(id)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun deleteWorkout(workoutId: Long): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            workoutDao.deleteWorkoutById(workoutId)
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun getWeeklyVolume(start: Long, end: Long): Double = workoutDao.getTotalVolumeBetween(start, end) ?: 0.0

    override suspend fun getWorkoutCount(start: Long, end: Long): Int = workoutDao.getWorkoutCountBetween(start, end)

    override suspend fun getMaxWeight(exerciseName: String): Double = workoutDao.getMaxWeightForExercise(exerciseName) ?: 0.0
}
