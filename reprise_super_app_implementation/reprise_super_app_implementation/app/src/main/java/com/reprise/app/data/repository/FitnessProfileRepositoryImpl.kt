package com.reprise.app.data.repository

import com.reprise.app.data.local.dao.FitnessProfileDao
import com.reprise.app.data.local.dao.SyncQueueDao
import com.reprise.app.data.local.entity.SyncQueueEntity
import com.reprise.app.data.mapper.toDomain
import com.reprise.app.data.mapper.toEntity
import com.reprise.app.domain.model.UserFitnessProfile
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.withContext
import javax.inject.Inject

class FitnessProfileRepositoryImpl @Inject constructor(
    private val dao: FitnessProfileDao,
    private val syncQueueDao: SyncQueueDao
) : FitnessProfileRepository {
    override fun observeProfile(): Flow<UserFitnessProfile?> = dao.observeProfile().map { it?.toDomain() }
    override suspend fun getProfile(): UserFitnessProfile? = dao.getProfile()?.toDomain()

    override suspend fun saveProfile(profile: UserFitnessProfile): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            dao.upsertProfile(profile.toEntity())
            syncQueueDao.enqueue(SyncQueueEntity(uid = profile.uid, entityType = "PROFILE", localEntityId = 1, operation = "UPSERT"))
            Result.success(Unit)
        } catch (e: Exception) { Result.failure(e) }
    }
}
