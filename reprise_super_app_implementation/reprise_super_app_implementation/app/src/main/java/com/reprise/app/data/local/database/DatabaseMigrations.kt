package com.reprise.app.data.local.database

import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase

object DatabaseMigrations {
    val MIGRATION_1_2 = object : Migration(1, 2) {
        override fun migrate(db: SupportSQLiteDatabase) {
            db.execSQL("""
                CREATE TABLE IF NOT EXISTS user_fitness_profile (
                    id INTEGER NOT NULL PRIMARY KEY,
                    uid TEXT NOT NULL,
                    name TEXT NOT NULL,
                    age INTEGER NOT NULL,
                    gender TEXT NOT NULL,
                    heightCm REAL NOT NULL,
                    weightKg REAL NOT NULL,
                    level TEXT NOT NULL,
                    equipment TEXT NOT NULL,
                    hasInjury INTEGER NOT NULL,
                    injuryNote TEXT,
                    targetType TEXT NOT NULL,
                    targetWeightKg REAL,
                    targetDays INTEGER NOT NULL,
                    gymDaysPerWeek INTEGER NOT NULL,
                    sessionMinutes INTEGER NOT NULL,
                    targetSpeed TEXT NOT NULL,
                    frequencyMode TEXT NOT NULL,
                    priorityMuscle TEXT NOT NULL,
                    createdAt INTEGER NOT NULL,
                    updatedAt INTEGER NOT NULL,
                    syncStatus TEXT NOT NULL,
                    lastSyncedAt INTEGER
                )
            """.trimIndent())
        }
    }

    val MIGRATION_2_3 = object : Migration(2, 3) {
        override fun migrate(db: SupportSQLiteDatabase) {
            db.execSQL("CREATE TABLE IF NOT EXISTS workout_plan_days (localId INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, planId TEXT NOT NULL, uid TEXT NOT NULL, dayNumber INTEGER NOT NULL, weekNumber INTEGER NOT NULL, title TEXT NOT NULL, focus TEXT NOT NULL, intensity TEXT NOT NULL, estimatedMinutes INTEGER NOT NULL, targetMessage TEXT NOT NULL, nutritionTip TEXT NOT NULL, safetyNote TEXT NOT NULL, generatedAt INTEGER NOT NULL)")
            db.execSQL("CREATE TABLE IF NOT EXISTS plan_exercises (localId INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, planDayLocalId INTEGER NOT NULL, name TEXT NOT NULL, muscleGroup TEXT NOT NULL, sets INTEGER NOT NULL, reps TEXT NOT NULL, restSeconds INTEGER NOT NULL, notes TEXT NOT NULL, FOREIGN KEY(planDayLocalId) REFERENCES workout_plan_days(localId) ON DELETE CASCADE)")
            db.execSQL("CREATE INDEX IF NOT EXISTS index_plan_exercises_planDayLocalId ON plan_exercises(planDayLocalId)")
            db.execSQL("CREATE TABLE IF NOT EXISTS body_weight_logs (localId INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, remoteId TEXT, uid TEXT NOT NULL, weightKg REAL NOT NULL, date INTEGER NOT NULL, notes TEXT, syncStatus TEXT NOT NULL, lastSyncedAt INTEGER)")
            db.execSQL("CREATE TABLE IF NOT EXISTS measurement_logs (localId INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, remoteId TEXT, uid TEXT NOT NULL, chestCm REAL, waistCm REAL, hipCm REAL, armCm REAL, thighCm REAL, date INTEGER NOT NULL, syncStatus TEXT NOT NULL, lastSyncedAt INTEGER)")
            db.execSQL("CREATE TABLE IF NOT EXISTS sync_queue (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, uid TEXT NOT NULL, entityType TEXT NOT NULL, localEntityId INTEGER NOT NULL, operation TEXT NOT NULL, status TEXT NOT NULL, attemptCount INTEGER NOT NULL, createdAt INTEGER NOT NULL, lastAttemptAt INTEGER, errorMessage TEXT)")
            db.execSQL("CREATE TABLE IF NOT EXISTS achievements (`key` TEXT NOT NULL PRIMARY KEY, uid TEXT NOT NULL, title TEXT NOT NULL, description TEXT NOT NULL, unlockedAt INTEGER NOT NULL, syncStatus TEXT NOT NULL)")
            db.execSQL("CREATE TABLE IF NOT EXISTS app_settings (id INTEGER NOT NULL PRIMARY KEY, uid TEXT, unit TEXT NOT NULL, remindersEnabled INTEGER NOT NULL, workoutReminderHour INTEGER NOT NULL, themeMode TEXT NOT NULL, updatedAt INTEGER NOT NULL)")
        }
    }
}
