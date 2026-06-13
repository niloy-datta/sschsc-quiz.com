package com.reprise.app.util

object ExerciseImageHelper {
    fun getImageForExercise(name: String): String {
        val lower = name.lowercase()
        return when {
            "bench" in lower || "chest" in lower || "press" in lower ->
                "https://images.unsplash.com/photo-1534438327276-14e5300c3a48"
            "squat" in lower || "leg" in lower || "lunge" in lower ->
                "https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a"
            "deadlift" in lower || "row" in lower || "back" in lower ->
                "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e"
            "curl" in lower || "bicep" in lower || "tricep" in lower ->
                "https://images.unsplash.com/photo-1598971639058-fab3c3109a00"
            "shoulder" in lower || "lateral" in lower ->
                "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61"
            "abs" in lower || "core" in lower || "plank" in lower ->
                "https://images.unsplash.com/photo-1571019613914-85f342c6a11e"
            else ->
                "https://images.unsplash.com/photo-1517836357463-d25dfeac3438"
        }
    }
}
