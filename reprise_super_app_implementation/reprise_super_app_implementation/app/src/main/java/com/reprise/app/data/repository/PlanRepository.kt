package com.reprise.app.data.repository

import com.reprise.app.domain.model.PersonalWorkoutDay
import com.reprise.app.domain.model.UserFitnessProfile
import kotlinx.coroutines.flow.Flow

interface PlanRepository {
    fun observePlan(uid: String): Flow<List<PersonalWorkoutDay>>
    fun observeTodayPlan(uid: String, dayOfMonth: Int): Flow<PersonalWorkoutDay?>
    suspend fun regeneratePlan(profile: UserFitnessProfile): Result<List<PersonalWorkoutDay>>
}
