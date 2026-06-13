package com.reprise.app.ui.screens.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.reprise.app.ui.components.NeonButton
import com.reprise.app.ui.theme.AppBg
import com.reprise.app.ui.theme.TextPrimary
import com.reprise.app.viewmodel.AuthViewModel

@Composable
fun ForgotPasswordScreen(viewModel: AuthViewModel, onBack: () -> Unit) {
    val state by viewModel.state.collectAsState()
    val snack = remember { SnackbarHostState() }

    LaunchedEffect(state.message) {
        state.message?.let { snack.showSnackbar(it); viewModel.clearMessage() }
    }

    Scaffold(snackbarHost = { SnackbarHost(snack) }, containerColor = AppBg) { padding ->
        Column(Modifier.fillMaxSize().padding(padding).background(AppBg).padding(22.dp), verticalArrangement = Arrangement.Center) {
            Text("Reset Password", color = TextPrimary, style = MaterialTheme.typography.headlineMedium)
            Spacer(Modifier.height(20.dp))
            OutlinedTextField(state.email, viewModel::updateEmail, label = { Text("Email") }, modifier = Modifier.fillMaxWidth())
            Spacer(Modifier.height(18.dp))
            NeonButton("Send Reset Email", onClick = viewModel::resetPassword)
            TextButton(onClick = onBack) { Text("Back") }
        }
    }
}
