<script setup lang="ts">
import { ref } from 'vue'
import type { LatLng, LatLngBounds, LatLngTuple } from 'leaflet'
import type { ViewChangedEvent } from 'vue-use-leaflet'
import { VMap, VMapOsmTileLayer, VMapZoomControl, VMapAttributionControl } from 'vue-map-ui';


const center = ref<LatLngTuple | LatLng>([47.41322, -1.219482])
const zoom = ref(13)
const bounds = ref<LatLngBounds | null>(null)

function onViewChanged(e: ViewChangedEvent) {
    center.value = e.center
    zoom.value = e.zoom
    bounds.value = e.bounds
}
</script>

<template>
    <div class="leads-map-container flex flex-col w-full h-full">
        <div class="flex-grow basis-full">
            <VMap :center="center" :zoom="zoom" @view-changed="onViewChanged" style="height: 400px;">
                <VMapOsmTileLayer />
                <VMapZoomControl />
                <VMapAttributionControl />
            </VMap>
        </div>
    </div>
</template>

<style scoped></style>
