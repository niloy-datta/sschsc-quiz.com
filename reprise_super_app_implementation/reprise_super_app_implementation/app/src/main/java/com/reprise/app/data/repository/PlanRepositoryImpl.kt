package com.reprise.app.data.repository

import com.reprise.app.data.local.dao.SyncQueueDao
import com.reprise.app.data.local.dao.WorkoutPlanDao
import com.reprise.app.data.local.entity.SyncQueueEntity
import com.reprise.app.data.mapper.toDomain
import com.reprise.app.data.mapper.toEntityPair
import com.reprise.app.domain.model.PersonalWorkoutDay
import com.reprise.app.domain.model.UserFitnessProfile
import com.reprise.app.domain.planner.TargetBasedWorkoutPlanner
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.withContext
import javax.inject.Inject

class PlanRepositoryImpl @Inject constructor(
    private val planDao: WorkoutPlanDao,
    private val syncQueueDao: SyncQueueDao,
    private val planner: TargetBasedWorkoutPlanner
) : PlanRepository {
    override fun observePlan(uid: String): Flow<List<PersonalWorkoutDay>> =
        planDao.observeCurrentPlan(uid).map { list -> list.map { it.toDomain() } }

    override fun observeTodayPlan(uid: String, dayOfMonth: Int): Flow<PersonalWorkoutDay?> {
        val day = ((dayOfMonth - 1) % 30) + 1
        return planDao.observePlanDay(uid, day).map { it?.toDomain() }
    }

    override suspend fun regeneratePlan(profile: UserFitnessProfile): Result<List<PersonalWorkoutDay>> = withContext(Dispatchers.IO) {
        try {
            val plan = planner.generate30DayPlan(profile)
            planDao.replacePlan(profile.uid, plan.map { it.toEntityPair(profile.uid) })
            syncQueueDao.enqueue(SyncQueueEntity(uid = profile.uid, entityType = "PLAN", localEntityId = 0, operation = "REPLACE"))
            Result.success(plan)
        } catch (e: Exception) { Result.failure(e) }
    }
}
