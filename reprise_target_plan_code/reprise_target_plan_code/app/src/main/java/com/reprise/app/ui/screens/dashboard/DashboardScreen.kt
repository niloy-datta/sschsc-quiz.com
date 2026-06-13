package com.reprise.app.ui.screens.dashboard

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.reprise.app.ui.components.GlassCard
import com.reprise.app.ui.components.NeonButton
import com.reprise.app.ui.theme.AppBg
import com.reprise.app.ui.theme.TextPrimary
import com.reprise.app.ui.theme.TextSecondary
import com.reprise.app.viewmodel.GymViewModel

@Composable
fun DashboardScreen(
    viewModel: GymViewModel,
    onStartWorkout: () -> Unit,
    onHistory: () -> Unit,
    onProgress: () -> Unit,
    onPersonalPlan: () -> Unit
) {
    val stats by viewModel.dashboardStats.collectAsState()

    Column(
        modifier = Modifier.fillMaxSize().background(AppBg).padding(20.dp)
    ) {
        Text("RepRise", color = TextPrimary, fontWeight = FontWeight.ExtraBold)
        Text("Track. Lift. Progress. Repeat.", color = TextSecondary)
        Spacer(modifier = Modifier.height(20.dp))

        GlassCard {
            Text("This Week", color = TextSecondary)
            Text("${stats.workoutCountThisWeek} Workouts", color = TextPrimary, fontWeight = FontWeight.Bold)
            Text("Volume: ${stats.totalVolumeThisWeek.toInt()} kg", color = TextSecondary)
        }

        Spacer(modifier = Modifier.height(14.dp))
        NeonButton("My Target-Based 30-Day Plan", onClick = onPersonalPlan)
        Spacer(modifier = Modifier.height(12.dp))
        NeonButton("Quick Start Workout", onClick = onStartWorkout)
        Spacer(modifier = Modifier.height(12.dp))
        NeonButton("View History", onClick = onHistory)
        Spacer(modifier = Modifier.height(12.dp))
        NeonButton("View Progress", onClick = onProgress)
    }
}
