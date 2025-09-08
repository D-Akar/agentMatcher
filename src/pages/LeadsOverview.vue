<script setup lang="ts">
import { computed } from 'vue'
import { leads } from '@/stores/leads'
import SimpleMap from '@/components/SimpleMap.vue'

// Filter leads that have coordinates
const leadsWithCoordinates = computed(() =>
    leads.filter(lead => lead.coordinates && lead.coordinates.length === 2)
)
</script>

<template>
    <div class="min-h-[100vh] flex-1 rounded-xl bg-muted/50 p-4">
        <div class="mb-6">
            <h1 class="text-xl font-semibold">Leads Overview</h1>
            <p class="text-sm text-muted-foreground">
                View all your leads on the map. {{ leadsWithCoordinates.length }} lead(s) with location data.
            </p>
        </div>

        <div class="bg-background rounded-lg border p-4">
            <SimpleMap />
        </div>

        <!-- Leads list for reference -->
        <div v-if="leads.length > 0" class="mt-6">
            <h2 class="text-lg font-semibold mb-4">All Leads</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div v-for="lead in leads" :key="lead.id" class="bg-background border rounded-lg p-4">
                    <h3 class="font-medium">{{ lead.name }}</h3>
                    <p class="text-sm text-muted-foreground mt-1">
                        Stage {{ lead.stage || 1 }}
                    </p>
                    <p v-if="lead.address" class="text-sm mt-2">
                        📍 {{ lead.address }}
                    </p>
                    <p v-else class="text-sm text-muted-foreground mt-2">
                        No address provided
                    </p>
                    <div v-if="lead.outreachMethod" class="mt-2">
                        <span
                            class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                            {{ lead.outreachMethod === 'email' ? '📧 Email Outreach' : '📞 Call Outreach' }}
                        </span>
                    </div>
                </div>
            </div>
        </div>

        <div v-else class="mt-6 text-center py-8">
            <p class="text-muted-foreground">No leads yet. Add some leads from the Prompting page to see them here.</p>
        </div>
    </div>
</template>
