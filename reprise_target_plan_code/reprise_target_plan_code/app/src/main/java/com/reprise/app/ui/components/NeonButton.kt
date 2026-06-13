package com.reprise.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
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
    onClick: () -> Unit
) {
    Box(
        modifier = modifier
            .height(54.dp)
            .fillMaxWidth()
            .background(
                brush = Brush.horizontalGradient(listOf(AppNeon, AppCyan)),
                shape = RoundedCornerShape(18.dp)
            )
            .clickable(enabled = enabled) { onClick() },
        contentAlignment = Alignment.Center
    ) {
        Text(text = text, color = TextPrimary, fontWeight = FontWeight.Bold)
    }
}
