<script setup lang="ts">

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'vue-sonner'
import { ref, nextTick } from 'vue'
import { addLead } from '@/stores/leads'

type ChatRole = 'user' | 'assistant'

interface ChatMessage {
  id: string
  role: ChatRole
  content: string
}

const chats = ref<ChatMessage[]>([
  { id: '1', role: 'assistant', content: 'Hello! How can I help you today?' },
])

interface BusinessRecommendation {
  id: string
  name: string
  address?: string | null
  phone_number?: string | null
  email?: string | null
  website?: string | null
  review_rate?: string | null
  number_of_reviews?: string | null
  description?: string | null
  coordinates?: [number, number] | null // [lat, lng]
}

const businessRecommendations: BusinessRecommendation[] = [
  {
    id: 'grace-ling',
    name: 'Grace Ling',
    address: '240 West 40th Street, Suite 603, New York, NY 10018, US',
    phone_number: null,
    email: 'shop@gracelingofficial.com',
    website: 'https://gracelingofficial.com/',
    review_rate: 'N/A',
    number_of_reviews: 'N/A',
    description: 'Grace Ling is a fashion designer and her eponymous label, based in New York City. She was born in Singapore and studied Fashion Design at Parsons School of Design in New York City and Central Saint Martins in London. Her brand, launched in 2020, is known for its sensual yet highly technical pieces, often featuring 3D-printed metal designs and sculptural silhouettes.',
    coordinates: [40.7589, -73.9851] // NYC coordinates
  },
  {
    id: 'paolina-russo',
    name: 'Paolina Russo',
    address: null,
    phone_number: null,
    email: 'sales@paolinarusso.com, press@paolinarusso.com',
    website: 'paolinarusso.com',
    review_rate: 'N/A',
    number_of_reviews: 'N/A',
    description: 'Paolina Russo is a London-based fashion brand co-founded by Canadian designer Paolina Russo and French designer Lucile Guilmard, established in 2020. The brand is known for its avant-garde textile development, craftsmanship, and futuristic aesthetic.',
    coordinates: [51.5074, -0.1278] // London coordinates
  },
  {
    id: 'cuts-clothing',
    name: 'Cuts Clothing, Inc.',
    address: '5839 Green Valley Cir #208, Culver City, CA 90230-6937, US',
    phone_number: null,
    email: null,
    website: 'https://www.cutsclothing.com/',
    review_rate: '3.7',
    number_of_reviews: '3',
    description: 'Cuts Clothing creates premium essentials, including tees, tanks, polos, pants, button-downs, and Henleys. The brand focuses on quality fabric, fit, and durability for "the sport of business" and is described as an online retailer.',
    coordinates: [34.0219, -118.3965] // Culver City coordinates
  },
  {
    id: 'original-grain',
    name: 'Original Grain',
    address: '4833 Santa Monica Avenue, Suite 7309, San Diego, CA 92167, US',
    phone_number: '(619) 501-6554',
    email: 'support@originalgrain.com',
    website: 'https://www.originalgrain.com/',
    review_rate: '5-star',
    number_of_reviews: 'Over 18,000',
    description: 'Original Grain is a San Diego-based company, established in 2013, that designs and manufactures handcrafted watches and accessories. They are known for blending sustainable and natural materials like reclaimed wood with stainless steel to create unique timepieces.',
    coordinates: [32.7157, -117.1611] // San Diego coordinates
  },
  {
    id: 'obvi',
    name: 'Obvi',
    address: '78 John Miller Way, Kearny, New Jersey 07032, US',
    phone_number: '1-888-910-8338',
    email: 'hello@myobvi.com',
    website: 'https://www.myobvi.com',
    review_rate: 'N/A',
    number_of_reviews: 'N/A',
    description: 'Obvi is a company located in Kearny, New Jersey, that produces health and wellness supplements, primarily focusing on collagen and protein products. They aim to provide transparent products with real results without sacrificing taste.',
    coordinates: [40.7684, -74.1454] // Kearny, NJ coordinates
  }
]

const selectedIds = ref<Set<string>>(new Set())
const userInput = ref('')
const showGallery = ref(false)
const tags = ref<string[]>([])

function toggleSelected(id: string) {
  const next = new Set(selectedIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selectedIds.value = next
}

const isMultiselect = ref(false)
const activeItem = ref<BusinessRecommendation | null>(null)
const isDialogOpen = ref(false)

const isSettingsOpen = ref(false)
const userRole = ref('')
const userObjective = ref('')

function handleCardClick(item: BusinessRecommendation) {
  if (isMultiselect.value) {
    toggleSelected(item.id)
    return
  }
  activeItem.value = item
  isDialogOpen.value = true
}

function handleRoleClick() {
  isSettingsOpen.value = !isSettingsOpen.value
}

function saveSettings() {
  // Here you could save to localStorage or a store
  console.log('User Role:', userRole.value)
  console.log('User Objective:', userObjective.value)
  isSettingsOpen.value = false
  toast('Settings saved', {
    description: 'Your role and objectives have been updated'
  })
}

function sendMessage() {
  if (!userInput.value.trim()) return

  // Add user message
  const userMessage: ChatMessage = {
    id: Date.now().toString(),
    role: 'user',
    content: userInput.value.trim()
  }
  chats.value.push(userMessage)

  // Check if user typed "recommend"
  if (userInput.value.toLowerCase().includes('recommend')) {
    // Add assistant response
    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: 'recommending'
    }
    chats.value.push(assistantMessage)
    showGallery.value = true
  } else {
    // Add default assistant response
    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: 'I would love to assist you, please type in recommend to get your options.'
    }
    chats.value.push(assistantMessage)
  }

  userInput.value = ''

  // Scroll to bottom
  nextTick(() => {
    const scrollArea = document.querySelector('[data-radix-scroll-area-viewport]')
    if (scrollArea) {
      scrollArea.scrollTop = scrollArea.scrollHeight
    }
  })
}

function massAdd() {
  const selectedItems = businessRecommendations.filter(item => selectedIds.value.has(item.id))
  selectedItems.forEach(item => {
    addLead({
      id: item.id,
      name: item.name,
      stage: 1,
      address: item.address,
      phone_number: item.phone_number,
      email: item.email,
      website: item.website,
      review_rate: item.review_rate,
      number_of_reviews: item.number_of_reviews,
      description: item.description,
      coordinates: item.coordinates
    })
  })
  toast('Mass add completed', {
    description: `${selectedItems.length} business(es) added to leads at Discovery stage`
  })
  selectedIds.value.clear()
}

function massEmail() {
  const selectedItems = businessRecommendations.filter(item => selectedIds.value.has(item.id))
  selectedItems.forEach(item => {
    addLead({
      id: item.id,
      name: item.name,
      stage: 2,
      outreachMethod: 'email',
      emailTranscript: 'Email transcript goes here',
      address: item.address,
      phone_number: item.phone_number,
      email: item.email,
      website: item.website,
      review_rate: item.review_rate,
      number_of_reviews: item.number_of_reviews,
      description: item.description,
      coordinates: item.coordinates
    })
  })
  toast('Mass email queued', {
    description: `${selectedItems.length} business(es) added to leads with email outreach initiated`
  })
  selectedIds.value.clear()
}

function massCall() {
  const selectedItems = businessRecommendations.filter(item => selectedIds.value.has(item.id))
  selectedItems.forEach(item => {
    addLead({
      id: item.id,
      name: item.name,
      stage: 2,
      outreachMethod: 'call',
      callTranscript: 'Call transcript and summary go here',
      address: item.address,
      phone_number: item.phone_number,
      email: item.email,
      website: item.website,
      review_rate: item.review_rate,
      number_of_reviews: item.number_of_reviews,
      description: item.description,
      coordinates: item.coordinates
    })
  })
  toast('Mass call queued', {
    description: `${selectedItems.length} business(es) added to leads with call outreach initiated`
  })
  selectedIds.value.clear()
}

</script>

<template>
  <div class="h-full flex flex-col">
    <div class="flex gap-4 flex-1 min-h-0 max-h-full">
      <!-- Main chat area (3/4) -->
      <div class="flex flex-col gap-2" style="flex: 3;">
        <div class="flex-shrink-0">
          <h1 class="text-xl font-semibold mb-4">Prompting</h1>
          <p class="text-sm text-muted-foreground">Welcome to the Prompting page.</p>
          <p class="text-sm text-muted-foreground">Begin your chat with the agent to get started!</p>
        </div>

        <!-- Scrollable chat area with fixed height -->
        <div class="flex-1 min-h-0 overflow-hidden" id="chatArea" style="height: 0;">
          <ScrollArea class="w-full h-full rounded-md border overflow-hidden">
            <div class="p-2 md:p-4 space-y-4 max-h-85">
              <div v-for="chat in chats" :key="chat.id" class="flex pb-2"
                :class="chat.role === 'user' ? 'justify-end' : 'justify-start'">
                <div class="max-w-[85%] md:max-w-[70%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap" :class="chat.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background border border-border text-foreground'">
                  <div class="mb-1 text-[10px] uppercase tracking-wide opacity-70">
                    {{ chat.role === 'user' ? 'You' : 'Assistant' }}
                  </div>
                  <div>{{ chat.content }}</div>
                </div>
              </div>

              <!-- Gallery section inside scroll area -->
              <div v-if="showGallery" class="mt-6 pb-2">
                <div class="flex items-center justify-between gap-2 mb-3">
                  <h2 class="text-sm font-medium">Suggested businesses</h2>
                  <div class="flex items-center gap-2">
                    <Button variant="outline" size="sm" @click="isMultiselect = !isMultiselect"
                      :class="isMultiselect ? 'bg-primary/10 border-primary' : ''">
                      {{ isMultiselect ? 'Multiselect: On' : 'Multiselect' }}
                    </Button>
                    <Button v-if="isMultiselect" variant="outline" size="sm" :disabled="selectedIds.size === 0"
                      @click="massAdd">Mass Add</Button>
                    <Button v-if="isMultiselect" variant="outline" size="sm" :disabled="selectedIds.size === 0"
                      @click="massEmail">Mass Email</Button>
                    <Button v-if="isMultiselect" variant="outline" size="sm" :disabled="selectedIds.size === 0"
                      @click="massCall">Mass Call</Button>
                  </div>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div v-for="item in businessRecommendations" :key="item.id"
                    class="group cursor-pointer overflow-hidden rounded-lg border bg-background transition hover:shadow-sm"
                    :class="selectedIds.has(item.id) ? 'ring-2 ring-primary' : ''" @click="handleCardClick(item)">
                    <div class="p-4 space-y-3">
                      <div class="flex items-start justify-between gap-2">
                        <h3 class="text-sm font-medium leading-none">{{ item.name }}</h3>
                        <div class="shrink-0 h-2.5 w-2.5 rounded-full border"
                          :class="selectedIds.has(item.id) ? 'bg-primary border-primary' : 'bg-background border-muted-foreground/30'"
                          aria-hidden="true" />
                      </div>
                      <p class="text-xs text-muted-foreground line-clamp-3">{{ item.description }}</p>
                      <div class="space-y-1">
                        <div v-if="item.address" class="flex items-center gap-1 text-xs text-muted-foreground">
                          <span>📍</span>
                          <span class="truncate">{{ item.address }}</span>
                        </div>
                        <div class="flex items-center gap-2">
                          <span v-if="item.phone_number" class="text-sm" title="Phone available">📞</span>
                          <span v-if="item.email" class="text-sm" title="Email available">📧</span>
                          <span v-if="item.website" class="text-sm" title="Website available">🌐</span>
                        </div>
                        <div v-if="item.review_rate || item.number_of_reviews"
                          class="flex items-center gap-1 text-xs text-muted-foreground">
                          <span>⭐</span>
                          <span>{{ item.review_rate ?? 'N/A' }} ({{ item.number_of_reviews ?? 'No' }} reviews)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>

        <!-- Fixed input area -->
        <div class="flex-shrink-0 grid w-full gap-2">
          <Textarea v-model="userInput" placeholder="Type your message here." @keydown.enter.prevent="sendMessage" />
          <Button @click="sendMessage" :disabled="!userInput.trim()">Send message</Button>
        </div>
      </div>

      <!-- Right panel (1/4) -->
      <div class="flex flex-col gap-4" style="flex: 1;">
        <div class="flex justify-end">
          <Button variant="outline" size="sm" @click="handleRoleClick">Add role context</Button>
        </div>
        <div>
          <h3 class="text-sm font-medium mb-2">Tags</h3>
          <div v-if="tags.length === 0" class="text-sm text-muted-foreground">No tags yet</div>
          <div v-else class="space-y-1">
            <div v-for="tag in tags" :key="tag" class="text-sm bg-muted px-2 py-1 rounded">{{ tag }}</div>
          </div>
        </div>
      </div>
    </div>
    <Dialog v-model:open="isDialogOpen">
      <DialogContent class="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{{ activeItem?.name }}</DialogTitle>
          <DialogDescription>
            Business details and contact information
          </DialogDescription>
        </DialogHeader>
        <div class="mt-2 space-y-4">
          <div class="space-y-3">
            <div v-if="activeItem?.description" class="text-sm text-muted-foreground">
              {{ activeItem.description }}
            </div>
            <div class="grid grid-cols-1 gap-3 text-sm">
              <div v-if="activeItem?.address">
                <div class="text-muted-foreground">Address</div>
                <div class="flex items-center gap-1">
                  <span>📍</span>
                  <span>{{ activeItem.address }}</span>
                </div>
              </div>
              <div v-if="activeItem?.phone_number">
                <div class="text-muted-foreground">Phone</div>
                <div class="flex items-center gap-1">
                  <span>📞</span>
                  <span>{{ activeItem.phone_number }}</span>
                </div>
              </div>
              <div v-if="activeItem?.email">
                <div class="text-muted-foreground">Email</div>
                <div class="flex items-center gap-1">
                  <span>📧</span>
                  <span>{{ activeItem.email }}</span>
                </div>
              </div>
              <div v-if="activeItem?.website">
                <div class="text-muted-foreground">Website</div>
                <div class="flex items-center gap-1">
                  <span>🌐</span>
                  <a :href="activeItem.website" target="_blank" class="underline hover:text-primary">{{
                    activeItem.website }}</a>
                </div>
              </div>
              <div v-if="activeItem?.review_rate && activeItem?.number_of_reviews">
                <div class="text-muted-foreground">Reviews</div>
                <div class="flex items-center gap-1">
                  <span>⭐</span>
                  <span>{{ activeItem.review_rate ?? 'N/A' }} ({{ activeItem.number_of_reviews ?? 'No' }}
                    reviews)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter class="mt-2 gap-2 sm:gap-0 flex space-x-2">
          <Button variant="outline" @click="isDialogOpen = false">Close</Button>
          <Button
            @click="() => { if (activeItem) { addLead({ id: activeItem.id, name: activeItem.name, stage: 1, address: activeItem.address, phone_number: activeItem.phone_number, email: activeItem.email, website: activeItem.website, review_rate: activeItem.review_rate, number_of_reviews: activeItem.number_of_reviews, description: activeItem.description, coordinates: activeItem.coordinates }); } isDialogOpen = false; toast('Added to leads', { description: `${activeItem?.name} added at Discovery` }) }">Add</Button>
          <Button
            @click="() => { if (activeItem) { addLead({ id: activeItem.id, name: activeItem.name, stage: 2, outreachMethod: 'email', emailTranscript: 'Email transcript goes here', address: activeItem.address, phone_number: activeItem.phone_number, email: activeItem.email, website: activeItem.website, review_rate: activeItem.review_rate, number_of_reviews: activeItem.number_of_reviews, description: activeItem.description, coordinates: activeItem.coordinates }); } isDialogOpen = false; toast('Email agent started', { description: `To: ${activeItem?.name}` }) }">E-Mail
            using Agent</Button>
          <Button
            @click="() => { if (activeItem) { addLead({ id: activeItem.id, name: activeItem.name, stage: 2, outreachMethod: 'call', callTranscript: 'Call transcript and summary go here', address: activeItem.address, phone_number: activeItem.phone_number, email: activeItem.email, website: activeItem.website, review_rate: activeItem.review_rate, number_of_reviews: activeItem.number_of_reviews, description: activeItem.description, coordinates: activeItem.coordinates }); } isDialogOpen = false; toast('Call agent started', { description: `Calling: ${activeItem?.name}` }) }">Call
            using Agent</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <Dialog v-model:open="isSettingsOpen">
      <DialogContent class="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Role & Objectives</DialogTitle>
          <DialogDescription>
            Define your role and what you're looking for to get better recommendations.
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <label for="userRole" class="text-sm font-medium">Your Role</label>
            <input id="userRole" v-model="userRole" type="text"
              placeholder="e.g., Influencer, Startup Founder, Marketing Manager"
              class="w-full px-3 py-2 border border-input bg-background rounded-md text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2" />
          </div>

          <div class="space-y-2">
            <label for="userObjective" class="text-sm font-medium">What you're looking for</label>
            <textarea id="userObjective" v-model="userObjective"
              placeholder="e.g., Looking for manufacturers for sustainable clothing line, seeking marketing agencies for tech startup, finding suppliers for organic skincare products"
              rows="3"
              class="w-full px-3 py-2 border border-input bg-background rounded-md text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="isSettingsOpen = false">Cancel</Button>
          <Button @click="saveSettings" :disabled="!userRole.trim() || !userObjective.trim()">
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
