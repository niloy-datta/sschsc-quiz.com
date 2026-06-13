package com.reprise.app.ui.navigation

import androidx.compose.runtime.Composable
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.reprise.app.ui.screens.dashboard.DashboardScreen
import com.reprise.app.ui.screens.history.HistoryScreen
import com.reprise.app.ui.screens.plan.PersonalPlanScreen
import com.reprise.app.ui.screens.progress.ProgressScreen
import com.reprise.app.ui.screens.workout.StartWorkoutScreen
import com.reprise.app.ui.screens.workout.WorkoutDetailScreen
import com.reprise.app.viewmodel.GymViewModel
import com.reprise.app.viewmodel.PersonalPlanViewModel

@Composable
fun RepRiseNavGraph() {
    val navController = rememberNavController()
    val gymViewModel: GymViewModel = hiltViewModel()

    NavHost(navController = navController, startDestination = Routes.DASHBOARD) {
        composable(Routes.DASHBOARD) {
            DashboardScreen(
                viewModel = gymViewModel,
                onStartWorkout = { navController.navigate(Routes.START_WORKOUT) },
                onHistory = { navController.navigate(Routes.HISTORY) },
                onProgress = { navController.navigate(Routes.PROGRESS) },
                onPersonalPlan = { navController.navigate(Routes.PERSONAL_PLAN) }
            )
        }

        composable(Routes.PERSONAL_PLAN) {
            val personalPlanViewModel: PersonalPlanViewModel = hiltViewModel()
            PersonalPlanScreen(
                viewModel = personalPlanViewModel,
                onBack = { navController.popBackStack() }
            )
        }

        composable(Routes.START_WORKOUT) {
            StartWorkoutScreen(viewModel = gymViewModel, onBack = { navController.popBackStack() })
        }

        composable(Routes.HISTORY) {
            HistoryScreen(
                viewModel = gymViewModel,
                onOpenWorkout = { id -> navController.navigate(Routes.workoutDetail(id)) }
            )
        }

        composable(Routes.PROGRESS) {
            ProgressScreen(viewModel = gymViewModel)
        }

        composable(
            route = Routes.WORKOUT_DETAIL,
            arguments = listOf(navArgument("workoutId") { type = NavType.LongType })
        ) { backStackEntry ->
            val workoutId = backStackEntry.arguments?.getLong("workoutId") ?: return@composable
            WorkoutDetailScreen(
                workoutId = workoutId,
                viewModel = gymViewModel,
                onBack = { navController.popBackStack() }
            )
        }
    }
}
