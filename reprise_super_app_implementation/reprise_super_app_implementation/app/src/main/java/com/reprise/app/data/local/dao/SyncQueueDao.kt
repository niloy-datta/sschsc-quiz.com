package com.reprise.app.data.local.dao

import androidx.room.*
import com.reprise.app.data.local.entity.SyncQueueEntity

@Dao
interface SyncQueueDao {
    @Insert
    suspend fun enqueue(item: SyncQueueEntity): Long

    @Query("SELECT * FROM sync_queue WHERE uid = :uid AND status = 'PENDING' ORDER BY createdAt ASC LIMIT :limit")
    suspend fun pending(uid: String, limit: Int = 50): List<SyncQueueEntity>

    @Query("UPDATE sync_queue SET status = :status, attemptCount = attemptCount + 1, lastAttemptAt = :time, errorMessage = :error WHERE id = :id")
    suspend fun update(id: Long, status: String, time: Long, error: String?)
}
