package com.reprise.app.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
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

    @Query("DELETE FROM user_fitness_profile WHERE id = 1")
    suspend fun deleteProfile()
}
