<script setup lang="ts">
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'vue-sonner'
import { ref, nextTick, onMounted } from 'vue'

type ChatRole = 'user' | 'assistant'

interface ChatMessage {
    id: string
    role: ChatRole
    content: string
    timestamp?: Date
}

const chats = ref<ChatMessage[]>([])
const userInput = ref('')
const isLoading = ref(false)
const sessionStarted = ref(false)
const sessionId = ref('')
const userId = ref('testerName')

// Generate a unique session ID
const generateSessionId = () => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Sanitize text for JSON input
const sanitizeForJson = (text: string): string => {
    return text
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t')
}

// Start session with Google Cloud agent
const startSession = async () => {
    try {
        console.log('🚀 Starting session...')
        isLoading.value = true
        sessionId.value = generateSessionId()

        const requestBody = {
            state: {
                preferred_language: "English",
                visit_count: 1
            }
        }

        const response = await fetch(
            `/api/apps/contextual_agent/users/${userId.value}/sessions/${sessionId.value}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            }
        )

        if (response.ok) {
            sessionStarted.value = true
            console.log('✅ Session started')
            toast('Session started', {
                description: 'Connected to Google Cloud agent'
            })

            // Add welcome message
            const welcomeMessage: ChatMessage = {
                id: Date.now().toString(),
                role: 'assistant',
                content: 'Hello! I\'m here to help you build a detailed ideal client profile for your business.This will help you identify the best prospects when looking for potential leads. Let\'s get started! First, tell me about your service - what do you provide to your clients?',
                timestamp: new Date()
            }
            chats.value.push(welcomeMessage)
        } else {
            const errorText = await response.text()
            console.error('❌ Session start failed:', response.status, errorText)
            throw new Error(`Failed to start session: ${response.status} - ${errorText}`)
        }
    } catch (error) {
        console.error('💥 Session error:', error)
        toast('Failed to start session', {
            description: 'Please try again later'
        })
    } finally {
        isLoading.value = false
    }
}

// Send message to Google Cloud agent
const sendMessage = async () => {
    if (!userInput.value.trim() || !sessionStarted.value) return

    const messageText = userInput.value.trim()
    const sanitizedMessage = sanitizeForJson(messageText)

    console.log('💬 Sending:', messageText)

    // Add user message to chat
    const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: messageText,
        timestamp: new Date()
    }
    chats.value.push(userMessage)

    // Clear input
    const currentInput = userInput.value
    userInput.value = ''

    // Add loading message
    const loadingMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '...',
        timestamp: new Date()
    }
    chats.value.push(loadingMessage)

    // Scroll to bottom
    nextTick(() => {
        scrollToBottom()
    })

    try {
        isLoading.value = true

        const requestBody = {
            app_name: "contextual_agent",
            user_id: userId.value,
            session_id: sessionId.value,
            new_message: {
                role: "user",
                parts: [{
                    text: sanitizedMessage
                }]
            },
            streaming: false
        }

        const response = await fetch(
            '/api/run_sse',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            }
        )

        if (!response.ok) {
            const errorText = await response.text()
            console.error('❌ Request failed:', response.status, errorText)
            throw new Error(`Failed to send message: ${response.status} - ${errorText}`)
        }

        // Handle streaming response
        const reader = response.body?.getReader()
        if (!reader) {
            throw new Error('No response body')
        }

        let assistantResponse = ''
        let structuredData = null
        let chunkCount = 0
        let hasTextContent = false
        let hasStructuredData = false

        // Remove loading message
        chats.value = chats.value.filter(msg => msg.id !== loadingMessage.id)

        let buffer = ''

        while (true) {
            const { done, value } = await reader.read()
            if (done) break

            chunkCount++
            const chunk = new TextDecoder().decode(value)
            buffer += chunk

            // Process complete lines from buffer
            const lines = buffer.split('\n')
            // Keep the last line in buffer as it might be incomplete
            buffer = lines.pop() || ''

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const jsonStr = line.slice(6)
                        if (jsonStr.trim() === '') continue // Skip empty data lines

                        const data = JSON.parse(jsonStr)

                        // Extract text from the nested structure
                        let textContent = ''
                        let currentStructuredData = null

                        if (data.content && data.content.parts && data.content.parts.length > 0) {
                            const part = data.content.parts[0]

                            // Check for text content
                            if (part.text) {
                                textContent = part.text
                            }

                            // Check for function response (structured data)
                            if (part.functionResponse && part.functionResponse.response) {
                                currentStructuredData = part.functionResponse.response
                            }

                            // Check for function call arguments
                            if (part.functionCall && part.functionCall.args) {
                                currentStructuredData = part.functionCall.args
                            }
                        } else if (data.text) {
                            // Fallback for direct text property
                            textContent = data.text
                        }

                        // Log full chunk data
                        console.log(`Chunk ${chunkCount}:`, data)

                        if (textContent) {
                            assistantResponse += textContent
                            hasTextContent = true
                        }
                        if (currentStructuredData) {
                            structuredData = currentStructuredData
                            hasStructuredData = true
                        }

                        // Update the chat with current text content (for real-time display)
                        if (textContent) {
                            // Update the last assistant message with accumulated text
                            const lastMessage = chats.value[chats.value.length - 1]
                            if (lastMessage && lastMessage.role === 'assistant') {
                                lastMessage.content = assistantResponse
                            } else {
                                // Create new assistant message
                                const assistantMessage: ChatMessage = {
                                    id: Date.now().toString(),
                                    role: 'assistant',
                                    content: assistantResponse,
                                    timestamp: new Date()
                                }
                                chats.value.push(assistantMessage)
                            }

                            // Scroll to bottom as content updates
                            nextTick(() => {
                                scrollToBottom()
                            })
                        }
                    } catch (e) {
                        // Log the problematic JSON string for debugging
                        console.warn('⚠️ Parse error:', e)
                        console.warn('Problematic JSON string:', line.slice(6))
                    }
                }
            }
        }

        // Process any remaining data in buffer
        if (buffer.trim()) {
            console.warn('⚠️ Unprocessed buffer data:', buffer)
        }

        console.log(`✅ Complete - ${chunkCount} chunks, Text: ${hasTextContent}, Data: ${hasStructuredData}`)

        // Final processing: combine text and structured data in the correct order
        if (hasTextContent || hasStructuredData) {
            let finalResponse = assistantResponse

            // Add structured data after text content if we have both
            if (hasStructuredData && structuredData) {
                const formattedData = formatStructuredData(structuredData)
                if (formattedData) {
                    finalResponse += '\n\n' + formattedData
                }
            }

            // Update the final message
            const lastMessage = chats.value[chats.value.length - 1]
            if (lastMessage && lastMessage.role === 'assistant') {
                lastMessage.content = finalResponse
            }
        } else {
            const fallbackMessage: ChatMessage = {
                id: Date.now().toString(),
                role: 'assistant',
                content: 'I received your message but couldn\'t process it properly. Please try again.',
                timestamp: new Date()
            }
            chats.value.push(fallbackMessage)
        }

    } catch (error) {
        console.error('💥 Error:', error)

        // Remove loading message and add error message
        chats.value = chats.value.filter(msg => msg.id !== loadingMessage.id)

        const errorMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'assistant',
            content: 'Sorry, I encountered an error processing your message. Please try again.',
            timestamp: new Date()
        }
        chats.value.push(errorMessage)

        toast('Error sending message', {
            description: 'Please check your connection and try again'
        })
    } finally {
        isLoading.value = false
        nextTick(() => {
            scrollToBottom()
        })
    }
}

// Format structured data into readable text with deduplication
const formatStructuredData = (data: any): string => {
    if (!data) return ''

    let formatted = ''

    // Helper function to deduplicate arrays
    const deduplicateArray = (arr: string[]): string[] => {
        const seen = new Set<string>()
        return arr.filter(item => {
            const normalized = item.toLowerCase().trim()
            if (seen.has(normalized)) {
                return false
            }
            seen.add(normalized)
            return true
        })
    }

    // Helper function to get unique items from multiple sources
    const getUniqueItems = (...arrays: string[][]): string[] => {
        const allItems = arrays.flat().filter(Boolean)
        return deduplicateArray(allItems)
    }

    // Collect all data from different sources
    let serviceProvided = ''
    let uniqueValueProp = ''
    let industryNiche = ''
    let companySize = ''
    let location = ''
    let painPoints: string[] = []
    let benefits: string[] = []
    let differentiators: string[] = []
    let greenFlags: string[] = []
    let redFlags: string[] = []

    // Extract from user_info section
    if (data.user_info) {
        const userInfo = data.user_info
        if (userInfo.service_provided) serviceProvided = userInfo.service_provided
        if (userInfo.unique_value_prop) uniqueValueProp = userInfo.unique_value_prop

        if (userInfo.core_messaging) {
            const cm = userInfo.core_messaging
            if (cm.specific_pain_points_solved) painPoints.push(...cm.specific_pain_points_solved)
            if (cm.key_benefits_and_outcomes) benefits.push(...cm.key_benefits_and_outcomes)
            if (cm.competitor_differentiators) differentiators.push(...cm.competitor_differentiators)
        }
    }

    // Extract from ideal_client section
    if (data.ideal_client) {
        const idealClient = data.ideal_client

        if (idealClient.company_profile) {
            const cp = idealClient.company_profile
            if (cp.industry_niche) industryNiche = cp.industry_niche
            if (cp.company_size) companySize = cp.company_size
            if (cp.location) location = cp.location
        }

        if (idealClient.opportunity_signals) {
            const os = idealClient.opportunity_signals
            if (os.green_flags) greenFlags.push(...os.green_flags)
            if (os.red_flags) redFlags.push(...os.red_flags)
        }
    }

    // Extract from direct properties (function call args)
    if (data.service_provided) serviceProvided = data.service_provided
    if (data.unique_value_prop) uniqueValueProp = data.unique_value_prop
    if (data.industry_niche) industryNiche = data.industry_niche
    if (data.company_size) companySize = data.company_size
    if (data.location) location = data.location
    if (data.specific_pain_points_solved) painPoints.push(...data.specific_pain_points_solved)
    if (data.key_benefits_and_outcomes) benefits.push(...data.key_benefits_and_outcomes)
    if (data.competitor_differentiators) differentiators.push(...data.competitor_differentiators)
    if (data.green_flags) greenFlags.push(...data.green_flags)
    if (data.red_flags) redFlags.push(...data.red_flags)

    // Format the output with deduplicated data
    if (serviceProvided) {
        formatted += `**Service Provided**: ${serviceProvided}\n`
    }
    if (uniqueValueProp) {
        formatted += `**Unique Value Proposition**: ${uniqueValueProp}\n`
    }

    const uniquePainPoints = getUniqueItems(painPoints)
    if (uniquePainPoints.length > 0) {
        formatted += `**Specific Pain Points Solved**:\n`
        uniquePainPoints.forEach((point: string) => {
            formatted += `* ${point}\n`
        })
    }

    const uniqueBenefits = getUniqueItems(benefits)
    if (uniqueBenefits.length > 0) {
        formatted += `**Key Benefits & Outcomes**:\n`
        uniqueBenefits.forEach((benefit: string) => {
            formatted += `* ${benefit}\n`
        })
    }

    const uniqueDifferentiators = getUniqueItems(differentiators)
    if (uniqueDifferentiators.length > 0) {
        formatted += `**Competitor Differentiators**:\n`
        uniqueDifferentiators.forEach((diff: string) => {
            formatted += `* ${diff}\n`
        })
    }

    if (industryNiche) {
        formatted += `**Industry/Niche**: ${industryNiche}\n`
    }
    if (companySize) {
        formatted += `**Company Size**: ${companySize}\n`
    }
    if (location) {
        formatted += `**Location**: ${location}\n`
    }

    const uniqueGreenFlags = getUniqueItems(greenFlags)
    if (uniqueGreenFlags.length > 0) {
        formatted += `**Green Flags (Good time to engage)**:\n`
        uniqueGreenFlags.forEach((flag: string) => {
            formatted += `* ${flag}\n`
        })
    }

    const uniqueRedFlags = getUniqueItems(redFlags)
    if (uniqueRedFlags.length > 0) {
        formatted += `**Red Flags (Reasons to avoid)**:\n`
        uniqueRedFlags.forEach((flag: string) => {
            formatted += `* ${flag}\n`
        })
    }

    return formatted
}

// Format message content for better display
const formatMessageContent = (content: string): string => {
    if (!content) return ''

    // Remove duplicate content (in case of streaming issues)
    const lines = content.split('\n')
    const uniqueLines: string[] = []
    const seenLines = new Set<string>()

    for (const line of lines) {
        const trimmedLine = line.trim()
        if (trimmedLine && !seenLines.has(trimmedLine)) {
            seenLines.add(trimmedLine)
            uniqueLines.push(line)
        }
    }

    let cleanedContent = uniqueLines.join('\n')

    // Format JSON blocks with syntax highlighting
    cleanedContent = cleanedContent.replace(
        /```json\n([\s\S]*?)\n```/g,
        '<pre class="bg-muted p-3 rounded-md overflow-x-auto my-2"><code class="text-sm">$1</code></pre>'
    )

    // Format regular code blocks
    cleanedContent = cleanedContent.replace(
        /```\n([\s\S]*?)\n```/g,
        '<pre class="bg-muted p-3 rounded-md overflow-x-auto my-2"><code class="text-sm">$1</code></pre>'
    )

    // Format inline code
    cleanedContent = cleanedContent.replace(
        /`([^`]+)`/g,
        '<code class="bg-muted px-1 py-0.5 rounded text-xs">$1</code>'
    )

    // Format bold text (**text**)
    cleanedContent = cleanedContent.replace(
        /\*\*([^*]+)\*\*/g,
        '<strong class="font-semibold">$1</strong>'
    )

    // Enhanced bullet point and structured data formatting
    // Handle various patterns like "**Field**: Value" and "* **Field**: Value"
    cleanedContent = cleanedContent.replace(
        /(\*?\s*\*\*([^*:]+):\*\*\s*([^\n]+))/g,
        '<div class="my-1"><strong class="font-semibold">$2:</strong> $3</div>'
    )

    // Convert bullet points (*) to proper HTML list items
    const paragraphs = cleanedContent.split('\n\n')
    const processedParagraphs = paragraphs.map(paragraph => {
        const lines = paragraph.split('\n')
        const processedLines = lines.map(line => {
            const trimmedLine = line.trim()

            // Skip lines that are already formatted as structured data
            if (trimmedLine.includes('<strong class="font-semibold">') && trimmedLine.includes('</strong>')) {
                return trimmedLine
            }

            // Check if line starts with * (bullet point)
            if (trimmedLine.startsWith('*')) {
                // Remove the * and any extra spaces, then wrap in <li>
                const content = trimmedLine.replace(/^\*\s*/, '').trim()
                return `<li class="ml-4 mb-1">${content}</li>`
            }
            return line
        })

        // Check if this paragraph contains list items
        const hasListItems = processedLines.some(line => line.includes('<li'))
        if (hasListItems) {
            // Wrap list items in <ul>
            const listItems = processedLines.filter(line => line.includes('<li'))
            const nonListItems = processedLines.filter(line => !line.includes('<li'))

            let result = nonListItems.join('<br>')
            if (listItems.length > 0) {
                if (result) result += '<br>'
                result += `<ul class="list-disc list-inside space-y-1 my-2">${listItems.join('')}</ul>`
            }
            return result
        }

        return processedLines.join('<br>')
    })

    cleanedContent = processedParagraphs.join('<br><br>')

    // Convert remaining line breaks to HTML
    cleanedContent = cleanedContent.replace(/\n/g, '<br>')

    return cleanedContent
}

// Scroll to bottom of chat
const scrollToBottom = () => {
    const scrollArea = document.querySelector('[data-radix-scroll-area-viewport]')
    if (scrollArea) {
        scrollArea.scrollTop = scrollArea.scrollHeight
    }
}

// Handle Enter key press
const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        sendMessage()
    }
}

// Start session when component mounts
onMounted(() => {
    startSession()
})
</script>

<template>
    <div class="h-full flex flex-col">
        <div class="flex gap-4 flex-1 min-h-0 max-h-full">
            <!-- Main chat area -->
            <div class="flex flex-col gap-2 flex-1">
                <div class="flex-shrink-0">
                    <h1 class="text-xl font-semibold mb-4">Chat Overview</h1>
                    <p class="text-sm text-muted-foreground">Connected to Google Cloud Agent</p>
                    <div class="flex items-center gap-2 mt-2">
                        <div class="w-2 h-2 rounded-full" :class="sessionStarted ? 'bg-green-500' : 'bg-red-500'"></div>
                        <span class="text-xs text-muted-foreground">
                            {{ sessionStarted ? 'Session Active' : 'Connecting...' }}
                        </span>
                    </div>
                </div>

                <!-- Scrollable chat area -->
                <div class="flex-1 min-h-0 overflow-hidden" id="chatArea" style="height: 0;">
                    <ScrollArea class="w-full h-full rounded-md border overflow-hidden">
                        <div class="p-2 md:p-4 space-y-4 max-h-85">
                            <div v-for="chat in chats" :key="chat.id" class="flex pb-2"
                                :class="chat.role === 'user' ? 'justify-end' : 'justify-start'">
                                <div class="max-w-[85%] md:max-w-[70%] rounded-lg px-3 py-2 text-sm" :class="chat.role === 'user'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-background border border-border text-foreground'">
                                    <div class="mb-1 text-[10px] uppercase tracking-wide opacity-70">
                                        {{ chat.role === 'user' ? 'You' : 'Agent' }}
                                        <span v-if="chat.timestamp" class="ml-2 opacity-50">
                                            {{ chat.timestamp.toLocaleTimeString() }}
                                        </span>
                                    </div>
                                    <div class="whitespace-pre-wrap break-words"
                                        v-html="formatMessageContent(chat.content)"></div>
                                </div>
                            </div>

                            <!-- Loading indicator -->
                            <div v-if="isLoading && !sessionStarted" class="flex justify-center">
                                <div class="text-sm text-muted-foreground">Starting session...</div>
                            </div>

                            <!-- Loading skeleton for streaming responses -->
                            <div v-if="isLoading && sessionStarted" class="flex justify-start pb-2">
                                <div
                                    class="max-w-[85%] md:max-w-[70%] rounded-lg px-3 py-2 text-sm bg-background border border-border">
                                    <div class="mb-1 text-[10px] uppercase tracking-wide opacity-70">
                                        Agent
                                        <span class="ml-2 opacity-50">{{ new Date().toLocaleTimeString() }}</span>
                                    </div>
                                    <div class="space-y-2">
                                        <div class="h-4 bg-muted rounded animate-pulse"></div>
                                        <div class="h-4 bg-muted rounded animate-pulse w-3/4"></div>
                                        <div class="h-4 bg-muted rounded animate-pulse w-1/2"></div>
                                        <div class="h-4 bg-muted rounded animate-pulse w-5/6"></div>
                                        <div class="h-4 bg-muted rounded animate-pulse w-2/3"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ScrollArea>
                </div>

                <!-- Input area -->
                <div class="flex-shrink-0 grid w-full gap-2">
                    <Textarea v-model="userInput" placeholder="Type your message here..."
                        :disabled="!sessionStarted || isLoading" @keydown="handleKeyDown" />
                    <Button @click="sendMessage" :disabled="!userInput.trim() || !sessionStarted || isLoading"
                        class="w-full">
                        {{ isLoading ? 'Sending...' : 'Send Message' }}
                    </Button>
                </div>
            </div>
        </div>
    </div>
</template>
