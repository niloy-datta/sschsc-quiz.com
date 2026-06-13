package com.reprise.app.ui.screens.workout

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
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.material3.Card
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.reprise.app.ui.components.NeonButton
import com.reprise.app.ui.theme.AppBg
import com.reprise.app.viewmodel.DraftSet
import com.reprise.app.viewmodel.GymViewModel

@Composable
fun StartWorkoutScreen(viewModel: GymViewModel, onBack: () -> Unit) {
    val title by viewModel.workoutTitle.collectAsState()
    val sets by viewModel.draftSets.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(Unit) { viewModel.message.collect { snackbarHostState.showSnackbar(it) } }

    Scaffold(snackbarHost = { SnackbarHost(snackbarHostState) }, containerColor = AppBg) { padding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding).background(AppBg).padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            item {
                Text("Start Workout")
                Spacer(modifier = Modifier.height(12.dp))
                OutlinedTextField(
                    value = title,
                    onValueChange = viewModel::updateWorkoutTitle,
                    label = { Text("Workout title") },
                    modifier = Modifier.fillMaxWidth()
                )
            }

            itemsIndexed(sets) { index, item ->
                SetInputCard(
                    set = item,
                    onChange = { viewModel.updateSet(index, it) },
                    onRemove = { viewModel.removeSet(index) }
                )
            }

            item {
                NeonButton("Add Set", onClick = { viewModel.addEmptySet() })
                Spacer(modifier = Modifier.height(12.dp))
                NeonButton("Save Workout", onClick = { viewModel.saveWorkout() })
                Spacer(modifier = Modifier.height(12.dp))
                TextButton(onClick = onBack) { Text("Cancel") }
            }
        }
    }
}

@Composable
fun SetInputCard(set: DraftSet, onChange: (DraftSet) -> Unit, onRemove: () -> Unit) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text("Set ${set.setNumber}")
            OutlinedTextField(
                value = set.exerciseName,
                onValueChange = { onChange(set.copy(exerciseName = it)) },
                label = { Text("Exercise name") },
                modifier = Modifier.fillMaxWidth()
            )
            OutlinedTextField(
                value = set.muscleGroup,
                onValueChange = { onChange(set.copy(muscleGroup = it)) },
                label = { Text("Muscle group") },
                modifier = Modifier.fillMaxWidth()
            )
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedTextField(
                    value = set.reps,
                    onValueChange = { onChange(set.copy(reps = it.filter { c -> c.isDigit() })) },
                    label = { Text("Reps") },
                    modifier = Modifier.weight(1f)
                )
                OutlinedTextField(
                    value = set.weight,
                    onValueChange = { onChange(set.copy(weight = it)) },
                    label = { Text("Weight") },
                    modifier = Modifier.weight(1f)
                )
            }
            TextButton(onClick = onRemove) { Text("Remove") }
        }
    }
}
