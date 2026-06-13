package com.reprise.app.data.local.database

import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase

object DatabaseMigrations {

    val MIGRATION_1_2 = object : Migration(1, 2) {
        override fun migrate(db: SupportSQLiteDatabase) {
            db.execSQL(
                """
                CREATE TABLE IF NOT EXISTS user_fitness_profile (
                    id INTEGER NOT NULL PRIMARY KEY,
                    age INTEGER NOT NULL,
                    gender TEXT NOT NULL,
                    heightCm REAL NOT NULL,
                    weightKg REAL NOT NULL,
                    goal TEXT NOT NULL,
                    level TEXT NOT NULL,
                    daysPerWeek INTEGER NOT NULL,
                    equipment TEXT NOT NULL,
                    hasInjury INTEGER NOT NULL,
                    injuryNote TEXT,
                    updatedAt INTEGER NOT NULL
                )
                """.trimIndent()
            )
        }
    }

    val MIGRATION_2_3 = object : Migration(2, 3) {
        override fun migrate(db: SupportSQLiteDatabase) {
            db.execSQL("ALTER TABLE user_fitness_profile ADD COLUMN targetType TEXT NOT NULL DEFAULT 'GENERAL_FITNESS'")
            db.execSQL("ALTER TABLE user_fitness_profile ADD COLUMN targetWeightKg REAL")
            db.execSQL("ALTER TABLE user_fitness_profile ADD COLUMN targetDays INTEGER NOT NULL DEFAULT 30")
            db.execSQL("ALTER TABLE user_fitness_profile ADD COLUMN sessionMinutes INTEGER NOT NULL DEFAULT 45")
            db.execSQL("ALTER TABLE user_fitness_profile ADD COLUMN targetSpeed TEXT NOT NULL DEFAULT 'MODERATE'")
            db.execSQL("ALTER TABLE user_fitness_profile ADD COLUMN frequencyMode TEXT NOT NULL DEFAULT 'NORMAL'")
            db.execSQL("ALTER TABLE user_fitness_profile ADD COLUMN priorityMuscle TEXT NOT NULL DEFAULT 'FULL_BODY'")
        }
    }
}
