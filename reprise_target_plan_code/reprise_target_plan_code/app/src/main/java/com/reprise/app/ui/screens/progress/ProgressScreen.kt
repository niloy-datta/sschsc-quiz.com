package com.reprise.app.ui.screens.progress

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.reprise.app.ui.components.EmptyStateView
import com.reprise.app.ui.components.GlassCard
import com.reprise.app.ui.theme.AppBg
import com.reprise.app.ui.theme.TextPrimary
import com.reprise.app.ui.theme.TextSecondary
import com.reprise.app.viewmodel.GymViewModel
import com.reprise.app.viewmodel.WorkoutUiState

@Composable
fun ProgressScreen(viewModel: GymViewModel) {
    val state by viewModel.workoutsUiState.collectAsState()

    Column(modifier = Modifier.fillMaxSize().background(AppBg).padding(20.dp)) {
        Text("Progress", color = TextPrimary, style = MaterialTheme.typography.headlineMedium)
        Spacer(modifier = Modifier.height(16.dp))
        when (val ui = state) {
            WorkoutUiState.Loading -> Text("Loading progress...", color = TextSecondary)
            is WorkoutUiState.Error -> EmptyStateView("Progress unavailable", ui.message)
            is WorkoutUiState.Success -> {
                if (ui.workouts.isEmpty()) {
                    EmptyStateView("No progress data yet", "Complete a workout to see your progress.")
                } else {
                    val totalWorkouts = ui.workouts.size
                    val totalSets = ui.workouts.sumOf { it.sets.size }
                    val totalVolume = ui.workouts.sumOf { w -> w.sets.sumOf { it.weight * it.reps } }
                    GlassCard { Text("Total Workouts", color = TextSecondary); Text(totalWorkouts.toString(), color = TextPrimary, fontWeight = FontWeight.Bold) }
                    Spacer(modifier = Modifier.height(12.dp))
                    GlassCard { Text("Total Sets", color = TextSecondary); Text(totalSets.toString(), color = TextPrimary, fontWeight = FontWeight.Bold) }
                    Spacer(modifier = Modifier.height(12.dp))
                    GlassCard { Text("Total Volume", color = TextSecondary); Text("${totalVolume.toInt()} kg", color = TextPrimary, fontWeight = FontWeight.Bold) }
                }
            }
        }
    }
}
