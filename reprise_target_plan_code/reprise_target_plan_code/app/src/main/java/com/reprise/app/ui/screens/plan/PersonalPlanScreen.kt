package com.reprise.app.ui.screens.plan

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.selection.selectable
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Slider
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.reprise.app.domain.model.*
import com.reprise.app.ui.components.GlassCard
import com.reprise.app.ui.components.NeonButton
import com.reprise.app.ui.theme.AppBg
import com.reprise.app.ui.theme.TextPrimary
import com.reprise.app.ui.theme.TextSecondary
import com.reprise.app.viewmodel.PersonalPlanViewModel
import com.reprise.app.viewmodel.ProfileFormState

@Composable
fun PersonalPlanScreen(
    viewModel: PersonalPlanViewModel,
    onBack: () -> Unit
) {
    val form by viewModel.form.collectAsState()
    val ui by viewModel.uiState.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(ui.message) {
        ui.message?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearMessage()
        }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        containerColor = AppBg
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .background(AppBg)
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            item {
                TextButton(onClick = onBack) { Text("Back") }
                Text(
                    text = "Target-Based 30-Day Plan",
                    color = TextPrimary,
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "Age, gender, height, weight, target, gym days, frequency and injury based plan.",
                    color = TextSecondary
                )
            }

            item { ProfileFormCard(form = form, viewModel = viewModel) }

            item {
                NeonButton(
                    text = "Generate / Update My Plan",
                    onClick = { viewModel.saveProfileAndGeneratePlan() }
                )
            }

            ui.todayPlan?.let { today -> item { TodayPlanCard(today) } }

            if (ui.plan.isNotEmpty()) {
                item {
                    Text(
                        text = "Full 30-Day Monthly Repeat Plan",
                        color = TextPrimary,
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                }
                items(ui.plan) { day -> PlanDayCard(day) }
            }
        }
    }
}

@Composable
private fun ProfileFormCard(form: ProfileFormState, viewModel: PersonalPlanViewModel) {
    GlassCard {
        Text("Your Profile & Target", color = TextPrimary, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(12.dp))

        OutlinedTextField(
            value = form.age,
            onValueChange = viewModel::updateAge,
            label = { Text("Age") },
            modifier = Modifier.fillMaxWidth()
        )
        OutlinedTextField(
            value = form.heightCm,
            onValueChange = viewModel::updateHeight,
            label = { Text("Height cm") },
            modifier = Modifier.fillMaxWidth()
        )
        OutlinedTextField(
            value = form.weightKg,
            onValueChange = viewModel::updateWeight,
            label = { Text("Current weight kg") },
            modifier = Modifier.fillMaxWidth()
        )

        SelectEnumRow("Gender", Gender.values().toList(), form.gender, { it.name.cleanEnum() }, viewModel::updateGender)
        SelectEnumRow("Main Target", BodyTargetType.values().toList(), form.targetType, { it.name.cleanEnum() }, viewModel::updateTargetType)

        if (form.targetType == BodyTargetType.LOSE_WEIGHT || form.targetType == BodyTargetType.GAIN_WEIGHT) {
            OutlinedTextField(
                value = form.targetWeightKg,
                onValueChange = viewModel::updateTargetWeight,
                label = { Text("Target weight kg") },
                modifier = Modifier.fillMaxWidth()
            )
        }

        OutlinedTextField(
            value = form.targetDays,
            onValueChange = viewModel::updateTargetDays,
            label = { Text("Target duration days") },
            modifier = Modifier.fillMaxWidth()
        )

        Text("Gym days per week: ${form.gymDaysPerWeek}", color = TextPrimary, fontWeight = FontWeight.Bold)
        Slider(
            value = form.gymDaysPerWeek.toFloat(),
            onValueChange = { viewModel.updateGymDaysPerWeek(it.toInt()) },
            valueRange = 2f..6f,
            steps = 3
        )

        Text("Session time: ${form.sessionMinutes} minutes", color = TextPrimary, fontWeight = FontWeight.Bold)
        Slider(
            value = form.sessionMinutes.toFloat(),
            onValueChange = { viewModel.updateSessionMinutes(it.toInt()) },
            valueRange = 25f..90f,
            steps = 12
        )

        SelectEnumRow("Target Speed", TargetSpeed.values().toList(), form.targetSpeed, { it.name.cleanEnum() }, viewModel::updateTargetSpeed)
        SelectEnumRow("Level", TrainingLevel.values().toList(), form.level, { it.name.cleanEnum() }, viewModel::updateLevel)
        SelectEnumRow("Equipment", EquipmentAccess.values().toList(), form.equipment, { it.name.cleanEnum() }, viewModel::updateEquipment)
        SelectEnumRow("Training Frequency", TrainingFrequencyMode.values().toList(), form.frequencyMode, { it.name.cleanEnum() }, viewModel::updateFrequencyMode)
        SelectEnumRow("Priority Muscle", PriorityMuscle.values().toList(), form.priorityMuscle, { it.name.cleanEnum() }, viewModel::updatePriorityMuscle)

        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text("Any injury?", color = TextPrimary)
            Switch(checked = form.hasInjury, onCheckedChange = viewModel::updateHasInjury)
        }

        if (form.hasInjury) {
            OutlinedTextField(
                value = form.injuryNote,
                onValueChange = viewModel::updateInjuryNote,
                label = { Text("Injury note") },
                modifier = Modifier.fillMaxWidth()
            )
        }
    }
}

@Composable
private fun TodayPlanCard(day: PersonalWorkoutDay) {
    GlassCard {
        Text("Today’s Plan", color = TextSecondary)
        Text(day.title, color = TextPrimary, fontWeight = FontWeight.Bold)
        Text("${day.intensity} • ${day.estimatedMinutes} min", color = TextSecondary)
        Text(day.targetMessage, color = TextSecondary)
        Spacer(modifier = Modifier.height(10.dp))
        day.exercises.take(5).forEach {
            Text("• ${it.name} — ${it.sets} sets × ${it.reps}", color = TextPrimary)
        }
        Spacer(modifier = Modifier.height(8.dp))
        Text(day.safetyNote, color = TextSecondary)
    }
}

@Composable
private fun PlanDayCard(day: PersonalWorkoutDay) {
    GlassCard {
        Text(day.title, color = TextPrimary, fontWeight = FontWeight.Bold)
        Text("Week ${day.weekNumber} • ${day.focus} • ${day.intensity}", color = TextSecondary)
        Text("Estimated: ${day.estimatedMinutes} min", color = TextSecondary)
        Text(day.targetMessage, color = TextSecondary)
        Spacer(modifier = Modifier.height(10.dp))

        day.exercises.forEach { ex ->
            Column(modifier = Modifier.padding(vertical = 4.dp)) {
                Text(ex.name, color = TextPrimary, fontWeight = FontWeight.SemiBold)
                Text("${ex.muscleGroup} • ${ex.sets} sets × ${ex.reps} • Rest ${ex.restSeconds}s", color = TextSecondary)
                Text(ex.notes, color = TextSecondary)
            }
        }

        Spacer(modifier = Modifier.height(8.dp))
        Text("Nutrition: ${day.nutritionTip}", color = TextSecondary)
        Text("Safety: ${day.safetyNote}", color = TextSecondary)
    }
}

@Composable
private fun <T> SelectEnumRow(
    title: String,
    options: List<T>,
    selected: T,
    label: (T) -> String,
    onSelected: (T) -> Unit
) {
    Column {
        Text(title, color = TextPrimary, fontWeight = FontWeight.Bold)
        options.forEach { option ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .selectable(selected = selected == option, onClick = { onSelected(option) })
                    .padding(vertical = 2.dp)
            ) {
                RadioButton(selected = selected == option, onClick = { onSelected(option) })
                Text(label(option), color = TextPrimary, modifier = Modifier.padding(top = 12.dp))
            }
        }
    }
}

private fun String.cleanEnum(): String = replace("_", " ").lowercase().replaceFirstChar { it.uppercase() }
