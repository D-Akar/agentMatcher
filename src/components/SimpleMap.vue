<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { leads, addLead } from '@/stores/leads'

const mapContainer = ref<HTMLElement>()
let map: any = null
let markers: any[] = []

// Filter leads with coordinates
const leadsWithCoordinates = computed(() =>
    leads.filter(lead => lead.coordinates && lead.coordinates.length === 2)
)

// Calculate center point for the map
const mapCenter = computed(() => {
    if (leadsWithCoordinates.value.length === 0) {
        return { lat: 40.7128, lng: -74.0060 } // Default to NYC
    }

    const avgLat = leadsWithCoordinates.value.reduce((sum, lead) => sum + lead.coordinates![0], 0) / leadsWithCoordinates.value.length
    const avgLng = leadsWithCoordinates.value.reduce((sum, lead) => sum + lead.coordinates![1], 0) / leadsWithCoordinates.value.length

    return { lat: avgLat, lng: avgLng }
})

// Initialize the map - following the reference pattern
async function initMap(): Promise<void> {
    if (!mapContainer.value) {
        console.log('Map container not found')
        return
    }

    console.log('Initializing map...')
    console.log('Leads with coordinates:', leadsWithCoordinates.value.length)

    try {
        // Load Google Maps API if not already loaded
        if (!window.google || !window.google.maps) {
            console.log('Loading Google Maps API...')
            await loadGoogleMapsAPI()
        }

        // Request needed libraries - following reference pattern
        // @ts-ignore
        const { Map } = await google.maps.importLibrary("maps") as google.maps.MapsLibrary
        // @ts-ignore
        const { AdvancedMarkerElement, Marker } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary

        const center = mapCenter.value
        console.log('Map center:', center)

        // Try to create map with Map ID first, fallback to regular map
        try {
            map = new Map(mapContainer.value, {
                zoom: leadsWithCoordinates.value.length > 1 ? 10 : 15,
                center: center,
                mapId: 'DEMO_MAP_ID', // Required for AdvancedMarkerElement
            })
            console.log('Map created successfully with Map ID')
            window.AdvancedMarkerElement = AdvancedMarkerElement
        } catch (error) {
            console.log('Failed to create map with Map ID, trying without:', error)
            map = new Map(mapContainer.value, {
                zoom: leadsWithCoordinates.value.length > 1 ? 10 : 15,
                center: center,
            })
            console.log('Map created successfully without Map ID')
            window.Marker = Marker
        }

        // Add markers for leads
        updateMarkers()
    } catch (error) {
        console.error('Error initializing map:', error)
    }
}

// Load Google Maps API
async function loadGoogleMapsAPI(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const script = document.createElement('script')
        script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=marker&v=weekly`
        script.async = true
        script.defer = true
        script.onload = () => resolve()
        script.onerror = () => reject(new Error('Google Maps API could not load'))
        document.head.appendChild(script)
    })
}

// Update markers on the map
function updateMarkers() {
    if (!map) {
        console.log('Map not available for markers')
        return
    }

    console.log('Updating markers for', leadsWithCoordinates.value.length, 'leads')

    // Clear existing markers
    markers.forEach(marker => marker.map = null)
    markers = []

    // Add new markers for each lead
    leadsWithCoordinates.value.forEach(lead => {
        const [lat, lng] = lead.coordinates!

        // Create info window content
        const infoContent = `
            <div class="p-2">
                <h3 class="font-semibold text-gray-900">${lead.name}</h3>
                <p class="text-sm text-gray-600">Stage ${lead.stage || 1}</p>
                ${lead.address ? `<p class="text-sm text-gray-500">${lead.address}</p>` : ''}
                ${lead.outreachMethod ? `<p class="text-sm text-blue-600">${lead.outreachMethod === 'email' ? '📧 Email' : '📞 Call'}</p>` : ''}
            </div>
        `

        // Create info window
        // @ts-ignore
        const infoWindow = new google.maps.InfoWindow({
            content: infoContent
        })

        // Create marker - try AdvancedMarkerElement first, fallback to regular Marker
        let marker
        if (window.AdvancedMarkerElement) {
            // Create marker element with lead info
            const markerElement = document.createElement('div')
            markerElement.className = 'marker-element'
            markerElement.innerHTML = `
                <div class="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg cursor-pointer hover:bg-red-600 transition-colors">
                    ${lead.name.charAt(0).toUpperCase()}
                </div>
            `

            // Create marker using AdvancedMarkerElement
            marker = new window.AdvancedMarkerElement({
                map: map,
                position: { lat, lng },
                title: lead.name,
                content: markerElement
            })
        } else {
            // Fallback to regular Marker
            marker = new window.Marker({
                map: map,
                position: { lat, lng },
                title: lead.name,
                label: lead.name.charAt(0).toUpperCase(),
                icon: {
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                        <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="16" cy="16" r="14" fill="#ef4444" stroke="#fff" stroke-width="2"/>
                            <text x="16" y="20" text-anchor="middle" fill="white" font-family="Arial" font-size="12" font-weight="bold">${lead.name.charAt(0).toUpperCase()}</text>
                        </svg>
                    `),
                    // @ts-ignore
                    scaledSize: new google.maps.Size(32, 32)
                }
            })
        }

        // Add click listener
        marker.addListener('click', () => {
            infoWindow.open(map, marker)
        })

        markers.push(marker)
    })

    // Fit map to show all markers if there are multiple
    if (markers.length > 1) {
        // @ts-ignore
        const bounds = new google.maps.LatLngBounds()
        markers.forEach(marker => {
            // Handle both AdvancedMarkerElement and regular Marker
            const position = marker.position || marker.getPosition()
            bounds.extend(position)
        })
        map.fitBounds(bounds)
    }
}

// Watch for changes in leads
watch(leadsWithCoordinates, () => {
    if (map) {
        updateMarkers()
    }
}, { deep: true })

onMounted(() => {
    // Add a test lead for debugging
    if (leads.length === 0) {
        console.log('Adding test lead for debugging')
        addLead({
            id: 'test-lead',
            name: 'Test Business',
            coordinates: [40.7128, -74.0060], // NYC coordinates
            address: 'New York, NY'
        })
    }

    // Add a small delay to ensure DOM is ready
    setTimeout(() => {
        console.log('Map container dimensions:', {
            width: mapContainer.value?.offsetWidth,
            height: mapContainer.value?.offsetHeight
        })
        initMap()
    }, 100)
})

onUnmounted(() => {
    if (map) {
        markers.forEach(marker => marker.map = null)
        markers = []
        map = null
    }
})
</script>

<template>
    <div class="w-full h-full bg-gray-100 rounded-lg overflow-hidden">
        <div ref="mapContainer" class="w-full h-full relative" style="min-height: 400px;">
            <div v-if="leadsWithCoordinates.length === 0"
                class="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg z-10">
                <p class="text-sm font-medium text-gray-700">No leads with location data</p>
                <p class="text-xs text-gray-500">Add coordinates to your leads to see them on the map</p>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Ensure the map container takes full space */
.marker-element {
    display: flex;
    align-items: center;
    justify-content: center;
}

/* Ensure map container is visible */
div[ref="mapContainer"] {
    background-color: #f3f4f6;
    border: 2px solid #e5e7eb;
}

/* Debug: Make sure the container is visible */
div[ref="mapContainer"]:empty::before {
    content: "Map container is empty - waiting for Google Maps...";
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #6b7280;
    font-size: 14px;
}
</style>
