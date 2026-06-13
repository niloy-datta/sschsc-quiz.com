package com.reprise.app.notification

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters

class ReminderWorker(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {
    override suspend fun doWork(): Result {
        // TODO: show workout reminder notification with NotificationManager.
        return Result.success()
    }
}
