package com.reprise.app.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.reprise.app.ui.theme.*

@Composable
fun GlassCard(modifier: Modifier = Modifier, content: @Composable ColumnScope.() -> Unit) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = CardBg),
        border = BorderStroke(1.dp, CardStroke),
        elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
    ) { Column(Modifier.fillMaxWidth().padding(18.dp), content = content) }
}

@Composable
fun NeonButton(text: String, modifier: Modifier = Modifier, enabled: Boolean = true, onClick: () -> Unit) {
    Box(
        modifier = modifier.fillMaxWidth().height(54.dp).background(
            Brush.horizontalGradient(listOf(AppNeon, AppCyan)), RoundedCornerShape(18.dp)
        ).clickable(enabled = enabled) { onClick() },
        contentAlignment = Alignment.Center
    ) { Text(text, color = TextPrimary, fontWeight = FontWeight.Bold) }
}

@Composable
fun EmptyStateView(title: String, message: String, modifier: Modifier = Modifier) {
    Column(modifier.fillMaxWidth().padding(28.dp), horizontalAlignment = Alignment.CenterHorizontally) {
        Text(title, color = TextPrimary, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(8.dp))
        Text(message, color = TextSecondary)
    }
}

@Composable
fun MetricCard(label: String, value: String, modifier: Modifier = Modifier) {
    GlassCard(modifier) { Text(label, color = TextSecondary); Spacer(Modifier.height(6.dp)); Text(value, color = TextPrimary, fontWeight = FontWeight.ExtraBold) }
}
