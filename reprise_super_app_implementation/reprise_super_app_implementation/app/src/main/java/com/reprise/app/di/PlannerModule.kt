package com.reprise.app.di

import com.reprise.app.domain.planner.TargetBasedWorkoutPlanner
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object PlannerModule {
    @Provides @Singleton fun provideTargetBasedWorkoutPlanner(): TargetBasedWorkoutPlanner = TargetBasedWorkoutPlanner()
}
