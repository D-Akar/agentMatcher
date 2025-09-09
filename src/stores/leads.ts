import { reactive, watch } from 'vue'
import type { LucideIcon } from 'lucide-vue-next'
import { Frame } from 'lucide-vue-next'

export interface Lead {
    id: string
    name: string
    slug: string
    url: string
    icon: LucideIcon
    address?: string | null
    phone_number?: string | null
    email?: string | null
    website?: string | null
    review_rate?: string | null
    number_of_reviews?: string | null
    description?: string | null
    coordinates?: [number, number] | null // [lat, lng]
    // Our internal tracking fields
    stage?: number
    outreachMethod?: 'email' | 'call' | null
    emailTranscript?: string | null
    callTranscript?: string | null
    notes?: string | null
}

// Load leads from localStorage on initialization
function loadLeadsFromStorage(): Lead[] {
    try {
        const stored = localStorage.getItem('leads')
        if (stored) {
            const parsed = JSON.parse(stored)
            // Convert icon strings back to LucideIcon (we'll store icon names as strings)
            return parsed.map((lead: any) => ({
                ...lead,
                icon: Frame // For simplicity, we'll use Frame for all restored leads
            }))
        }
    } catch (error) {
        console.error('Error loading leads from localStorage:', error)
    }
    return []
}

// Save leads to localStorage
function saveLeadsToStorage(leads: Lead[]) {
    try {
        // Convert icon to string for storage (we'll use Frame for all restored leads)
        const leadsToStore = leads.map(lead => ({
            ...lead,
            icon: 'Frame' // Store as string
        }))
        localStorage.setItem('leads', JSON.stringify(leadsToStore))
    } catch (error) {
        console.error('Error saving leads to localStorage:', error)
    }
}

export const leads = reactive<Lead[]>(loadLeadsFromStorage())

// Watch for changes and save to localStorage
watch(leads, (newLeads) => {
    saveLeadsToStorage(newLeads)
}, { deep: true })

function slugify(input: string): string {
    return input
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
}

export function addLead(partial: {
    id: string;
    name: string;
    url?: string;
    icon?: LucideIcon;
    address?: string | null;
    phone_number?: string | null;
    email?: string | null;
    website?: string | null;
    review_rate?: string | null;
    number_of_reviews?: string | null;
    description?: string | null;
    coordinates?: [number, number] | null;
    stage?: number;
    outreachMethod?: 'email' | 'call' | null;
    emailTranscript?: string | null;
    callTranscript?: string | null;
    notes?: string | null;
}) {
    const existing = leads.find(l => l.id === partial.id)
    if (existing) {
        // Merge updates for existing lead
        if (partial.name) existing.name = partial.name
        if (partial.url) existing.url = partial.url
        if (partial.icon) existing.icon = partial.icon
        if (partial.address !== undefined) existing.address = partial.address ?? null
        if (partial.phone_number !== undefined) existing.phone_number = partial.phone_number ?? null
        if (partial.email !== undefined) existing.email = partial.email ?? null
        if (partial.website !== undefined) existing.website = partial.website ?? null
        if (partial.review_rate !== undefined) existing.review_rate = partial.review_rate ?? null
        if (partial.number_of_reviews !== undefined) existing.number_of_reviews = partial.number_of_reviews ?? null
        if (partial.description !== undefined) existing.description = partial.description ?? null
        if (partial.coordinates !== undefined) existing.coordinates = partial.coordinates ?? null
        if (partial.stage !== undefined) existing.stage = partial.stage
        if (partial.outreachMethod !== undefined) existing.outreachMethod = partial.outreachMethod
        if (partial.emailTranscript !== undefined) existing.emailTranscript = partial.emailTranscript ?? null
        if (partial.callTranscript !== undefined) existing.callTranscript = partial.callTranscript ?? null
        if (partial.notes !== undefined) existing.notes = partial.notes ?? null
        return
    }
    const slug = slugify(partial.name)
    leads.push({
        id: partial.id,
        name: partial.name,
        slug,
        url: partial.url ?? `/leads/${slug}`,
        icon: partial.icon ?? Frame,
        address: partial.address ?? null,
        phone_number: partial.phone_number ?? null,
        email: partial.email ?? null,
        website: partial.website ?? null,
        review_rate: partial.review_rate ?? null,
        number_of_reviews: partial.number_of_reviews ?? null,
        description: partial.description ?? null,
        coordinates: partial.coordinates ?? null,
        stage: partial.stage ?? 1,
        outreachMethod: partial.outreachMethod ?? null,
        emailTranscript: partial.emailTranscript ?? null,
        callTranscript: partial.callTranscript ?? null,
        notes: partial.notes ?? null,
    })
}

export function removeLead(idOrSlug: string) {
    const index = leads.findIndex(l => l.id === idOrSlug || l.slug === idOrSlug)
    if (index !== -1) {
        leads.splice(index, 1)
    }
}

export function updateLead(idOrSlug: string, updates: Partial<Lead>) {
    const lead = leads.find(l => l.id === idOrSlug || l.slug === idOrSlug)
    if (!lead) return
    Object.assign(lead, updates)
}


