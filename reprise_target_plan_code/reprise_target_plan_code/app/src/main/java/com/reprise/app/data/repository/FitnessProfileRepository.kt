package com.reprise.app.data.repository

import com.reprise.app.domain.model.UserFitnessProfile
import kotlinx.coroutines.flow.Flow

interface FitnessProfileRepository {
    fun observeProfile(): Flow<UserFitnessProfile?>
    suspend fun saveProfile(profile: UserFitnessProfile): Result<Unit>
}
