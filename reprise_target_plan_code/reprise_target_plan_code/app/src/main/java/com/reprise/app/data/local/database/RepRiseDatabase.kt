package com.reprise.app.data.local.database

import androidx.room.Database
import androidx.room.RoomDatabase
import com.reprise.app.data.local.dao.FitnessProfileDao
import com.reprise.app.data.local.dao.WorkoutDao
import com.reprise.app.data.local.entity.ExerciseSetLogEntity
import com.reprise.app.data.local.entity.UserFitnessProfileEntity
import com.reprise.app.data.local.entity.WorkoutLogEntity

@Database(
    entities = [
        WorkoutLogEntity::class,
        ExerciseSetLogEntity::class,
        UserFitnessProfileEntity::class
    ],
    version = 3,
    exportSchema = true
)
abstract class RepRiseDatabase : RoomDatabase() {
    abstract fun workoutDao(): WorkoutDao
    abstract fun fitnessProfileDao(): FitnessProfileDao
}
