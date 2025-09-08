import { addLead } from '@/stores/leads'
import { Building2, Store, Factory } from 'lucide-vue-next'

// Add some sample leads with coordinates for testing
export function addSampleLeads() {
    // New York City businesses
    addLead({
        id: 'lead-1',
        name: 'Tech Startup NYC',
        url: 'https://example.com',
        icon: Building2,
        stage: 2,
        outreachMethod: 'email',
        address: '123 Broadway, New York, NY 10001',
        coordinates: [40.7589, -73.9851] // Times Square area
    })

    addLead({
        id: 'lead-2',
        name: 'Coffee Shop Brooklyn',
        url: 'https://example.com',
        icon: Store,
        stage: 1,
        outreachMethod: 'call',
        address: '456 Park Ave, Brooklyn, NY 11201',
        coordinates: [40.6892, -73.9442] // Brooklyn area
    })

    addLead({
        id: 'lead-3',
        name: 'Manufacturing Co',
        url: 'https://example.com',
        icon: Factory,
        stage: 3,
        outreachMethod: 'email',
        address: '789 Industrial Blvd, Queens, NY 11101',
        coordinates: [40.7282, -73.7949] // Queens area
    })

    // San Francisco businesses
    addLead({
        id: 'lead-4',
        name: 'SF Tech Company',
        url: 'https://example.com',
        icon: Building2,
        stage: 2,
        outreachMethod: 'email',
        address: '101 Market St, San Francisco, CA 94105',
        coordinates: [37.7749, -122.4194] // SF downtown
    })

    addLead({
        id: 'lead-5',
        name: 'Silicon Valley Startup',
        url: 'https://example.com',
        icon: Building2,
        stage: 1,
        outreachMethod: 'call',
        address: '200 Sand Hill Rd, Menlo Park, CA 94025',
        coordinates: [37.4419, -122.1430] // Palo Alto area
    })
}
