package com.reprise.app.ui.screens.history

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.reprise.app.data.local.entity.WorkoutWithSets
import com.reprise.app.ui.components.EmptyStateView
import com.reprise.app.ui.components.GlassCard
import com.reprise.app.ui.theme.AppBg
import com.reprise.app.ui.theme.TextPrimary
import com.reprise.app.ui.theme.TextSecondary
import com.reprise.app.viewmodel.GymViewModel
import com.reprise.app.viewmodel.WorkoutUiState
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun HistoryScreen(viewModel: GymViewModel, onOpenWorkout: (Long) -> Unit) {
    val state by viewModel.workoutsUiState.collectAsState()
    val query by viewModel.searchQuery.collectAsState()

    Column(modifier = Modifier.fillMaxSize().background(AppBg).padding(20.dp)) {
        Text("Workout History", color = TextPrimary, style = MaterialTheme.typography.headlineMedium)
        Spacer(modifier = Modifier.height(12.dp))
        OutlinedTextField(
            value = query,
            onValueChange = viewModel::updateSearch,
            label = { Text("Search workout or exercise") },
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(modifier = Modifier.height(16.dp))

        when (val ui = state) {
            WorkoutUiState.Loading -> CircularProgressIndicator()
            is WorkoutUiState.Error -> EmptyStateView("Something went wrong", ui.message)
            is WorkoutUiState.Success -> {
                if (ui.workouts.isEmpty()) {
                    EmptyStateView("No workouts found", "Start your first workout to see history.")
                } else {
                    LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        items(ui.workouts) { workout ->
                            WorkoutHistoryCard(workout, onClick = { onOpenWorkout(workout.workout.id) })
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun WorkoutHistoryCard(item: WorkoutWithSets, onClick: () -> Unit) {
    val totalVolume = item.sets.sumOf { it.weight * it.reps }
    val totalSets = item.sets.size
    val exerciseCount = item.sets.map { it.exerciseName }.distinct().size

    GlassCard {
        Text(item.workout.title, color = TextPrimary, fontWeight = FontWeight.Bold)
        Text(formatDate(item.workout.date), color = TextSecondary)
        Spacer(modifier = Modifier.height(8.dp))
        Text("$exerciseCount exercises • $totalSets sets • ${totalVolume.toInt()} kg volume", color = TextSecondary)
        Text(if (item.workout.isSynced) "Synced" else "Offline saved", color = TextSecondary)
        TextButton(onClick = onClick) { Text("Open") }
    }
}

private fun formatDate(time: Long): String = SimpleDateFormat("dd MMM yyyy", Locale.getDefault()).format(Date(time))
