package com.reprise.app.ui.screens.workout

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.reprise.app.ui.components.GlassCard
import com.reprise.app.ui.theme.AppBg
import com.reprise.app.ui.theme.TextPrimary
import com.reprise.app.ui.theme.TextSecondary
import com.reprise.app.viewmodel.GymViewModel
import com.reprise.app.viewmodel.WorkoutUiState

@Composable
fun WorkoutDetailScreen(workoutId: Long, viewModel: GymViewModel, onBack: () -> Unit) {
    val state by viewModel.workoutsUiState.collectAsState()
    val workout = (state as? WorkoutUiState.Success)?.workouts?.firstOrNull { it.workout.id == workoutId }

    Column(modifier = Modifier.fillMaxSize().background(AppBg).padding(20.dp)) {
        TextButton(onClick = onBack) { Text("Back") }
        if (workout == null) {
            Text("Workout not found", color = TextPrimary)
            return@Column
        }
        Text(workout.workout.title, color = TextPrimary, style = MaterialTheme.typography.headlineMedium)
        Spacer(modifier = Modifier.height(16.dp))
        LazyColumn {
            items(workout.sets) { set ->
                GlassCard {
                    Text(set.exerciseName, color = TextPrimary, fontWeight = FontWeight.Bold)
                    Text("${set.muscleGroup} • Set ${set.setNumber}", color = TextSecondary)
                    Text("${set.reps} reps × ${set.weight} kg", color = TextSecondary)
                }
                Spacer(modifier = Modifier.height(10.dp))
            }
            item {
                Button(
                    onClick = { viewModel.deleteWorkout(workoutId); onBack() },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
                ) { Text("Delete Workout") }
            }
        }
    }
}
