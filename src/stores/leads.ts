import { reactive } from 'vue'
import type { LucideIcon } from 'lucide-vue-next'
import { Frame } from 'lucide-vue-next'

export interface Lead {
    id: string
    name: string
    slug: string
    url: string
    icon: LucideIcon
    stage?: number
    outreachMethod?: 'email' | 'call' | null
    emailTranscript?: string | null
    callTranscript?: string | null
    address?: string | null
    coordinates?: [number, number] | null // [lat, lng]
}

export const leads = reactive<Lead[]>([])

function slugify(input: string): string {
    return input
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
}

export function addLead(partial: { id: string; name: string; url?: string; icon?: LucideIcon; stage?: number; outreachMethod?: 'email' | 'call' | null; emailTranscript?: string | null; callTranscript?: string | null; address?: string | null; coordinates?: [number, number] | null }) {
    const existing = leads.find(l => l.id === partial.id)
    if (existing) {
        // Merge updates for existing lead
        if (partial.name) existing.name = partial.name
        if (partial.url) existing.url = partial.url
        if (partial.icon) existing.icon = partial.icon
        if (partial.stage !== undefined) existing.stage = partial.stage
        if (partial.outreachMethod !== undefined) existing.outreachMethod = partial.outreachMethod
        if (partial.emailTranscript !== undefined) existing.emailTranscript = partial.emailTranscript ?? null
        if (partial.callTranscript !== undefined) existing.callTranscript = partial.callTranscript ?? null
        if (partial.address !== undefined) existing.address = partial.address ?? null
        if (partial.coordinates !== undefined) existing.coordinates = partial.coordinates ?? null
        return
    }
    const slug = slugify(partial.name)
    leads.push({
        id: partial.id,
        name: partial.name,
        slug,
        url: partial.url ?? `/leads/${slug}`,
        icon: partial.icon ?? Frame,
        stage: partial.stage ?? 1,
        outreachMethod: partial.outreachMethod ?? null,
        emailTranscript: partial.emailTranscript ?? null,
        callTranscript: partial.callTranscript ?? null,
        address: partial.address ?? null,
        coordinates: partial.coordinates ?? null,
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


