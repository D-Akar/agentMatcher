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

interface GalleryItem {
  id: string
  image: string
  title: string
  description: string
  address: string
  coordinates: [number, number] // [lat, lng]
}

const galleryItems: GalleryItem[] = [
  { id: 'b1', image: 'https://picsum.photos/seed/biz1/640/360', title: 'Acme Coffee', description: 'Small-batch roastery with a cozy storefront.', address: '123 Main St, Seattle, WA 98101', coordinates: [47.6062, -122.3321] },
  { id: 'b2', image: 'https://picsum.photos/seed/biz2/640/360', title: 'Nova Fitness', description: 'Boutique gym focusing on functional training.', address: '456 Oak Ave, Portland, OR 97201', coordinates: [45.5152, -122.6784] },
  { id: 'b3', image: 'https://picsum.photos/seed/biz3/640/360', title: 'Petal & Stem', description: 'Modern floral studio for events and weddings.', address: '789 Pine St, San Francisco, CA 94102', coordinates: [37.7749, -122.4194] },
  { id: 'b4', image: 'https://picsum.photos/seed/biz4/640/360', title: 'Green Spoon', description: 'Plant-forward bistro with seasonal menus.', address: '321 Elm St, Los Angeles, CA 90210', coordinates: [34.0522, -118.2437] },
  { id: 'b5', image: 'https://picsum.photos/seed/biz5/640/360', title: 'Bright Minds', description: 'Learning center offering after-school programs.', address: '654 Maple Dr, Austin, TX 78701', coordinates: [30.2672, -97.7431] },
  { id: 'b6', image: 'https://picsum.photos/seed/biz6/640/360', title: 'Studio North', description: 'Creative agency for brand and web design.', address: '987 Cedar Ln, Denver, CO 80202', coordinates: [39.7392, -104.9903] },
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
const activeItem = ref<GalleryItem | null>(null)
const isDialogOpen = ref(false)

const isSettingsOpen = ref(false)
const userRole = ref('')
const userObjective = ref('')

function handleCardClick(item: GalleryItem) {
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
  const selectedItems = galleryItems.filter(item => selectedIds.value.has(item.id))
  selectedItems.forEach(item => {
    addLead({
      id: item.id,
      name: item.title,
      stage: 1,
      address: item.address,
      coordinates: item.coordinates
    })
  })
  toast('Mass add completed', {
    description: `${selectedItems.length} business(es) added to leads at Discovery stage`
  })
  selectedIds.value.clear()
}

function massEmail() {
  const selectedItems = galleryItems.filter(item => selectedIds.value.has(item.id))
  selectedItems.forEach(item => {
    addLead({
      id: item.id,
      name: item.title,
      stage: 2,
      outreachMethod: 'email',
      emailTranscript: 'Email transcript goes here',
      address: item.address,
      coordinates: item.coordinates
    })
  })
  toast('Mass email queued', {
    description: `${selectedItems.length} business(es) added to leads with email outreach initiated`
  })
  selectedIds.value.clear()
}

function massCall() {
  const selectedItems = galleryItems.filter(item => selectedIds.value.has(item.id))
  selectedItems.forEach(item => {
    addLead({
      id: item.id,
      name: item.title,
      stage: 2,
      outreachMethod: 'call',
      callTranscript: 'Call transcript and summary go here',
      address: item.address,
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
                  <div v-for="item in galleryItems" :key="item.id"
                    class="group cursor-pointer overflow-hidden rounded-lg border bg-background transition hover:shadow-sm"
                    :class="selectedIds.has(item.id) ? 'ring-2 ring-primary' : ''" @click="handleCardClick(item)">
                    <div class="aspect-video w-full overflow-hidden bg-muted">
                      <img :src="item.image" alt=""
                        class="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]" />
                    </div>
                    <div class="p-3 space-y-1">
                      <div class="flex items-start justify-between gap-2">
                        <h3 class="text-sm font-medium leading-none">{{ item.title }}</h3>
                        <div class="shrink-0 h-2.5 w-2.5 rounded-full border"
                          :class="selectedIds.has(item.id) ? 'bg-primary border-primary' : 'bg-background border-muted-foreground/30'"
                          aria-hidden="true" />
                      </div>
                      <p class="text-xs text-muted-foreground">{{ item.description }}</p>
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
          <DialogTitle>{{ activeItem?.title }}</DialogTitle>
          <DialogDescription>
            {{ activeItem?.description }}
          </DialogDescription>
        </DialogHeader>
        <div class="mt-2 space-y-4">
          <div class="aspect-video w-full overflow-hidden rounded-md bg-muted">
            <img v-if="activeItem" :src="activeItem.image" alt="" class="h-full w-full object-cover" />
          </div>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div class="text-muted-foreground">Category</div>
              <div>Cafe / Retail</div>
            </div>
            <div>
              <div class="text-muted-foreground">Location</div>
              <div>Downtown</div>
            </div>
            <div>
              <div class="text-muted-foreground">Website</div>
              <div><a class="underline" href="#" @click.prevent>example.com</a></div>
            </div>
            <div>
              <div class="text-muted-foreground">Status</div>
              <div>Active lead</div>
            </div>
            <div class="col-span-2">
              <div class="text-muted-foreground">Address</div>
              <div>{{ activeItem?.address }}</div>
            </div>
          </div>
        </div>
        <DialogFooter class="mt-2 gap-2 sm:gap-0 flex space-x-2">
          <Button variant="outline" @click="isDialogOpen = false">Close</Button>
          <Button
            @click="() => { if (activeItem) { addLead({ id: activeItem.id, name: activeItem.title, stage: 1, address: activeItem.address, coordinates: activeItem.coordinates }); } isDialogOpen = false; toast('Added to leads', { description: `${activeItem?.title} added at Discovery` }) }">Add</Button>
          <Button
            @click="() => { if (activeItem) { addLead({ id: activeItem.id, name: activeItem.title, stage: 2, outreachMethod: 'email', emailTranscript: 'Email transcript goes here', address: activeItem.address, coordinates: activeItem.coordinates }); } isDialogOpen = false; toast('Email agent started', { description: `To: ${activeItem?.title}` }) }">E-Mail
            using Agent</Button>
          <Button
            @click="() => { if (activeItem) { addLead({ id: activeItem.id, name: activeItem.title, stage: 2, outreachMethod: 'call', callTranscript: 'Call transcript and summary go here', address: activeItem.address, coordinates: activeItem.coordinates }); } isDialogOpen = false; toast('Call agent started', { description: `Calling: ${activeItem?.title}` }) }">Call
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
