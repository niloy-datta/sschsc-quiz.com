package com.reprise.app.ui.screens.dashboard

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.reprise.app.ui.components.*
import com.reprise.app.ui.theme.*
import com.reprise.app.viewmodel.DashboardViewModel

@Composable
fun DashboardScreen(viewModel: DashboardViewModel, onTodayPlan:()->Unit, onFullPlan:()->Unit, onStartWorkout:()->Unit, onHistory:()->Unit, onProgress:()->Unit, onProfile:()->Unit, onLogin:()->Unit) {
    val s by viewModel.state.collectAsState()
    Column(Modifier.fillMaxSize().background(AppBg).padding(20.dp)) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement=Arrangement.SpaceBetween) {
            Column { Text("RepRise", color=TextPrimary, style=MaterialTheme.typography.headlineLarge, fontWeight=FontWeight.ExtraBold); Text("Premium fitness operating system", color=TextSecondary) }
            TextButton(onClick={ viewModel.logout(); onLogin() }){ Text("Logout") }
        }
        Spacer(Modifier.height(18.dp))
        if(s.todayPlan != null) GlassCard { Text("Today’s Plan", color=TextSecondary); Text(s.todayPlan!!.title, color=TextPrimary, fontWeight=FontWeight.Bold); Text(s.todayPlan!!.targetMessage, color=TextSecondary); Text("${s.todayPlan!!.intensity} • ${s.todayPlan!!.estimatedMinutes} min", color=TextSecondary) }
        else EmptyStateView("No plan yet", "Create your target-based 30-day plan.")
        Spacer(Modifier.height(14.dp))
        Row(Modifier.fillMaxWidth(), horizontalArrangement=Arrangement.spacedBy(12.dp)) { MetricCard("Weekly workouts", s.weeklyWorkoutCount.toString(), Modifier.weight(1f)); MetricCard("Weekly volume", s.weeklyVolume.toInt().toString(), Modifier.weight(1f)) }
        Spacer(Modifier.height(16.dp))
        NeonButton("Start Today’s Plan", onClick=onTodayPlan)
        Spacer(Modifier.height(10.dp)); NeonButton("View Full 30-Day Plan", onClick=onFullPlan)
        Spacer(Modifier.height(10.dp)); NeonButton("Quick Log Workout", onClick=onStartWorkout)
        Spacer(Modifier.height(10.dp)); NeonButton("History", onClick=onHistory)
        Spacer(Modifier.height(10.dp)); NeonButton("Progress", onClick=onProgress)
        Spacer(Modifier.height(10.dp)); NeonButton("Update Profile & Target", onClick=onProfile)
    }
}
