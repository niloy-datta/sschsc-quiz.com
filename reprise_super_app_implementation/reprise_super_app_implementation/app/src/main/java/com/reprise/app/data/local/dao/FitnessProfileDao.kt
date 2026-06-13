package com.reprise.app.data.local.dao

import androidx.room.*
import com.reprise.app.data.local.entity.UserFitnessProfileEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface FitnessProfileDao {
    @Query("SELECT * FROM user_fitness_profile WHERE id = 1 LIMIT 1")
    fun observeProfile(): Flow<UserFitnessProfileEntity?>

    @Query("SELECT * FROM user_fitness_profile WHERE id = 1 LIMIT 1")
    suspend fun getProfile(): UserFitnessProfileEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertProfile(profile: UserFitnessProfileEntity)

    @Query("UPDATE user_fitness_profile SET syncStatus = :status, lastSyncedAt = :time WHERE id = 1")
    suspend fun updateSyncStatus(status: String, time: Long?)
}
