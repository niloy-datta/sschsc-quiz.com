package com.reprise.app.data.repository

import com.reprise.app.data.local.dao.SyncQueueDao
import com.reprise.app.data.local.dao.WorkoutDao
import com.reprise.app.data.local.entity.ExerciseSetLogEntity
import com.reprise.app.data.local.entity.SyncQueueEntity
import com.reprise.app.data.local.entity.WorkoutLogEntity
import com.reprise.app.data.local.entity.WorkoutWithSets
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.withContext
import javax.inject.Inject

class WorkoutRepositoryImpl @Inject constructor(
    private val workoutDao: WorkoutDao,
    private val syncQueueDao: SyncQueueDao
) : WorkoutRepository {
    override fun observeWorkouts(uid: String, query: String): Flow<List<WorkoutWithSets>> =
        if (query.isBlank()) workoutDao.observeWorkouts(uid) else workoutDao.searchWorkouts(uid, query.trim())

    override fun observeWorkout(localId: Long): Flow<WorkoutWithSets?> = workoutDao.observeWorkout(localId)

    override suspend fun saveWorkout(workout: WorkoutLogEntity, sets: List<ExerciseSetLogEntity>): Result<Long> = withContext(Dispatchers.IO) {
        try {
            val id = workoutDao.insertWorkoutWithSets(workout.copy(syncStatus = "PENDING"), sets)
            syncQueueDao.enqueue(SyncQueueEntity(uid = workout.uid, entityType = "WORKOUT", localEntityId = id, operation = "UPSERT"))
            Result.success(id)
        } catch (e: Exception) { Result.failure(e) }
    }

    override suspend fun deleteWorkout(uid: String, localId: Long): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            workoutDao.softDeleteWorkout(localId)
            syncQueueDao.enqueue(SyncQueueEntity(uid = uid, entityType = "WORKOUT", localEntityId = localId, operation = "DELETE"))
            Result.success(Unit)
        } catch (e: Exception) { Result.failure(e) }
    }

    override suspend fun weeklyVolume(uid: String, start: Long, end: Long): Double = workoutDao.totalVolume(uid, start, end) ?: 0.0
    override suspend fun weeklyWorkoutCount(uid: String, start: Long, end: Long): Int = workoutDao.workoutCount(uid, start, end)
}
