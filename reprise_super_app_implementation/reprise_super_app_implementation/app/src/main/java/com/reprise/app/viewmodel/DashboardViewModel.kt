package com.reprise.app.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.reprise.app.auth.AuthRepository
import com.reprise.app.data.repository.*
import com.reprise.app.domain.model.PersonalWorkoutDay
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.util.Calendar
import javax.inject.Inject

data class DashboardUiState(
    val uid: String? = null,
    val todayPlan: PersonalWorkoutDay? = null,
    val weeklyWorkoutCount: Int = 0,
    val weeklyVolume: Double = 0.0,
    val isLoading: Boolean = true,
    val message: String? = null
)

@HiltViewModel
class DashboardViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val planRepository: PlanRepository,
    private val workoutRepository: WorkoutRepository
): ViewModel() {
    private val _state = MutableStateFlow(DashboardUiState())
    val state: StateFlow<DashboardUiState> = _state.asStateFlow()
    init { refresh() }
    fun refresh() = viewModelScope.launch {
        val uid = authRepository.currentUserId
        val day = Calendar.getInstance().get(Calendar.DAY_OF_MONTH)
        _state.value = _state.value.copy(uid = uid, isLoading = true)
        if (uid != null) {
            planRepository.observeTodayPlan(uid, day).collect { p ->
                _state.value = _state.value.copy(todayPlan = p, isLoading = false)
            }
        } else _state.value = _state.value.copy(isLoading = false)
    }
    fun logout() = viewModelScope.launch { authRepository.logout(); _state.value = DashboardUiState(message = "Logged out") }
}
