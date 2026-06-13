package com.reprise.app.data.local.dao

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.Query
import androidx.room.Transaction
import androidx.room.Update
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

    @Update
    suspend fun updateWorkout(workout: WorkoutLogEntity)

    @Delete
    suspend fun deleteWorkout(workout: WorkoutLogEntity)

    @Query("DELETE FROM workout_logs WHERE id = :workoutId")
    suspend fun deleteWorkoutById(workoutId: Long)

    @Transaction
    suspend fun insertWorkoutWithSets(
        workout: WorkoutLogEntity,
        sets: List<ExerciseSetLogEntity>
    ): Long {
        val workoutId = insertWorkout(workout)
        val fixedSets = sets.map { it.copy(workoutId = workoutId) }
        insertSets(fixedSets)
        return workoutId
    }

    @Transaction
    @Query("SELECT * FROM workout_logs ORDER BY date DESC")
    fun observeAllWorkouts(): Flow<List<WorkoutWithSets>>

    @Transaction
    @Query("SELECT * FROM workout_logs WHERE id = :workoutId LIMIT 1")
    fun observeWorkoutById(workoutId: Long): Flow<WorkoutWithSets?>

    @Transaction
    @Query(
        """
        SELECT DISTINCT workout_logs.* FROM workout_logs
        LEFT JOIN exercise_set_logs ON workout_logs.id = exercise_set_logs.workoutId
        WHERE workout_logs.title LIKE '%' || :query || '%'
        OR exercise_set_logs.exerciseName LIKE '%' || :query || '%'
        OR exercise_set_logs.muscleGroup LIKE '%' || :query || '%'
        ORDER BY workout_logs.date DESC
        """
    )
    fun searchWorkouts(query: String): Flow<List<WorkoutWithSets>>

    @Transaction
    @Query(
        """
        SELECT * FROM workout_logs
        WHERE date BETWEEN :startDate AND :endDate
        ORDER BY date DESC
        """
    )
    fun filterByDateRange(startDate: Long, endDate: Long): Flow<List<WorkoutWithSets>>

    @Query(
        """
        SELECT MAX(weight) FROM exercise_set_logs
        WHERE LOWER(exerciseName) = LOWER(:exerciseName)
        """
    )
    suspend fun getMaxWeightForExercise(exerciseName: String): Double?

    @Query(
        """
        SELECT SUM(weight * reps) FROM exercise_set_logs
        WHERE workoutId IN (
            SELECT id FROM workout_logs WHERE date BETWEEN :startDate AND :endDate
        )
        """
    )
    suspend fun getTotalVolumeBetween(startDate: Long, endDate: Long): Double?

    @Query(
        """
        SELECT COUNT(*) FROM workout_logs
        WHERE date BETWEEN :startDate AND :endDate
        """
    )
    suspend fun getWorkoutCountBetween(startDate: Long, endDate: Long): Int

    @Query("SELECT * FROM workout_logs WHERE isSynced = 0 ORDER BY updatedAt ASC")
    suspend fun getUnsyncedWorkouts(): List<WorkoutLogEntity>

    @Query("UPDATE workout_logs SET isSynced = 1 WHERE id = :workoutId")
    suspend fun markWorkoutSynced(workoutId: Long)
}
