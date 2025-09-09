<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { leads } from '@/stores/leads'
import SimpleMap from '@/components/SimpleMap.vue'

const router = useRouter()

// Filter leads that have coordinates
const leadsWithCoordinates = computed(() =>
    leads.filter(lead => lead.coordinates && lead.coordinates.length === 2)
)

// Navigate to lead detail page
function navigateToLead(leadSlug: string) {
    router.push(`/leads/${leadSlug}`)
}
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
                <div v-for="lead in leads" :key="lead.id"
                    class="bg-background border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/50 hover:scale-[1.02]"
                    @click="navigateToLead(lead.slug)">
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
                    <div class="mt-2">
                        <!-- Status marker based on stage -->
                        <div>
                            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs" :class="(lead.stage || 1) === 1
                                ? 'bg-yellow-100 text-yellow-800'
                                : (lead.stage || 1) === 2
                                    ? 'bg-primary/10 text-primary'
                                    : 'bg-blue-100 text-blue-800'
                                ">
                                {{ (lead.stage || 1) === 1
                                    ? '📋 To Review'
                                    : (lead.stage || 1) === 2
                                        ? (lead.outreachMethod === 'email' ? '📧 Email Outreach' : '📞 Call Outreach')
                                        : '⚙️ Processing'
                                }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div v-else class="mt-6 text-center py-8">
            <p class="text-muted-foreground">No leads yet. Add some leads from the Prompting page to see them here.</p>
        </div>
    </div>
</template>
