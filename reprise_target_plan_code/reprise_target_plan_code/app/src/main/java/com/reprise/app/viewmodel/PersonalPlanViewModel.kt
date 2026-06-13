package com.reprise.app.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.reprise.app.data.repository.FitnessProfileRepository
import com.reprise.app.domain.model.*
import com.reprise.app.domain.planner.TargetBasedWorkoutPlanner
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.util.Calendar
import javax.inject.Inject

data class ProfileFormState(
    val age: String = "",
    val gender: Gender = Gender.MALE,
    val heightCm: String = "",
    val weightKg: String = "",

    val targetType: BodyTargetType = BodyTargetType.BUILD_MUSCLE,
    val targetWeightKg: String = "",
    val targetDays: String = "30",
    val targetSpeed: TargetSpeed = TargetSpeed.MODERATE,

    val level: TrainingLevel = TrainingLevel.BEGINNER,
    val gymDaysPerWeek: Int = 4,
    val sessionMinutes: Int = 45,
    val equipment: EquipmentAccess = EquipmentAccess.FULL_GYM,
    val frequencyMode: TrainingFrequencyMode = TrainingFrequencyMode.NORMAL,
    val priorityMuscle: PriorityMuscle = PriorityMuscle.FULL_BODY,

    val hasInjury: Boolean = false,
    val injuryNote: String = ""
)

data class PersonalPlanUiState(
    val profile: UserFitnessProfile? = null,
    val plan: List<PersonalWorkoutDay> = emptyList(),
    val todayPlan: PersonalWorkoutDay? = null,
    val isLoading: Boolean = true,
    val message: String? = null
)

@HiltViewModel
class PersonalPlanViewModel @Inject constructor(
    private val repository: FitnessProfileRepository,
    private val planner: TargetBasedWorkoutPlanner
) : ViewModel() {

    private val _form = MutableStateFlow(ProfileFormState())
    val form: StateFlow<ProfileFormState> = _form.asStateFlow()

    private val _uiState = MutableStateFlow(PersonalPlanUiState())
    val uiState: StateFlow<PersonalPlanUiState> = _uiState.asStateFlow()

    init { observeProfile() }

    private fun observeProfile() {
        viewModelScope.launch {
            repository.observeProfile().collect { profile ->
                if (profile == null) {
                    _uiState.value = PersonalPlanUiState(isLoading = false)
                } else {
                    val plan = planner.generate30DayPlan(profile)
                    val day = Calendar.getInstance().get(Calendar.DAY_OF_MONTH)
                    val today = planner.getMonthlyRepeatDay(profile, day)
                    _uiState.value = PersonalPlanUiState(
                        profile = profile,
                        plan = plan,
                        todayPlan = today,
                        isLoading = false
                    )
                    _form.value = ProfileFormState(
                        age = profile.age.toString(),
                        gender = profile.gender,
                        heightCm = cleanNumberForDisplay(profile.heightCm),
                        weightKg = cleanNumberForDisplay(profile.weightKg),
                        targetType = profile.target.targetType,
                        targetWeightKg = profile.target.targetWeightKg?.let { cleanNumberForDisplay(it) }.orEmpty(),
                        targetDays = profile.target.targetDays.toString(),
                        targetSpeed = profile.target.targetSpeed,
                        level = profile.level,
                        gymDaysPerWeek = profile.target.gymDaysPerWeek,
                        sessionMinutes = profile.target.sessionMinutes,
                        equipment = profile.equipment,
                        frequencyMode = profile.target.frequencyMode,
                        priorityMuscle = profile.target.priorityMuscle,
                        hasInjury = profile.hasInjury,
                        injuryNote = profile.injuryNote.orEmpty()
                    )
                }
            }
        }
    }

    fun updateAge(value: String) { _form.value = _form.value.copy(age = value.filter { it.isDigit() }.take(2)) }
    fun updateHeight(value: String) { _form.value = _form.value.copy(heightCm = cleanDecimal(value)) }
    fun updateWeight(value: String) { _form.value = _form.value.copy(weightKg = cleanDecimal(value)) }
    fun updateGender(value: Gender) { _form.value = _form.value.copy(gender = value) }
    fun updateTargetType(value: BodyTargetType) { _form.value = _form.value.copy(targetType = value) }
    fun updateTargetWeight(value: String) { _form.value = _form.value.copy(targetWeightKg = cleanDecimal(value)) }
    fun updateTargetDays(value: String) { _form.value = _form.value.copy(targetDays = value.filter { it.isDigit() }.take(3)) }
    fun updateTargetSpeed(value: TargetSpeed) { _form.value = _form.value.copy(targetSpeed = value) }
    fun updateLevel(value: TrainingLevel) { _form.value = _form.value.copy(level = value) }
    fun updateGymDaysPerWeek(value: Int) { _form.value = _form.value.copy(gymDaysPerWeek = value.coerceIn(2, 6)) }
    fun updateSessionMinutes(value: Int) { _form.value = _form.value.copy(sessionMinutes = value.coerceIn(25, 90)) }
    fun updateEquipment(value: EquipmentAccess) { _form.value = _form.value.copy(equipment = value) }
    fun updateFrequencyMode(value: TrainingFrequencyMode) { _form.value = _form.value.copy(frequencyMode = value) }
    fun updatePriorityMuscle(value: PriorityMuscle) { _form.value = _form.value.copy(priorityMuscle = value) }
    fun updateHasInjury(value: Boolean) { _form.value = _form.value.copy(hasInjury = value) }
    fun updateInjuryNote(value: String) { _form.value = _form.value.copy(injuryNote = value.take(200)) }

    fun saveProfileAndGeneratePlan() {
        viewModelScope.launch {
            val f = _form.value
            val age = f.age.toIntOrNull()
            val height = f.heightCm.toDoubleOrNull()
            val weight = f.weightKg.toDoubleOrNull()
            val targetWeight = f.targetWeightKg.toDoubleOrNull()
            val targetDays = f.targetDays.toIntOrNull() ?: 30

            if (age == null || age !in 13..80) return@launch showMessage("Please enter a valid age between 13 and 80.")
            if (height == null || height !in 120.0..230.0) return@launch showMessage("Please enter a valid height in cm.")
            if (weight == null || weight !in 30.0..220.0) return@launch showMessage("Please enter a valid weight in kg.")
            if ((f.targetType == BodyTargetType.LOSE_WEIGHT || f.targetType == BodyTargetType.GAIN_WEIGHT) && targetWeight == null) {
                return@launch showMessage("Please enter your target weight.")
            }
            if (targetDays !in 30..365) return@launch showMessage("Target duration must be between 30 and 365 days.")
            if (f.targetType == BodyTargetType.LOSE_WEIGHT && targetWeight != null && targetWeight >= weight) {
                return@launch showMessage("For weight loss, target weight must be lower than current weight.")
            }
            if (f.targetType == BodyTargetType.GAIN_WEIGHT && targetWeight != null && targetWeight <= weight) {
                return@launch showMessage("For weight gain, target weight must be higher than current weight.")
            }

            val profile = UserFitnessProfile(
                age = age,
                gender = f.gender,
                heightCm = height,
                weightKg = weight,
                goal = when (f.targetType) {
                    BodyTargetType.LOSE_WEIGHT -> FitnessGoal.FAT_LOSS
                    BodyTargetType.GAIN_WEIGHT,
                    BodyTargetType.BUILD_MUSCLE -> FitnessGoal.MUSCLE_GAIN
                    BodyTargetType.BUILD_STRENGTH -> FitnessGoal.STRENGTH
                    else -> FitnessGoal.GENERAL_FITNESS
                },
                level = f.level,
                daysPerWeek = f.gymDaysPerWeek,
                equipment = f.equipment,
                hasInjury = f.hasInjury,
                injuryNote = f.injuryNote.ifBlank { null },
                target = WorkoutTarget(
                    targetType = f.targetType,
                    currentWeightKg = weight,
                    targetWeightKg = targetWeight,
                    targetDays = targetDays,
                    gymDaysPerWeek = f.gymDaysPerWeek,
                    sessionMinutes = f.sessionMinutes,
                    targetSpeed = f.targetSpeed,
                    frequencyMode = f.frequencyMode,
                    priorityMuscle = f.priorityMuscle
                )
            )

            repository.saveProfile(profile)
                .onSuccess { showMessage("Target-based 30-day workout plan generated.") }
                .onFailure { showMessage(it.message ?: "Failed to save profile.") }
        }
    }

    private fun showMessage(message: String) {
        _uiState.value = _uiState.value.copy(message = message)
    }

    fun clearMessage() {
        _uiState.value = _uiState.value.copy(message = null)
    }

    private fun cleanDecimal(value: String): String {
        return value.filter { it.isDigit() || it == '.' }
            .let {
                val firstDot = it.indexOf('.')
                if (firstDot == -1) it else it.take(firstDot + 1) + it.drop(firstDot + 1).replace(".", "")
            }
            .take(6)
    }

    private fun cleanNumberForDisplay(value: Double): String {
        return if (value % 1.0 == 0.0) value.toInt().toString() else value.toString()
    }
}
