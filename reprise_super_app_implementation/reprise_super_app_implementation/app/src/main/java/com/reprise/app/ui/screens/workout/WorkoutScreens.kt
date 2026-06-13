package com.reprise.app.ui.screens.workout

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.reprise.app.ui.components.*
import com.reprise.app.ui.theme.*

@Composable fun StartWorkoutScreen(onBack:()->Unit){
    Column(Modifier.fillMaxSize().background(AppBg).padding(20.dp)){
        TextButton(onClick=onBack){Text("Back")}
        Text("Start Workout", color=TextPrimary, style=MaterialTheme.typography.headlineMedium, fontWeight=FontWeight.Bold)
        Spacer(Modifier.height(12.dp)); EmptyStateView("Workout logger module", "Merge your existing GymViewModel logger here. The production package includes Room workout entities/DAO/repository already.")
    }
}
@Composable fun HistoryScreen(onBack:()->Unit){ Column(Modifier.fillMaxSize().background(AppBg).padding(20.dp)){ TextButton(onClick=onBack){Text("Back")}; Text("Workout History", color=TextPrimary); EmptyStateView("History", "Connect existing workout history UI to WorkoutRepository.observeAllWorkouts().") } }
@Composable fun ProgressScreen(onBack:()->Unit){ Column(Modifier.fillMaxSize().background(AppBg).padding(20.dp)){ TextButton(onClick=onBack){Text("Back")}; Text("Progress Analytics", color=TextPrimary); EmptyStateView("Analytics", "Connect charts to Room workout, body weight, measurement and target progress data.") } }
