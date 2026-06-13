package com.reprise.app.data.repository

import com.reprise.app.data.local.dao.FitnessProfileDao
import com.reprise.app.data.mapper.toDomain
import com.reprise.app.data.mapper.toEntity
import com.reprise.app.domain.model.UserFitnessProfile
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.withContext
import javax.inject.Inject

class FitnessProfileRepositoryImpl @Inject constructor(
    private val dao: FitnessProfileDao
) : FitnessProfileRepository {

    override fun observeProfile(): Flow<UserFitnessProfile?> {
        return dao.observeProfile().map { it?.toDomain() }
    }

    override suspend fun saveProfile(profile: UserFitnessProfile): Result<Unit> {
        return withContext(Dispatchers.IO) {
            try {
                dao.upsertProfile(profile.toEntity())
                Result.success(Unit)
            } catch (e: Exception) {
                Result.failure(e)
            }
        }
    }
}
