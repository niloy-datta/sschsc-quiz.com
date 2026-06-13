package com.reprise.app.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.reprise.app.auth.AuthRepository
import com.reprise.app.data.local.entity.ExerciseSetLogEntity
import com.reprise.app.data.local.entity.WorkoutLogEntity
import com.reprise.app.data.local.entity.WorkoutWithSets
import com.reprise.app.data.repository.WorkoutRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class DraftSet(
    val exerciseName: String = "",
    val muscleGroup: String = "Chest",
    val setNumber: Int = 1,
    val reps: String = "",
    val weight: String = "",
    val restSeconds: Int = 90,
    val notes: String = ""
)

data class WorkoutUiState(
    val title: String = "",
    val planDayNumber: Int? = null,
    val sets: List<DraftSet> = emptyList(),
    val query: String = "",
    val history: List<WorkoutWithSets> = emptyList(),
    val isLoading: Boolean = false,
    val message: String? = null
)

@HiltViewModel
class WorkoutViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val workoutRepository: WorkoutRepository
) : ViewModel() {
    private val _state = MutableStateFlow(WorkoutUiState())
    val state: StateFlow<WorkoutUiState> = _state.asStateFlow()

    init { observeHistory() }

    private fun observeHistory() {
        viewModelScope.launch {
            val uid = authRepository.currentUserId ?: return@launch
            state.map { it.query }.distinctUntilChanged().flatMapLatest { q ->
                workoutRepository.observeWorkouts(uid, q)
            }.collect { history ->
                _state.value = _state.value.copy(history = history)
            }
        }
    }

    fun updateTitle(v: String) { _state.value = _state.value.copy(title = v) }
    fun updateQuery(v: String) { _state.value = _state.value.copy(query = v) }

    fun startFromPlan(dayNumber: Int, title: String, exercises: List<com.reprise.app.domain.model.PlanExercise>) {
        _state.value = _state.value.copy(
            title = title,
            planDayNumber = dayNumber,
            sets = exercises.flatMap { ex ->
                (1..ex.sets).map { setNo ->
                    DraftSet(
                        exerciseName = ex.name,
                        muscleGroup = ex.muscleGroup,
                        setNumber = setNo,
                        restSeconds = ex.restSeconds,
                        notes = ex.notes
                    )
                }
            }
        )
    }

    fun addSet() {
        val next = _state.value.sets.size + 1
        _state.value = _state.value.copy(sets = _state.value.sets + DraftSet(setNumber = next))
    }

    fun updateSet(index: Int, set: DraftSet) {
        _state.value = _state.value.copy(sets = _state.value.sets.mapIndexed { i, old -> if (i == index) set else old })
    }

    fun removeSet(index: Int) {
        _state.value = _state.value.copy(sets = _state.value.sets.filterIndexed { i, _ -> i != index })
    }

    fun saveWorkout() = viewModelScope.launch {
        val uid = authRepository.currentUserId ?: return@launch show("Please login first.")
        val s = _state.value
        if (s.title.isBlank()) return@launch show("Workout title required.")
        if (s.sets.isEmpty()) return@launch show("Add at least one set.")

        val invalid = s.sets.any {
            it.exerciseName.isBlank() || (it.reps.toIntOrNull() ?: 0) <= 0 || (it.weight.toDoubleOrNull() ?: -1.0) < 0.0
        }
        if (invalid) return@launch show("Fix invalid exercise, reps, or weight.")

        val workout = WorkoutLogEntity(uid = uid, title = s.title, planDayNumber = s.planDayNumber)
        val sets = s.sets.map {
            ExerciseSetLogEntity(
                workoutLocalId = 0,
                exerciseName = it.exerciseName,
                muscleGroup = it.muscleGroup,
                setNumber = it.setNumber,
                reps = it.reps.toInt(),
                weight = it.weight.toDouble(),
                restSeconds = it.restSeconds,
                notes = it.notes.ifBlank { null }
            )
        }

        workoutRepository.saveWorkout(workout, sets)
            .onSuccess { _state.value = WorkoutUiState(message = "Workout saved offline. Sync will retry.") }
            .onFailure { show(it.message ?: "Failed to save workout.") }
    }

    fun deleteWorkout(localId: Long) = viewModelScope.launch {
        val uid = authRepository.currentUserId ?: return@launch
        workoutRepository.deleteWorkout(uid, localId)
            .onSuccess { show("Workout deleted.") }
            .onFailure { show("Delete failed.") }
    }

    private fun show(message: String) { _state.value = _state.value.copy(message = message, isLoading = false) }
    fun clearMessage() { _state.value = _state.value.copy(message = null) }
}
