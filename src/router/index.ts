import { createRouter, createWebHistory } from 'vue-router'

import Dashboard from '@/pages/Dashboard.vue'
import Prompting from '@/pages/Prompting.vue'
import ChatOverview from '@/pages/ChatOverview.vue'
import LeadDetail from '@/pages/LeadDetail.vue'
import LeadsOverview from '@/pages/LeadsOverview.vue'

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            component: Dashboard,
            children: [
                { path: '', redirect: '/prompting' },
                { path: 'prompting', name: 'Prompting', component: Prompting },
                { path: 'chat', name: 'ChatOverview', component: ChatOverview },
                { path: 'leads-overview', name: 'LeadsOverview', component: LeadsOverview },
                { path: 'leads/:slug', name: 'LeadDetail', component: LeadDetail },
            ],
        },
    ],
})

export default router


