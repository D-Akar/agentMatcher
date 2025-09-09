<script setup lang="ts">
import { computed, ref, watchEffect, watch } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { leads, removeLead } from '@/stores/leads'
import { Button } from '@/components/ui/button'
import {
    Stepper,
    StepperDescription,
    StepperIndicator,
    StepperItem,
    StepperSeparator,
    StepperTitle,
    StepperTrigger,
} from '@/components/ui/stepper'
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { updateLead } from '@/stores/leads'

const route = useRoute()
const router = useRouter()
const slug = computed(() => String(route.params.slug || ''))
const lead = computed(() => leads.find(l => l.slug === slug.value))

const steps = [
    { id: 1, title: 'Discovery', description: 'Initial research and fit.' },
    { id: 2, title: 'Outreach', description: 'Contacted via email/call.' },
    { id: 3, title: 'Qualification', description: 'Assessed interest and needs.' },
    { id: 4, title: 'Proposal', description: 'Shared proposal and pricing.' },
    { id: 5, title: 'Closed', description: 'Won or lost outcome.' },
]

const maxStage = computed(() => {
    if (!lead.value) return 1
    const base = lead.value.stage ?? 1
    const outreachStage = lead.value.outreachMethod ? 2 : 1
    return Math.max(base, outreachStage)
})

const currentStep = ref(1)
const notes = ref('')
const userSelectedStep = ref(false)

watchEffect(() => {
    // Only auto-set to highest stage if user hasn't manually selected a step
    if (!userSelectedStep.value) {
        currentStep.value = maxStage.value
    }
    // Load notes when lead changes
    if (lead.value) {
        notes.value = lead.value.notes || ''
    }
})

// Reset user selection and force stepper reload when navigating to a different lead
watch(slug, (newSlug, oldSlug) => {
    if (newSlug !== oldSlug) {
        userSelectedStep.value = false
        // Force immediate update to the new lead's highest stage
        currentStep.value = maxStage.value
    }
})

// Also watch the lead object directly to ensure proper reset
watch(lead, (newLead, oldLead) => {
    if (newLead && newLead.id !== oldLead?.id) {
        userSelectedStep.value = false
        // Force immediate update to the new lead's highest stage
        currentStep.value = maxStage.value
    }
})

function goToStep(step: number) {
    currentStep.value = step
    userSelectedStep.value = true
}

function onRemoveLead() {
    removeLead(slug.value)
    router.push('/prompting')
}

function saveNotes() {
    if (lead.value) {
        updateLead(lead.value.id, { notes: notes.value })
    }
}

function startEmailOutreach() {
    if (lead.value) {
        updateLead(lead.value.id, { stage: 2, outreachMethod: 'email' })
        currentStep.value = 2
    }
}

function startCallOutreach() {
    if (lead.value) {
        updateLead(lead.value.id, { stage: 2, outreachMethod: 'call' })
        currentStep.value = 2
    }
}
</script>

<template>
    <div class="min-h-[100vh] flex-1 rounded-xl bg-muted/50 p-4">
        <div class="flex items-center justify-between mb-4">
            <h1 class="text-xl font-semibold">Lead: {{ lead?.name || slug }}</h1>
            <div class="flex items-center gap-2">
                <RouterLink to="/prompting">
                    <Button variant="outline" size="sm">Continue Search</Button>
                </RouterLink>
                <Button variant="destructive" size="sm" @click="onRemoveLead">Remove Lead</Button>
            </div>
        </div>

        <div class="mb-6">
            <Stepper v-model:value="currentStep" :defaultValue="maxStage">
                <StepperItem v-for="s in steps" :key="s.id" :step="s.id">
                    <StepperTrigger @click="goToStep(s.id)">
                        <StepperIndicator class="border">{{ s.id }}</StepperIndicator>
                        <StepperTitle>{{ s.title }}</StepperTitle>
                        <StepperDescription>{{ s.description }}</StepperDescription>
                    </StepperTrigger>
                    <StepperSeparator v-if="s.id !== steps[steps.length - 1].id" class="w-full h-px border" />
                </StepperItem>
            </Stepper>
        </div>

        <div v-if="lead" class="space-y-4">
            <div class="rounded-md border bg-background p-4">
                <h2 class="text-sm font-medium mb-2">Stage Details</h2>
                <p class="text-sm text-muted-foreground">
                    {{steps.find(s => s.id === currentStep)?.description}} — Placeholder content for {{ lead.name }}
                    at this
                    stage.
                </p>
                <!-- Discovery -->
                <div v-if="currentStep === 1" class="mt-3 rounded-md bg-muted p-3 text-sm space-y-3">
                    <div class="font-medium mb-2">Lead Information</div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div class="space-y-2">
                            <div><span class="font-medium">ID:</span> {{ lead.id }}</div>
                            <div><span class="font-medium">Name:</span> {{ lead.name }}</div>
                            <div><span class="font-medium">Website: </span>
                                <a :href="lead.website || lead.url" target="_blank"
                                    class="text-blue-600 hover:underline">
                                    {{ lead.website || lead.url }}
                                </a>
                            </div>
                            <div v-if="lead.address"><span class="font-medium">Address:</span> {{ lead.address }}</div>
                        </div>

                        <div class="space-y-2">
                            <div v-if="lead.phone_number"><span class="font-medium">Phone:</span> {{ lead.phone_number
                            }}</div>
                            <div v-if="lead.email"><span class="font-medium">Email:</span> {{ lead.email }}</div>
                            <div v-if="lead.review_rate"><span class="font-medium">Rating:</span> {{ lead.review_rate }}
                                ⭐</div>
                            <div v-if="lead.number_of_reviews"><span class="font-medium">Reviews:</span> {{
                                lead.number_of_reviews }}</div>
                        </div>
                    </div>

                    <div v-if="lead.description" class="mt-3">
                        <div class="font-medium mb-1">Description</div>
                        <div class="text-muted-foreground">{{ lead.description }}</div>
                    </div>

                    <div v-if="lead.coordinates" class="mt-3">
                        <div class="font-medium mb-1">Location</div>
                        <div class="text-muted-foreground">
                            Coordinates: {{ lead.coordinates[0] }}, {{ lead.coordinates[1] }}
                        </div>
                    </div>

                    <div class="mt-4 pt-3 border-t">
                        <div class="font-medium mb-2">Next Steps</div>
                        <div v-if="lead.stage == 1" class="flex space-x-2">
                            <Button variant="outline" class="px-4" @click="startEmailOutreach">
                                📧 Email Outreach
                            </Button>
                            <Button variant="outline" class="px-4" @click="startCallOutreach">
                                📞 Phone Call
                            </Button>
                        </div>
                        <div v-else class="text-muted-foreground">
                            Lead is already in {{steps.find(s => s.id === lead.stage)?.title}} stage
                        </div>
                    </div>
                </div>
                <!-- Outreach -->
                <div v-if="currentStep === 2" class="mt-3 space-y-3 text-sm">
                    <div class="rounded-md bg-muted p-3">
                        <div class="font-medium mb-1">Outreach method</div>
                        <div>{{ lead.outreachMethod || 'N/A' }}</div>
                    </div>

                    <!-- Email Tabs -->
                    <div v-if="lead.outreachMethod === 'email'">
                        <Tabs default-value="transcript" class="w-full">
                            <TabsList class="grid w-full grid-cols-2">
                                <TabsTrigger value="transcript">Email Transcript</TabsTrigger>
                                <TabsTrigger value="summary">Email Summary</TabsTrigger>
                            </TabsList>
                            <TabsContent value="transcript" class="mt-3">
                                <div class="rounded-md bg-muted p-3">
                                    <div class="font-medium mb-2">Email Transcript</div>
                                    <pre class="whitespace-pre-wrap text-sm">
                                        {{ lead.emailTranscript || 'No email transcript available yet.' }}</pre>
                                </div>
                            </TabsContent>
                            <TabsContent value="summary" class="mt-3">
                                <div class="rounded-md bg-muted p-3">
                                    <div class="font-medium mb-2">Email Summary</div>
                                    <div class="text-sm text-muted-foreground">
                                        Email summary will be generated after the email is sent and response is
                                        received.
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>

                    <!-- Call Tabs -->
                    <div v-if="lead.outreachMethod === 'call'">
                        <Tabs default-value="transcript" class="w-full">
                            <TabsList class="grid w-full grid-cols-2">
                                <TabsTrigger value="transcript">Call Transcript</TabsTrigger>
                                <TabsTrigger value="summary">Call Summary</TabsTrigger>
                            </TabsList>
                            <TabsContent value="transcript" class="mt-3">
                                <div class="rounded-md bg-muted p-3">
                                    <div class="font-medium mb-2">Call Transcript</div>
                                    <pre class="whitespace-pre-wrap text-sm">
                                        {{ lead.callTranscript || 'No call transcript available yet.' }}</pre>
                                </div>
                            </TabsContent>
                            <TabsContent value="summary" class="mt-3">
                                <div class="rounded-md bg-muted p-3">
                                    <div class="font-medium mb-2">Call Summary</div>
                                    <div class="text-sm text-muted-foreground">
                                        Call summary will be generated after the call is completed.
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
                <!-- Qualification -->
                <div v-if="currentStep === 3" class="mt-3 rounded-md bg-muted p-3 text-sm">
                    <div class="font-medium mb-1">Qualification notes</div>
                    <div>N/A</div>
                </div>
                <!-- Proposal -->
                <div v-if="currentStep === 4" class="mt-3 rounded-md bg-muted p-3 text-sm">
                    <div class="font-medium mb-1">Proposal details</div>
                    <div>N/A</div>
                </div>
                <!-- Closed -->
                <div v-if="currentStep === 5" class="mt-3 rounded-md bg-muted p-3 text-sm">
                    <div class="font-medium mb-1">Outcome</div>
                    <div>N/A</div>
                </div>
            </div>

            <!-- Notes Section -->
            <div class="mt-6 space-y-3">
                <div class="text-sm font-medium">Notes</div>
                <div class="space-y-2">
                    <Textarea v-model="notes" placeholder="Add your notes about this lead here..." rows="4" />
                    <Button @click="saveNotes" size="sm">
                        Save Notes
                    </Button>
                </div>
            </div>
        </div>
        <div v-else class="text-sm text-muted-foreground">Lead not found.</div>
    </div>
</template>
