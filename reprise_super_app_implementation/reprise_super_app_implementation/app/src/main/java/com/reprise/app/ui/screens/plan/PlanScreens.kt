package com.reprise.app.ui.screens.plan

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.reprise.app.domain.model.PersonalWorkoutDay
import com.reprise.app.ui.components.*
import com.reprise.app.ui.theme.*
import com.reprise.app.viewmodel.PersonalPlanViewModel

@Composable
fun TodayPlanScreen(viewModel: PersonalPlanViewModel, onBack:()->Unit) {
    val ui by viewModel.uiState.collectAsState()
    Column(Modifier.fillMaxSize().background(AppBg).padding(20.dp)) {
        TextButton(onClick=onBack){ Text("Back") }
        Text("Today’s Workout", color=TextPrimary, style=MaterialTheme.typography.headlineMedium, fontWeight=FontWeight.Bold)
        Spacer(Modifier.height(14.dp))
        ui.todayPlan?.let { PlanDayCard(it) } ?: EmptyStateView("No plan", "Generate your personal plan first.")
    }
}

@Composable
fun FullPlanScreen(viewModel: PersonalPlanViewModel, onBack:()->Unit) {
    val ui by viewModel.uiState.collectAsState()
    LazyColumn(Modifier.fillMaxSize().background(AppBg).padding(20.dp), verticalArrangement=Arrangement.spacedBy(12.dp)) {
        item { TextButton(onClick=onBack){ Text("Back") }; Text("30-Day Monthly Repeat Plan", color=TextPrimary, style=MaterialTheme.typography.headlineMedium, fontWeight=FontWeight.Bold) }
        if(ui.plan.isEmpty()) item { EmptyStateView("No plan", "Generate your personal plan first.") } else items(ui.plan){ PlanDayCard(it) }
    }
}

@Composable
fun PlanDayCard(day: PersonalWorkoutDay) {
    GlassCard {
        Text(day.title, color=TextPrimary, fontWeight=FontWeight.Bold)
        Text("Week ${day.weekNumber} • ${day.focus} • ${day.intensity} • ${day.estimatedMinutes} min", color=TextSecondary)
        Text(day.targetMessage, color=TextSecondary)
        Spacer(Modifier.height(10.dp))
        day.exercises.forEach { e ->
            Text("${e.name}", color=TextPrimary, fontWeight=FontWeight.SemiBold)
            Text("${e.muscleGroup} • ${e.sets} sets × ${e.reps} • Rest ${e.restSeconds}s", color=TextSecondary)
            Text(e.notes, color=TextSecondary)
            Spacer(Modifier.height(6.dp))
        }
        Text("Nutrition: ${day.nutritionTip}", color=TextSecondary)
        Text("Safety: ${day.safetyNote}", color=TextSecondary)
    }
}
