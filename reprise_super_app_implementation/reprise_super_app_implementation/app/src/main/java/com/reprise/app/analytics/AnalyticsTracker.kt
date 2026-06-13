package com.reprise.app.analytics

import android.os.Bundle
import com.google.firebase.analytics.FirebaseAnalytics
import javax.inject.Inject

class AnalyticsTracker @Inject constructor(private val analytics: FirebaseAnalytics) {
    fun track(event: String, params: Map<String, String> = emptyMap()) {
        val b = Bundle(); params.forEach { (k,v) -> b.putString(k, v) }; analytics.logEvent(event, b)
    }
}
