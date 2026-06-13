package com.reprise.app.ui.screens.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import com.reprise.app.ui.components.NeonButton
import com.reprise.app.ui.theme.*
import com.reprise.app.viewmodel.AuthViewModel

@Composable
fun LoginScreen(viewModel: AuthViewModel, onRegister:()->Unit, onDashboard:()->Unit, onProfileSetup:()->Unit) {
    val state by viewModel.state.collectAsState(); val snack = remember{ SnackbarHostState() }
    LaunchedEffect(Unit){ viewModel.destination.collect{ if(it is com.reprise.app.viewmodel.AuthDestination.Dashboard) onDashboard() else onProfileSetup() } }
    LaunchedEffect(state.message){ state.message?.let{ snack.showSnackbar(it); viewModel.clearMessage() } }
    Scaffold(snackbarHost={SnackbarHost(snack)}, containerColor=AppBg){ pad ->
        Column(Modifier.fillMaxSize().padding(pad).background(AppBg).padding(24.dp), verticalArrangement=Arrangement.Center) {
            Text("RepRise", color=TextPrimary, style=MaterialTheme.typography.headlineLarge, fontWeight=FontWeight.ExtraBold)
            Text("Track. Lift. Progress. Repeat.", color=TextSecondary)
            Spacer(Modifier.height(28.dp))
            OutlinedTextField(state.email, viewModel::updateEmail, label={Text("Email")}, modifier=Modifier.fillMaxWidth())
            Spacer(Modifier.height(10.dp))
            OutlinedTextField(state.password, viewModel::updatePassword, label={Text("Password")}, visualTransformation=PasswordVisualTransformation(), modifier=Modifier.fillMaxWidth())
            Spacer(Modifier.height(18.dp))
            NeonButton(if(state.isLoading) "Please wait..." else "Login", enabled=!state.isLoading){ viewModel.login() }
            TextButton(onClick=viewModel::resetPassword){ Text("Forgot password?") }
            TextButton(onClick=onRegister){ Text("Create account") }
            TextButton(onClick=viewModel::guestLogin){ Text("Continue as guest") }
        }
    }
}
