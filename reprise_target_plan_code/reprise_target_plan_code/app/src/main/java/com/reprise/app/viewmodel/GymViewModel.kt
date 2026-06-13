package com.reprise.app.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.reprise.app.data.local.entity.ExerciseSetLogEntity
import com.reprise.app.data.local.entity.WorkoutLogEntity
import com.reprise.app.data.local.entity.WorkoutWithSets
import com.reprise.app.data.repository.WorkoutRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.util.Calendar
import javax.inject.Inject

data class DraftSet(
    val exerciseName: String = "",
    val muscleGroup: String = "Chest",
    val equipment: String? = null,
    val setNumber: Int = 1,
    val reps: String = "",
    val weight: String = "",
    val restSeconds: Int? = 90,
    val notes: String? = null
)

data class DashboardStats(
    val workoutCountThisWeek: Int = 0,
    val totalVolumeThisWeek: Double = 0.0,
    val recentWorkoutTitle: String = "No workout yet",
    val bestLift: Double = 0.0
)

sealed class WorkoutUiState {
    object Loading : WorkoutUiState()
    data class Success(val workouts: List<WorkoutWithSets>) : WorkoutUiState()
    data class Error(val message: String) : WorkoutUiState()
}

@HiltViewModel
class GymViewModel @Inject constructor(
    private val repository: WorkoutRepository
) : ViewModel() {

    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    val workoutsUiState: StateFlow<WorkoutUiState> = _searchQuery
        .flatMapLatest { query -> repository.searchWorkouts(query) }
        .map<List<WorkoutWithSets>, WorkoutUiState> { WorkoutUiState.Success(it) }
        .catch { emit(WorkoutUiState.Error(it.message ?: "Something went wrong")) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), WorkoutUiState.Loading)

    private val _workoutTitle = MutableStateFlow("")
    val workoutTitle: StateFlow<String> = _workoutTitle.asStateFlow()

    private val _draftSets = MutableStateFlow<List<DraftSet>>(emptyList())
    val draftSets: StateFlow<List<DraftSet>> = _draftSets.asStateFlow()

    private val _message = MutableSharedFlow<String>()
    val message: SharedFlow<String> = _message.asSharedFlow()

    private val _dashboardStats = MutableStateFlow(DashboardStats())
    val dashboardStats: StateFlow<DashboardStats> = _dashboardStats.asStateFlow()

    init { loadDashboardStats() }

    fun updateSearch(query: String) { _searchQuery.value = query }
    fun updateWorkoutTitle(title: String) { _workoutTitle.value = title }

    fun addEmptySet() {
        val next = _draftSets.value.size + 1
        _draftSets.value = _draftSets.value + DraftSet(setNumber = next)
    }

    fun updateSet(index: Int, updated: DraftSet) {
        _draftSets.value = _draftSets.value.mapIndexed { i, item -> if (i == index) updated else item }
    }

    fun removeSet(index: Int) {
        _draftSets.value = _draftSets.value
            .filterIndexed { i, _ -> i != index }
            .mapIndexed { i, item -> item.copy(setNumber = i + 1) }
    }

    fun saveWorkout() {
        viewModelScope.launch {
            val title = _workoutTitle.value.trim()
            val sets = _draftSets.value
            if (title.isBlank()) return@launch _message.emit("Workout title cannot be empty.")
            if (sets.isEmpty()) return@launch _message.emit("Please add at least one set.")

            val invalid = sets.any {
                it.exerciseName.isBlank() || (it.reps.toIntOrNull() ?: 0) <= 0 || (it.weight.toDoubleOrNull() ?: -1.0) < 0.0
            }
            if (invalid) return@launch _message.emit("Please fix invalid exercise, reps, or weight.")

            val workout = WorkoutLogEntity(title = title, isSynced = false)
            val entities = sets.map {
                ExerciseSetLogEntity(
                    workoutId = 0L,
                    exerciseName = it.exerciseName.trim(),
                    muscleGroup = it.muscleGroup,
                    equipment = it.equipment,
                    setNumber = it.setNumber,
                    reps = it.reps.toInt(),
                    weight = it.weight.toDouble(),
                    restSeconds = it.restSeconds,
                    notes = it.notes
                )
            }

            repository.saveWorkout(workout, entities)
                .onSuccess {
                    _workoutTitle.value = ""
                    _draftSets.value = emptyList()
                    _message.emit("Workout saved offline. Sync will retry later.")
                    loadDashboardStats()
                }
                .onFailure { _message.emit(it.message ?: "Failed to save workout.") }
        }
    }

    fun deleteWorkout(workoutId: Long) {
        viewModelScope.launch {
            repository.deleteWorkout(workoutId)
                .onSuccess { _message.emit("Workout deleted.") }
                .onFailure { _message.emit("Failed to delete workout.") }
        }
    }

    private fun loadDashboardStats() {
        viewModelScope.launch {
            val start = startOfWeekMillis()
            val end = System.currentTimeMillis()
            _dashboardStats.value = DashboardStats(
                workoutCountThisWeek = repository.getWorkoutCount(start, end),
                totalVolumeThisWeek = repository.getWeeklyVolume(start, end)
            )
        }
    }

    private fun startOfWeekMillis(): Long {
        val c = Calendar.getInstance()
        c.set(Calendar.DAY_OF_WEEK, c.firstDayOfWeek)
        c.set(Calendar.HOUR_OF_DAY, 0)
        c.set(Calendar.MINUTE, 0)
        c.set(Calendar.SECOND, 0)
        c.set(Calendar.MILLISECOND, 0)
        return c.timeInMillis
    }
}
