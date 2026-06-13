package com.reprise.app.ui.navigation

import androidx.compose.runtime.Composable
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.compose.*
import com.reprise.app.auth.AuthRepository
import com.reprise.app.ui.screens.auth.*
import com.reprise.app.ui.screens.dashboard.DashboardScreen
import com.reprise.app.ui.screens.onboarding.ProfileSetupScreen
import com.reprise.app.ui.screens.plan.*
import com.reprise.app.ui.screens.workout.*
import com.reprise.app.viewmodel.*

@Composable
fun RepRiseNavGraph() {
    val nav = rememberNavController()
    val authViewModel: AuthViewModel = hiltViewModel()
    val planViewModel: PersonalPlanViewModel = hiltViewModel()
    NavHost(navController = nav, startDestination = Routes.LOGIN) {
        composable(Routes.LOGIN){ LoginScreen(authViewModel, onRegister={nav.navigate(Routes.REGISTER)}, onDashboard={nav.navigate(Routes.DASHBOARD){popUpTo(Routes.LOGIN){inclusive=true}}}, onProfileSetup={nav.navigate(Routes.PROFILE_SETUP)}) }
        composable(Routes.REGISTER){ RegisterScreen(authViewModel, onLogin={nav.popBackStack()}, onProfileSetup={nav.navigate(Routes.PROFILE_SETUP){popUpTo(Routes.LOGIN){inclusive=true}}}) }
        composable(Routes.PROFILE_SETUP){ ProfileSetupScreen(planViewModel, onDone={nav.navigate(Routes.DASHBOARD){popUpTo(Routes.LOGIN){inclusive=true}}}) }
        composable(Routes.DASHBOARD){ DashboardScreen(hiltViewModel(), onTodayPlan={nav.navigate(Routes.TODAY_PLAN)}, onFullPlan={nav.navigate(Routes.FULL_PLAN)}, onStartWorkout={nav.navigate(Routes.START_WORKOUT)}, onHistory={nav.navigate(Routes.HISTORY)}, onProgress={nav.navigate(Routes.PROGRESS)}, onProfile={nav.navigate(Routes.PROFILE_SETUP)}, onLogin={nav.navigate(Routes.LOGIN){popUpTo(Routes.DASHBOARD){inclusive=true}}}) }
        composable(Routes.TODAY_PLAN){ TodayPlanScreen(planViewModel){nav.popBackStack()} }
        composable(Routes.FULL_PLAN){ FullPlanScreen(planViewModel){nav.popBackStack()} }
        composable(Routes.START_WORKOUT){ StartWorkoutScreen{nav.popBackStack()} }
        composable(Routes.HISTORY){ HistoryScreen{nav.popBackStack()} }
        composable(Routes.PROGRESS){ ProgressScreen{nav.popBackStack()} }
    }
}
