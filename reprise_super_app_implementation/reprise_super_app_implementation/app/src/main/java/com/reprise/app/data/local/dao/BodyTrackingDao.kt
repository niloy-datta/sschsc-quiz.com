package com.reprise.app.data.local.dao

import androidx.room.*
import com.reprise.app.data.local.entity.BodyWeightLogEntity
import com.reprise.app.data.local.entity.MeasurementLogEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface BodyTrackingDao {
    @Insert
    suspend fun insertWeight(entry: BodyWeightLogEntity): Long

    @Query("SELECT * FROM body_weight_logs WHERE uid = :uid ORDER BY date DESC")
    fun observeWeights(uid: String): Flow<List<BodyWeightLogEntity>>

    @Query("SELECT * FROM body_weight_logs WHERE uid = :uid AND syncStatus != 'SYNCED'")
    suspend fun pendingWeights(uid: String): List<BodyWeightLogEntity>

    @Query("UPDATE body_weight_logs SET syncStatus = :status, lastSyncedAt = :time WHERE localId = :localId")
    suspend fun updateWeightSyncStatus(localId: Long, status: String, time: Long?)

    @Insert
    suspend fun insertMeasurement(entry: MeasurementLogEntity): Long

    @Query("SELECT * FROM measurement_logs WHERE uid = :uid ORDER BY date DESC")
    fun observeMeasurements(uid: String): Flow<List<MeasurementLogEntity>>
}
