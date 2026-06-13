package com.reprise.app.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.reprise.app.auth.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class AuthFormState(
    val email: String = "",
    val password: String = "",
    val confirmPassword: String = "",
    val isLoading: Boolean = false,
    val message: String? = null
)

sealed class AuthDestination { object Dashboard: AuthDestination(); object ProfileSetup: AuthDestination() }

@HiltViewModel
class AuthViewModel @Inject constructor(private val authRepository: AuthRepository) : ViewModel() {
    private val _state = MutableStateFlow(AuthFormState())
    val state: StateFlow<AuthFormState> = _state.asStateFlow()
    private val _destination = MutableSharedFlow<AuthDestination>()
    val destination: SharedFlow<AuthDestination> = _destination.asSharedFlow()

    fun updateEmail(v: String){ _state.value = _state.value.copy(email = v.trim()) }
    fun updatePassword(v: String){ _state.value = _state.value.copy(password = v) }
    fun updateConfirmPassword(v: String){ _state.value = _state.value.copy(confirmPassword = v) }

    fun login() = viewModelScope.launch {
        val s = _state.value
        if (s.email.isBlank() || s.password.isBlank()) return@launch show("Email and password required.")
        loading(true)
        authRepository.login(s.email, s.password).onSuccess { _destination.emit(AuthDestination.Dashboard) }.onFailure { show(it.message ?: "Login failed.") }
        loading(false)
    }
    fun register() = viewModelScope.launch {
        val s = _state.value
        if (s.email.isBlank() || s.password.isBlank()) return@launch show("Email and password required.")
        if (s.password.length < 6) return@launch show("Password must be at least 6 characters.")
        if (s.password != s.confirmPassword) return@launch show("Passwords do not match.")
        loading(true)
        authRepository.register(s.email, s.password).onSuccess { _destination.emit(AuthDestination.ProfileSetup) }.onFailure { show(it.message ?: "Registration failed.") }
        loading(false)
    }
    fun resetPassword() = viewModelScope.launch {
        val email = _state.value.email
        if (email.isBlank()) return@launch show("Enter your email first.")
        authRepository.resetPassword(email).onSuccess { show("Password reset email sent.") }.onFailure { show(it.message ?: "Failed to send reset email.") }
    }
    fun guestLogin() = viewModelScope.launch {
        loading(true); authRepository.loginAnonymously().onSuccess { _destination.emit(AuthDestination.ProfileSetup) }.onFailure { show(it.message ?: "Guest login failed.") }; loading(false)
    }
    fun clearMessage(){ _state.value = _state.value.copy(message = null) }
    private fun loading(v:Boolean){ _state.value = _state.value.copy(isLoading = v) }
    private fun show(m:String){ _state.value = _state.value.copy(message = m, isLoading = false) }
}
