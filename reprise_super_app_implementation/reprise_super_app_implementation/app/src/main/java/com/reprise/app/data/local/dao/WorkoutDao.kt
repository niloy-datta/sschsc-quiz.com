package com.reprise.app.data.local.dao

import androidx.room.*
import com.reprise.app.data.local.entity.ExerciseSetLogEntity
import com.reprise.app.data.local.entity.WorkoutLogEntity
import com.reprise.app.data.local.entity.WorkoutWithSets
import kotlinx.coroutines.flow.Flow

@Dao
interface WorkoutDao {
    @Insert
    suspend fun insertWorkout(workout: WorkoutLogEntity): Long

    @Insert
    suspend fun insertSets(sets: List<ExerciseSetLogEntity>)

    @Transaction
    suspend fun insertWorkoutWithSets(workout: WorkoutLogEntity, sets: List<ExerciseSetLogEntity>): Long {
        val workoutId = insertWorkout(workout)
        insertSets(sets.map { it.copy(workoutLocalId = workoutId) })
        return workoutId
    }

    @Transaction
    @Query("SELECT * FROM workout_logs WHERE uid = :uid AND isDeleted = 0 ORDER BY date DESC")
    fun observeWorkouts(uid: String): Flow<List<WorkoutWithSets>>

    @Transaction
    @Query("""
        SELECT DISTINCT workout_logs.* FROM workout_logs
        LEFT JOIN exercise_set_logs ON workout_logs.localId = exercise_set_logs.workoutLocalId
        WHERE workout_logs.uid = :uid
        AND workout_logs.isDeleted = 0
        AND (
            workout_logs.title LIKE '%' || :query || '%'
            OR exercise_set_logs.exerciseName LIKE '%' || :query || '%'
            OR exercise_set_logs.muscleGroup LIKE '%' || :query || '%'
        )
        ORDER BY workout_logs.date DESC
    """)
    fun searchWorkouts(uid: String, query: String): Flow<List<WorkoutWithSets>>

    @Transaction
    @Query("SELECT * FROM workout_logs WHERE localId = :localId LIMIT 1")
    fun observeWorkout(localId: Long): Flow<WorkoutWithSets?>

    @Transaction
    @Query("SELECT * FROM workout_logs WHERE localId = :localId LIMIT 1")
    suspend fun getWorkoutWithSets(localId: Long): WorkoutWithSets?

    @Query("UPDATE workout_logs SET syncStatus = :status, lastSyncedAt = :time WHERE localId = :localId")
    suspend fun updateWorkoutSyncStatus(localId: Long, status: String, time: Long?)

    @Query("SELECT * FROM workout_logs WHERE uid = :uid AND syncStatus != 'SYNCED'")
    suspend fun getPendingWorkouts(uid: String): List<WorkoutLogEntity>

    @Query("UPDATE workout_logs SET isDeleted = 1, syncStatus = 'DELETED_PENDING', updatedAt = :time WHERE localId = :localId")
    suspend fun softDeleteWorkout(localId: Long, time: Long = System.currentTimeMillis())

    @Query("SELECT SUM(weight * reps) FROM exercise_set_logs WHERE workoutLocalId IN (SELECT localId FROM workout_logs WHERE uid = :uid AND date BETWEEN :start AND :end AND isDeleted = 0)")
    suspend fun totalVolume(uid: String, start: Long, end: Long): Double?

    @Query("SELECT COUNT(*) FROM workout_logs WHERE uid = :uid AND date BETWEEN :start AND :end AND isDeleted = 0")
    suspend fun workoutCount(uid: String, start: Long, end: Long): Int
}
