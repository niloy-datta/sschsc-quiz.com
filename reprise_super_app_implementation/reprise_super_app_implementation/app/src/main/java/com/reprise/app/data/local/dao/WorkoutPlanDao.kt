package com.reprise.app.data.local.dao

import androidx.room.*
import com.reprise.app.data.local.entity.PlanExerciseEntity
import com.reprise.app.data.local.entity.WorkoutPlanDayEntity
import com.reprise.app.data.local.entity.WorkoutPlanDayWithExercises
import kotlinx.coroutines.flow.Flow

@Dao
interface WorkoutPlanDao {
    @Transaction
    @Query("SELECT * FROM workout_plan_days WHERE uid = :uid ORDER BY dayNumber ASC")
    fun observeCurrentPlan(uid: String): Flow<List<WorkoutPlanDayWithExercises>>

    @Transaction
    @Query("SELECT * FROM workout_plan_days WHERE uid = :uid ORDER BY dayNumber ASC")
    suspend fun getPlanSnapshot(uid: String): List<WorkoutPlanDayWithExercises>

    @Transaction
    @Query("SELECT * FROM workout_plan_days WHERE uid = :uid AND dayNumber = :dayNumber LIMIT 1")
    fun observePlanDay(uid: String, dayNumber: Int): Flow<WorkoutPlanDayWithExercises?>

    @Query("DELETE FROM workout_plan_days WHERE uid = :uid")
    suspend fun clearPlan(uid: String)

    @Insert
    suspend fun insertPlanDay(day: WorkoutPlanDayEntity): Long

    @Insert
    suspend fun insertExercises(exercises: List<PlanExerciseEntity>)

    @Transaction
    suspend fun replacePlan(uid: String, days: List<Pair<WorkoutPlanDayEntity, List<PlanExerciseEntity>>>) {
        clearPlan(uid)
        days.forEach { (day, exercises) ->
            val dayId = insertPlanDay(day)
            insertExercises(exercises.map { it.copy(planDayLocalId = dayId) })
        }
    }
}
