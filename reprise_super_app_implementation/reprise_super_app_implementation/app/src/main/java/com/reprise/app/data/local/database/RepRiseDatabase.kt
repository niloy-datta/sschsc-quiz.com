package com.reprise.app.data.local.database

import androidx.room.Database
import androidx.room.RoomDatabase
import com.reprise.app.data.local.dao.*
import com.reprise.app.data.local.entity.*

@Database(
    entities = [
        UserFitnessProfileEntity::class,
        WorkoutPlanDayEntity::class,
        PlanExerciseEntity::class,
        WorkoutLogEntity::class,
        ExerciseSetLogEntity::class,
        BodyWeightLogEntity::class,
        MeasurementLogEntity::class,
        SyncQueueEntity::class,
        AchievementEntity::class,
        AppSettingsEntity::class
    ],
    version = 3,
    exportSchema = true
)
abstract class RepRiseDatabase : RoomDatabase() {
    abstract fun fitnessProfileDao(): FitnessProfileDao
    abstract fun workoutPlanDao(): WorkoutPlanDao
    abstract fun workoutDao(): WorkoutDao
    abstract fun bodyTrackingDao(): BodyTrackingDao
    abstract fun syncQueueDao(): SyncQueueDao
}
