package com.reprise.app.ui.screens.onboarding

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.reprise.app.domain.model.*
import com.reprise.app.ui.components.GlassCard
import com.reprise.app.ui.components.NeonButton
import com.reprise.app.ui.theme.*
import com.reprise.app.viewmodel.PersonalPlanViewModel

@Composable
fun ProfileSetupScreen(viewModel: PersonalPlanViewModel, onDone:()->Unit) {
    val form by viewModel.form.collectAsState(); val ui by viewModel.uiState.collectAsState(); val snack=remember{SnackbarHostState()}
    LaunchedEffect(ui.message){ ui.message?.let{ snack.showSnackbar(it); viewModel.clearMessage(); if(it.contains("generated", true)) onDone() } }
    Scaffold(snackbarHost={SnackbarHost(snack)}, containerColor=AppBg){ pad ->
        LazyColumn(Modifier.fillMaxSize().padding(pad).background(AppBg).padding(20.dp), verticalArrangement=Arrangement.spacedBy(14.dp)) {
            item { Text("Build Your Personal Plan", color=TextPrimary, style=MaterialTheme.typography.headlineMedium, fontWeight=FontWeight.Bold); Text("Age, body, target, gym days, equipment, injury and high-frequency settings.", color=TextSecondary) }
            item { GlassCard {
                OutlinedTextField(form.age, viewModel::updateAge, label={Text("Age")}, modifier=Modifier.fillMaxWidth())
                OutlinedTextField(form.heightCm, viewModel::updateHeight, label={Text("Height cm")}, modifier=Modifier.fillMaxWidth())
                OutlinedTextField(form.weightKg, viewModel::updateWeight, label={Text("Current weight kg")}, modifier=Modifier.fillMaxWidth())
                OutlinedTextField(form.targetWeightKg, viewModel::updateTargetWeight, label={Text("Target weight kg (optional except loss/gain)")}, modifier=Modifier.fillMaxWidth())
                OutlinedTextField(form.targetDays, viewModel::updateTargetDays, label={Text("Target days")}, modifier=Modifier.fillMaxWidth())
                DropdownLine("Gender", form.gender.name){ viewModel.updateGender(Gender.values()[(Gender.values().indexOf(form.gender)+1)%Gender.values().size]) }
                DropdownLine("Target", form.targetType.name){ viewModel.updateTargetType(BodyTargetType.values()[(BodyTargetType.values().indexOf(form.targetType)+1)%BodyTargetType.values().size]) }
                DropdownLine("Level", form.level.name){ viewModel.updateLevel(TrainingLevel.values()[(TrainingLevel.values().indexOf(form.level)+1)%TrainingLevel.values().size]) }
                DropdownLine("Equipment", form.equipment.name){ viewModel.updateEquipment(EquipmentAccess.values()[(EquipmentAccess.values().indexOf(form.equipment)+1)%EquipmentAccess.values().size]) }
                DropdownLine("Speed", form.targetSpeed.name){ viewModel.updateTargetSpeed(TargetSpeed.values()[(TargetSpeed.values().indexOf(form.targetSpeed)+1)%TargetSpeed.values().size]) }
                DropdownLine("Frequency", form.frequencyMode.name){ viewModel.updateFrequencyMode(TrainingFrequencyMode.values()[(TrainingFrequencyMode.values().indexOf(form.frequencyMode)+1)%TrainingFrequencyMode.values().size]) }
                DropdownLine("Priority", form.priorityMuscle.name){ viewModel.updatePriorityMuscle(PriorityMuscle.values()[(PriorityMuscle.values().indexOf(form.priorityMuscle)+1)%PriorityMuscle.values().size]) }
                Text("Gym days/week: ${form.gymDaysPerWeek}", color=TextPrimary); Slider(form.gymDaysPerWeek.toFloat(), { viewModel.updateGymDaysPerWeek(it.toInt()) }, valueRange=2f..6f, steps=3)
                Text("Session minutes: ${form.sessionMinutes}", color=TextPrimary); Slider(form.sessionMinutes.toFloat(), { viewModel.updateSessionMinutes(it.toInt()) }, valueRange=25f..90f, steps=12)
                Row(Modifier.fillMaxWidth(), horizontalArrangement=Arrangement.SpaceBetween){ Text("Any injury?", color=TextPrimary); Switch(form.hasInjury, viewModel::updateHasInjury) }
                if(form.hasInjury) OutlinedTextField(form.injuryNote, viewModel::updateInjuryNote, label={Text("Injury note")}, modifier=Modifier.fillMaxWidth())
            } }
            item { NeonButton("Generate 30-Day Plan"){ viewModel.saveProfileAndGeneratePlan() } }
        }
    }
}

@Composable private fun DropdownLine(label:String, value:String, onClick:()->Unit){
    TextButton(onClick=onClick, modifier=Modifier.fillMaxWidth()){ Text("$label: ${value.replace('_',' ')}") }
}
