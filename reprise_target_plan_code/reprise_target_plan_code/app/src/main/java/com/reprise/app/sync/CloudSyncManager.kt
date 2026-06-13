package com.reprise.app.sync

import com.reprise.app.data.local.dao.WorkoutDao
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import javax.inject.Inject

class CloudSyncManager @Inject constructor(
    private val workoutDao: WorkoutDao
) {
    fun trySyncInBackground() {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val unsynced = workoutDao.getUnsyncedWorkouts()
                unsynced.forEach { workout ->
                    // TODO: Replace this with Firebase/FastAPI call.
                    // Always keep local data safe if server fails.
                    val serverSuccess = false
                    if (serverSuccess) {
                        workoutDao.markWorkoutSynced(workout.id)
                    }
                }
            } catch (_: Exception) {
                // Never crash app because sync failed.
            }
        }
    }
}
