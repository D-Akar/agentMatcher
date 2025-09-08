// Google Maps API type declarations
declare global {
    interface Window {
        google: typeof google;
        AdvancedMarkerElement: any;
        Marker: any;
    }
}

declare namespace google {
    namespace maps {
        class Map {
            constructor(mapDiv: HTMLElement, opts?: MapOptions);
            fitBounds(bounds: LatLngBounds): void;
        }

        interface MapOptions {
            zoom?: number;
            center?: LatLng | LatLngLiteral;
            mapId?: string;
        }

        interface LatLng {
            lat(): number;
            lng(): number;
        }

        interface LatLngLiteral {
            lat: number;
            lng: number;
        }

        class LatLngBounds {
            extend(point: LatLng | LatLngLiteral): void;
        }

        class InfoWindow {
            constructor(opts?: InfoWindowOptions);
            open(map?: Map, anchor?: any): void;
        }

        interface InfoWindowOptions {
            content?: string | HTMLElement;
        }

        namespace marker {
            class AdvancedMarkerElement {
                constructor(opts?: AdvancedMarkerElementOptions);
                map: Map | null;
                position: LatLngLiteral | null;
                addListener(eventName: string, handler: Function): void;
            }

            interface AdvancedMarkerElementOptions {
                map?: Map;
                position?: LatLngLiteral;
                title?: string;
                content?: HTMLElement;
            }
        }

        interface MapsLibrary {
            Map: typeof Map;
        }

        interface MarkerLibrary {
            AdvancedMarkerElement: typeof marker.AdvancedMarkerElement;
        }

        function importLibrary(libraryName: string): Promise<any>;
    }
}

export { };
