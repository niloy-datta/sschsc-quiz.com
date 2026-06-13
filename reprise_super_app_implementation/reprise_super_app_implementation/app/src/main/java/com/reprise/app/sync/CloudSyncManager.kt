package com.reprise.app.sync

import com.google.firebase.firestore.FirebaseFirestore
import com.reprise.app.data.local.dao.*
import com.reprise.app.data.remote.firebase.FirestorePaths
import kotlinx.coroutines.tasks.await
import javax.inject.Inject

class CloudSyncManager @Inject constructor(
    private val firestore: FirebaseFirestore,
    private val profileDao: FitnessProfileDao,
    private val planDao: WorkoutPlanDao,
    private val workoutDao: WorkoutDao,
    private val bodyTrackingDao: BodyTrackingDao,
    private val syncQueueDao: SyncQueueDao
) {
    suspend fun syncNow(uid: String) {
        val pending = syncQueueDao.pending(uid)
        pending.forEach { item ->
            try {
                when (item.entityType) {
                    "PROFILE" -> syncProfile(uid)
                    "PLAN" -> syncPlan(uid)
                    "WORKOUT" -> syncWorkout(uid, item.localEntityId, item.operation)
                    "WEIGHT" -> syncWeights(uid)
                }
                syncQueueDao.update(item.id, "SYNCED", System.currentTimeMillis(), null)
            } catch (e: Exception) {
                syncQueueDao.update(item.id, "PENDING", System.currentTimeMillis(), e.message)
            }
        }
    }

    private suspend fun syncProfile(uid: String) {
        val profile = profileDao.getProfile() ?: return
        firestore.document(FirestorePaths.profile(uid)).set(profile).await()
        profileDao.updateSyncStatus("SYNCED", System.currentTimeMillis())
    }

    private suspend fun syncPlan(uid: String) {
        val plan = planDao.getPlanSnapshot(uid)
        val batch = firestore.batch()
        plan.forEach { day ->
            val ref = firestore.collection(FirestorePaths.workoutPlans(uid)).document("day_${day.day.dayNumber}")
            batch.set(ref, mapOf("day" to day.day, "exercises" to day.exercises))
        }
        batch.commit().await()
    }

    private suspend fun syncWorkout(uid: String, localId: Long, operation: String) {
        val workoutWithSets = workoutDao.getWorkoutWithSets(localId) ?: return
        val doc = firestore.collection(FirestorePaths.workoutLogs(uid))
            .document(workoutWithSets.workout.remoteId ?: "local_$localId")

        if (operation == "DELETE") {
            doc.delete().await()
            workoutDao.updateWorkoutSyncStatus(localId, "SYNCED", System.currentTimeMillis())
            return
        }

        doc.set(mapOf("workout" to workoutWithSets.workout, "sets" to workoutWithSets.sets)).await()
        workoutDao.updateWorkoutSyncStatus(localId, "SYNCED", System.currentTimeMillis())
    }

    private suspend fun syncWeights(uid: String) {
        bodyTrackingDao.pendingWeights(uid).forEach { entry ->
            firestore.collection(FirestorePaths.bodyWeights(uid)).document("local_${entry.localId}").set(entry).await()
            bodyTrackingDao.updateWeightSyncStatus(entry.localId, "SYNCED", System.currentTimeMillis())
        }
    }
}
