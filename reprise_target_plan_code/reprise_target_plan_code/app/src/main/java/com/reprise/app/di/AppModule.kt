package com.reprise.app.di

import android.content.Context
import androidx.room.Room
import com.reprise.app.data.local.dao.FitnessProfileDao
import com.reprise.app.data.local.dao.WorkoutDao
import com.reprise.app.data.local.database.DatabaseMigrations
import com.reprise.app.data.local.database.RepRiseDatabase
import com.reprise.app.data.repository.FitnessProfileRepository
import com.reprise.app.data.repository.FitnessProfileRepositoryImpl
import com.reprise.app.data.repository.WorkoutRepository
import com.reprise.app.data.repository.WorkoutRepositoryImpl
import com.reprise.app.domain.planner.TargetBasedWorkoutPlanner
import com.reprise.app.sync.CloudSyncManager
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object ProviderModule {

    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext context: Context): RepRiseDatabase {
        return Room.databaseBuilder(context, RepRiseDatabase::class.java, "reprise_database")
            .addMigrations(DatabaseMigrations.MIGRATION_1_2, DatabaseMigrations.MIGRATION_2_3)
            .build()
    }

    @Provides
    fun provideWorkoutDao(database: RepRiseDatabase): WorkoutDao = database.workoutDao()

    @Provides
    fun provideFitnessProfileDao(database: RepRiseDatabase): FitnessProfileDao = database.fitnessProfileDao()

    @Provides
    @Singleton
    fun provideCloudSyncManager(workoutDao: WorkoutDao): CloudSyncManager = CloudSyncManager(workoutDao)

    @Provides
    @Singleton
    fun provideTargetBasedWorkoutPlanner(): TargetBasedWorkoutPlanner = TargetBasedWorkoutPlanner()
}

@Module
@InstallIn(SingletonComponent::class)
abstract class BindModule {

    @Binds
    @Singleton
    abstract fun bindWorkoutRepository(impl: WorkoutRepositoryImpl): WorkoutRepository

    @Binds
    @Singleton
    abstract fun bindFitnessProfileRepository(impl: FitnessProfileRepositoryImpl): FitnessProfileRepository
}
