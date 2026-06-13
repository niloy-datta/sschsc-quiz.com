package com.reprise.app.subscription

enum class PlanTier { FREE, PREMIUM }

data class SubscriptionState(val tier: PlanTier = PlanTier.FREE, val isActive: Boolean = false)
