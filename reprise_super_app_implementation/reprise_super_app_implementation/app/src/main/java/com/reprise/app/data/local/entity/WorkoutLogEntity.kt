package com.reprise.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "workout_logs")
data class WorkoutLogEntity(
    @PrimaryKey(autoGenerate = true) val localId: Long = 0,
    val remoteId: String? = null,
    val uid: String,
    val title: String,
    val planDayNumber: Int?,
    val date: Long = System.currentTimeMillis(),
    val durationSeconds: Long = 0,
    val notes: String? = null,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis(),
    val syncStatus: String = "PENDING",
    val lastSyncedAt: Long? = null,
    val isDeleted: Boolean = false
)
