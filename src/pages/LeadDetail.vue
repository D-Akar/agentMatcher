<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
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
    const base = lead.value?.stage ?? 1
    const outreachStage = lead.value?.outreachMethod ? 2 : 1
    return Math.max(base, outreachStage)
})

const currentStep = ref(1)

watchEffect(() => {
    currentStep.value = maxStage.value
})

function goToStep(step: number) {
    currentStep.value = step
}

function onRemoveLead() {
    removeLead(slug.value)
    router.push('/prompting')
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
                        <StepperIndicator>{{ s.id }}</StepperIndicator>
                        <StepperTitle>{{ s.title }}</StepperTitle>
                        <StepperDescription>{{ s.description }}</StepperDescription>
                    </StepperTrigger>
                    <StepperSeparator v-if="s.id !== steps.length" />
                </StepperItem>
            </Stepper>
        </div>

        <div v-if="lead" class="space-y-4">
            <div class="text-sm text-muted-foreground">Current Stage: {{steps.find(s => s.id === currentStep)?.title}}
            </div>
            <div class="rounded-md border bg-background p-4">
                <h2 class="text-sm font-medium mb-2">Stage Details</h2>
                <p class="text-sm text-muted-foreground">
                    {{steps.find(s => s.id === currentStep)?.description}} — Placeholder content for {{ lead.name }}
                    at this
                    stage.
                </p>
                <!-- Discovery -->
                <div v-if="currentStep === 1" class="mt-3 rounded-md bg-muted p-3 text-sm space-y-2">
                    <div class="font-medium mb-1">Discovery notes</div>
                    <div> Lead ID: {{ lead.id }} </div>
                    <div> Lead Name: {{ lead.name }} </div>
                    <div> Lead URL: {{ lead.url }} </div>
                    <div class="font-medium mb-1"> Lead Analysis </div>
                    <div> N/A </div>
                    <div v-if="lead.stage == 1" class="flex space-x-2">
                        <Button variant="outline" class="px-4"
                            @click="updateLead(lead.id, { stage: 2, outreachMethod: 'email' })">
                            Mail
                        </Button>
                        <Button variant="outline" class="px-4"
                            @click="updateLead(lead.id, { stage: 2, outreachMethod: 'call' })">
                            Call
                        </Button>
                    </div>
                </div>
                <!-- Outreach -->
                <div v-if="currentStep === 2" class="mt-3 space-y-3 text-sm">
                    <div class="rounded-md bg-muted p-3">
                        <div class="font-medium mb-1">Outreach method</div>
                        <div>{{ lead.outreachMethod || 'N/A' }}</div>
                    </div>
                    <div v-if="lead.outreachMethod === 'email'" class="rounded-md bg-muted p-3">
                        <div class="font-medium mb-1">Email transcript</div>
                        <pre class="whitespace-pre-wrap">{{ lead.emailTranscript || 'N/A' }}</pre>
                    </div>
                    <div v-if="lead.outreachMethod === 'call'" class="rounded-md bg-muted p-3">
                        <div class="font-medium mb-1">Call transcript + summary</div>
                        <pre class="whitespace-pre-wrap">{{ lead.callTranscript || 'N/A' }}</pre>
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
            <div class="text-sm">URL: <RouterLink :to="lead.url" class="underline">{{ lead.url }}</RouterLink>
            </div>
            <div class="text-sm">Notes: Add details, contact info, and activity here.</div>
        </div>
        <div v-else class="text-sm text-muted-foreground">Lead not found.</div>
    </div>
</template>
