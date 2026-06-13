package com.reprise.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "body_weight_logs")
data class BodyWeightLogEntity(
    @PrimaryKey(autoGenerate = true) val localId: Long = 0,
    val remoteId: String? = null,
    val uid: String,
    val weightKg: Double,
    val date: Long = System.currentTimeMillis(),
    val notes: String? = null,
    val syncStatus: String = "PENDING",
    val lastSyncedAt: Long? = null
)

@Entity(tableName = "measurement_logs")
data class MeasurementLogEntity(
    @PrimaryKey(autoGenerate = true) val localId: Long = 0,
    val remoteId: String? = null,
    val uid: String,
    val chestCm: Double?,
    val waistCm: Double?,
    val hipCm: Double?,
    val armCm: Double?,
    val thighCm: Double?,
    val date: Long = System.currentTimeMillis(),
    val syncStatus: String = "PENDING",
    val lastSyncedAt: Long? = null
)

@Entity(tableName = "sync_queue")
data class SyncQueueEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val uid: String,
    val entityType: String,
    val localEntityId: Long,
    val operation: String,
    val status: String = "PENDING",
    val attemptCount: Int = 0,
    val createdAt: Long = System.currentTimeMillis(),
    val lastAttemptAt: Long? = null,
    val errorMessage: String? = null
)

@Entity(tableName = "achievements")
data class AchievementEntity(
    @PrimaryKey val key: String,
    val uid: String,
    val title: String,
    val description: String,
    val unlockedAt: Long,
    val syncStatus: String = "PENDING"
)

@Entity(tableName = "app_settings")
data class AppSettingsEntity(
    @PrimaryKey val id: Int = 1,
    val uid: String?,
    val unit: String = "KG",
    val remindersEnabled: Boolean = true,
    val workoutReminderHour: Int = 18,
    val themeMode: String = "DARK",
    val updatedAt: Long = System.currentTimeMillis()
)
