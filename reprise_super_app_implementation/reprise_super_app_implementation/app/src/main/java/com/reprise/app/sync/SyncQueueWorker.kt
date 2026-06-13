package com.reprise.app.sync

import android.content.Context
import androidx.hilt.work.HiltWorker
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.reprise.app.auth.AuthRepository
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject

@HiltWorker
class SyncQueueWorker @AssistedInject constructor(
    @Assisted context: Context,
    @Assisted params: WorkerParameters,
    private val authRepository: AuthRepository,
    private val cloudSyncManager: CloudSyncManager
) : CoroutineWorker(context, params) {
    override suspend fun doWork(): Result {
        val uid = authRepository.currentUserId ?: return Result.success()
        return try {
            cloudSyncManager.syncNow(uid)
            Result.success()
        } catch (_: Exception) {
            Result.retry()
        }
    }
}
