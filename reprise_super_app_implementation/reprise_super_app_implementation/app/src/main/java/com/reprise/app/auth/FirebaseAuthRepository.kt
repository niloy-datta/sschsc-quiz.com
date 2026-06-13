package com.reprise.app.auth

import com.google.firebase.auth.FirebaseAuth
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import javax.inject.Inject

class FirebaseAuthRepository @Inject constructor(
    private val firebaseAuth: FirebaseAuth
) : AuthRepository {

    override val authState: Flow<AuthUser?> = callbackFlow {
        val listener = FirebaseAuth.AuthStateListener { auth ->
            val user = auth.currentUser
            trySend(user?.let { AuthUser(it.uid, it.email, it.isAnonymous) })
        }
        firebaseAuth.addAuthStateListener(listener)
        awaitClose { firebaseAuth.removeAuthStateListener(listener) }
    }

    override val currentUserId: String?
        get() = firebaseAuth.currentUser?.uid

    override fun isLoggedIn(): Boolean = firebaseAuth.currentUser != null

    override suspend fun login(email: String, password: String): Result<String> = try {
        val result = firebaseAuth.signInWithEmailAndPassword(email, password).await()
        Result.success(result.user?.uid ?: error("User not found"))
    } catch (e: Exception) { Result.failure(e) }

    override suspend fun register(email: String, password: String): Result<String> = try {
        val result = firebaseAuth.createUserWithEmailAndPassword(email, password).await()
        Result.success(result.user?.uid ?: error("User not found"))
    } catch (e: Exception) { Result.failure(e) }

    override suspend fun resetPassword(email: String): Result<Unit> = try {
        firebaseAuth.sendPasswordResetEmail(email).await()
        Result.success(Unit)
    } catch (e: Exception) { Result.failure(e) }

    override suspend fun loginAnonymously(): Result<String> = try {
        val result = firebaseAuth.signInAnonymously().await()
        Result.success(result.user?.uid ?: error("User not found"))
    } catch (e: Exception) { Result.failure(e) }

    override suspend fun logout(): Result<Unit> = try {
        firebaseAuth.signOut()
        Result.success(Unit)
    } catch (e: Exception) { Result.failure(e) }

    override suspend fun deleteAccount(): Result<Unit> = try {
        firebaseAuth.currentUser?.delete()?.await()
        Result.success(Unit)
    } catch (e: Exception) { Result.failure(e) }
}
