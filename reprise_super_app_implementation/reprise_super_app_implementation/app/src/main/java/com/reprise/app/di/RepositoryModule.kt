package com.reprise.app.di

import com.reprise.app.data.repository.*
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {
    @Binds @Singleton abstract fun bindFitnessProfileRepository(impl: FitnessProfileRepositoryImpl): FitnessProfileRepository
    @Binds @Singleton abstract fun bindPlanRepository(impl: PlanRepositoryImpl): PlanRepository
    @Binds @Singleton abstract fun bindWorkoutRepository(impl: WorkoutRepositoryImpl): WorkoutRepository
}
