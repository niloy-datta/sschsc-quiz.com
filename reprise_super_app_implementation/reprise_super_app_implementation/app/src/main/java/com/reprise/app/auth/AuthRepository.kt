package com.reprise.app.auth

import kotlinx.coroutines.flow.Flow

data class AuthUser(
    val uid: String,
    val email: String?,
    val isAnonymous: Boolean
)

interface AuthRepository {
    val authState: Flow<AuthUser?>
    val currentUserId: String?
    fun isLoggedIn(): Boolean
    suspend fun login(email: String, password: String): Result<String>
    suspend fun register(email: String, password: String): Result<String>
    suspend fun resetPassword(email: String): Result<Unit>
    suspend fun loginAnonymously(): Result<String>
    suspend fun logout(): Result<Unit>
    suspend fun deleteAccount(): Result<Unit>
}
