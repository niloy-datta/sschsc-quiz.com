package com.reprise.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.*
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.reprise.app.ui.theme.AppCyan
import com.reprise.app.ui.theme.AppNeon
import com.reprise.app.ui.theme.TextPrimary

@Composable
fun NeonButton(
    text: String,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    loading: Boolean = false,
    onClick: () -> Unit
) {
    Box(
        modifier = modifier
            .height(54.dp)
            .fillMaxWidth()
            .background(Brush.horizontalGradient(listOf(AppNeon, AppCyan)), RoundedCornerShape(18.dp))
            .clickable(enabled = enabled && !loading) { onClick() },
        contentAlignment = Alignment.Center
    ) {
        if (loading) CircularProgressIndicator() else Text(text, color = TextPrimary, fontWeight = FontWeight.Bold)
    }
}
