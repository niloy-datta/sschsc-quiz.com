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
import com.reprise.app.viewmodel.AuthDestination
import com.reprise.app.viewmodel.AuthViewModel

@Composable
fun RegisterScreen(viewModel: AuthViewModel, onLogin:()->Unit, onProfileSetup:()->Unit) {
    val state by viewModel.state.collectAsState(); val snack= remember{SnackbarHostState()}
    LaunchedEffect(Unit){ viewModel.destination.collect{ if(it is AuthDestination.ProfileSetup) onProfileSetup() } }
    LaunchedEffect(state.message){ state.message?.let{ snack.showSnackbar(it); viewModel.clearMessage() } }
    Scaffold(snackbarHost={SnackbarHost(snack)}, containerColor=AppBg){ pad ->
        Column(Modifier.fillMaxSize().padding(pad).background(AppBg).padding(24.dp), verticalArrangement=Arrangement.Center) {
            Text("Create RepRise Account", color=TextPrimary, style=MaterialTheme.typography.headlineMedium, fontWeight=FontWeight.Bold)
            Spacer(Modifier.height(20.dp))
            OutlinedTextField(state.email, viewModel::updateEmail, label={Text("Email")}, modifier=Modifier.fillMaxWidth())
            OutlinedTextField(state.password, viewModel::updatePassword, label={Text("Password")}, visualTransformation=PasswordVisualTransformation(), modifier=Modifier.fillMaxWidth())
            OutlinedTextField(state.confirmPassword, viewModel::updateConfirmPassword, label={Text("Confirm password")}, visualTransformation=PasswordVisualTransformation(), modifier=Modifier.fillMaxWidth())
            Spacer(Modifier.height(18.dp))
            NeonButton(if(state.isLoading) "Creating..." else "Register", enabled=!state.isLoading){ viewModel.register() }
            TextButton(onClick=onLogin){ Text("Already have account? Login") }
        }
    }
}
