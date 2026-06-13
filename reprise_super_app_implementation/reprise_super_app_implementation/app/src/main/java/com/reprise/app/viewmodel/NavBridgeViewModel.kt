package com.reprise.app.viewmodel

import androidx.lifecycle.ViewModel
import com.reprise.app.auth.AuthRepository
import com.reprise.app.data.repository.PlanRepository
import com.reprise.app.domain.model.PersonalWorkoutDay
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flowOf
import javax.inject.Inject

@HiltViewModel
class NavBridgeViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val planRepository: PlanRepository
) : ViewModel() {
    val currentUid: String? get() = authRepository.currentUserId
    fun isLoggedIn(): Boolean = authRepository.isLoggedIn()

    fun observePlan(uid: String?): Flow<List<PersonalWorkoutDay>> =
        if (uid == null) flowOf(emptyList()) else planRepository.observePlan(uid)

    fun observeTodayPlan(uid: String?, dayOfMonth: Int): Flow<PersonalWorkoutDay?> =
        if (uid == null) flowOf(null) else planRepository.observeTodayPlan(uid, dayOfMonth)
}
