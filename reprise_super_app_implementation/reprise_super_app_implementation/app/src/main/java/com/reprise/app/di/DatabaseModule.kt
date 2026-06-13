package com.reprise.app.di

import android.content.Context
import androidx.room.Room
import com.reprise.app.data.local.dao.*
import com.reprise.app.data.local.database.DatabaseMigrations
import com.reprise.app.data.local.database.RepRiseDatabase
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {
    @Provides @Singleton
    fun provideDatabase(@ApplicationContext context: Context): RepRiseDatabase {
        return Room.databaseBuilder(context, RepRiseDatabase::class.java, "reprise_database")
            .addMigrations(DatabaseMigrations.MIGRATION_1_2, DatabaseMigrations.MIGRATION_2_3)
            .build()
    }

    @Provides fun profileDao(db: RepRiseDatabase): FitnessProfileDao = db.fitnessProfileDao()
    @Provides fun planDao(db: RepRiseDatabase): WorkoutPlanDao = db.workoutPlanDao()
    @Provides fun workoutDao(db: RepRiseDatabase): WorkoutDao = db.workoutDao()
    @Provides fun bodyTrackingDao(db: RepRiseDatabase): BodyTrackingDao = db.bodyTrackingDao()
    @Provides fun syncQueueDao(db: RepRiseDatabase): SyncQueueDao = db.syncQueueDao()
}
