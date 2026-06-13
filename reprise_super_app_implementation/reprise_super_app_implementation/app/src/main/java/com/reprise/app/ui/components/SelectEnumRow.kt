package com.reprise.app.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.selection.selectable
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.reprise.app.ui.theme.TextPrimary

@Composable
fun <T> SelectEnumRow(
    title: String,
    options: List<T>,
    selected: T,
    label: (T) -> String,
    onSelected: (T) -> Unit
) {
    Column {
        Text(title, color = TextPrimary, fontWeight = FontWeight.Bold)
        options.forEach { option ->
            Row(
                modifier = Modifier.fillMaxWidth().selectable(
                    selected = selected == option,
                    onClick = { onSelected(option) }
                ).padding(vertical = 3.dp)
            ) {
                RadioButton(selected = selected == option, onClick = { onSelected(option) })
                Text(label(option), color = TextPrimary, modifier = Modifier.padding(top = 12.dp))
            }
        }
    }
}
