package com.reprise.app.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.reprise.app.auth.AuthRepository
import com.reprise.app.data.repository.FitnessProfileRepository
import com.reprise.app.data.repository.PlanRepository
import com.reprise.app.domain.model.*
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ProfileSetupState(
    val name: String = "",
    val age: String = "",
    val gender: Gender = Gender.MALE,
    val heightCm: String = "",
    val weightKg: String = "",
    val level: TrainingLevel = TrainingLevel.BEGINNER,
    val equipment: EquipmentAccess = EquipmentAccess.FULL_GYM,
    val targetType: BodyTargetType = BodyTargetType.BUILD_MUSCLE,
    val targetWeightKg: String = "",
    val targetDays: String = "30",
    val gymDaysPerWeek: Int = 4,
    val sessionMinutes: Int = 45,
    val targetSpeed: TargetSpeed = TargetSpeed.MODERATE,
    val frequencyMode: TrainingFrequencyMode = TrainingFrequencyMode.NORMAL,
    val priorityMuscle: PriorityMuscle = PriorityMuscle.FULL_BODY,
    val hasInjury: Boolean = false,
    val injuryNote: String = "",
    val isLoading: Boolean = false,
    val message: String? = null,
    val completed: Boolean = false
)

@HiltViewModel
class ProfileSetupViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val profileRepository: FitnessProfileRepository,
    private val planRepository: PlanRepository
) : ViewModel() {
    private val _state = MutableStateFlow(ProfileSetupState())
    val state: StateFlow<ProfileSetupState> = _state.asStateFlow()

    fun updateName(v: String) { _state.value = _state.value.copy(name = v) }
    fun updateAge(v: String) { _state.value = _state.value.copy(age = v.filter { it.isDigit() }.take(2)) }
    fun updateHeight(v: String) { _state.value = _state.value.copy(heightCm = decimal(v)) }
    fun updateWeight(v: String) { _state.value = _state.value.copy(weightKg = decimal(v)) }
    fun updateGender(v: Gender) { _state.value = _state.value.copy(gender = v) }
    fun updateLevel(v: TrainingLevel) { _state.value = _state.value.copy(level = v) }
    fun updateEquipment(v: EquipmentAccess) { _state.value = _state.value.copy(equipment = v) }
    fun updateTargetType(v: BodyTargetType) { _state.value = _state.value.copy(targetType = v) }
    fun updateTargetWeight(v: String) { _state.value = _state.value.copy(targetWeightKg = decimal(v)) }
    fun updateTargetDays(v: String) { _state.value = _state.value.copy(targetDays = v.filter { it.isDigit() }.take(3)) }
    fun updateGymDays(v: Int) { _state.value = _state.value.copy(gymDaysPerWeek = v.coerceIn(2, 6)) }
    fun updateSession(v: Int) { _state.value = _state.value.copy(sessionMinutes = v.coerceIn(25, 90)) }
    fun updateSpeed(v: TargetSpeed) { _state.value = _state.value.copy(targetSpeed = v) }
    fun updateFrequency(v: TrainingFrequencyMode) { _state.value = _state.value.copy(frequencyMode = v) }
    fun updatePriority(v: PriorityMuscle) { _state.value = _state.value.copy(priorityMuscle = v) }
    fun updateHasInjury(v: Boolean) { _state.value = _state.value.copy(hasInjury = v) }
    fun updateInjuryNote(v: String) { _state.value = _state.value.copy(injuryNote = v) }

    fun saveAndGenerate() = viewModelScope.launch {
        val uid = authRepository.currentUserId ?: return@launch show("Please login first.")
        val s = state.value
        val age = s.age.toIntOrNull()
        val height = s.heightCm.toDoubleOrNull()
        val weight = s.weightKg.toDoubleOrNull()
        val targetWeight = s.targetWeightKg.toDoubleOrNull()
        val targetDays = s.targetDays.toIntOrNull() ?: 30

        if (s.name.isBlank()) return@launch show("Name is required.")
        if (age == null || age !in 13..80) return@launch show("Enter age between 13 and 80.")
        if (height == null || height !in 120.0..230.0) return@launch show("Enter valid height in cm.")
        if (weight == null || weight !in 30.0..220.0) return@launch show("Enter valid weight in kg.")
        if ((s.targetType == BodyTargetType.LOSE_WEIGHT || s.targetType == BodyTargetType.GAIN_WEIGHT) && targetWeight == null) return@launch show("Target weight required.")
        if (s.targetType == BodyTargetType.LOSE_WEIGHT && targetWeight != null && targetWeight >= weight) return@launch show("Target weight must be lower for weight loss.")
        if (s.targetType == BodyTargetType.GAIN_WEIGHT && targetWeight != null && targetWeight <= weight) return@launch show("Target weight must be higher for weight gain.")

        val profile = UserFitnessProfile(
            uid = uid,
            name = s.name,
            age = age,
            gender = s.gender,
            heightCm = height,
            weightKg = weight,
            level = s.level,
            equipment = s.equipment,
            hasInjury = s.hasInjury,
            injuryNote = s.injuryNote.ifBlank { null },
            target = WorkoutTarget(
                targetType = s.targetType,
                currentWeightKg = weight,
                targetWeightKg = targetWeight,
                targetDays = targetDays.coerceIn(30, 365),
                gymDaysPerWeek = s.gymDaysPerWeek,
                sessionMinutes = s.sessionMinutes,
                targetSpeed = s.targetSpeed,
                frequencyMode = s.frequencyMode,
                priorityMuscle = s.priorityMuscle
            )
        )

        _state.value = s.copy(isLoading = true)
        profileRepository.saveProfile(profile)
            .onSuccess {
                planRepository.regeneratePlan(profile)
                    .onSuccess { _state.value = _state.value.copy(isLoading = false, completed = true) }
                    .onFailure { show(it.message ?: "Plan generation failed.") }
            }
            .onFailure { show(it.message ?: "Profile save failed.") }
    }

    private fun show(message: String) { _state.value = _state.value.copy(isLoading = false, message = message) }
    fun clearMessage() { _state.value = _state.value.copy(message = null) }

    private fun decimal(v: String): String {
        val clean = v.filter { it.isDigit() || it == '.' }
        val first = clean.indexOf('.')
        return if (first == -1) clean.take(6) else (clean.take(first + 1) + clean.drop(first + 1).replace(".", "")).take(6)
    }
}
