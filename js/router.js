import { createRouter, createWebHashHistory } from 'vue-router'
import { ref } from 'vue'
import App from './components/App.js'

const router = createRouter({
    history: createWebHashHistory(),
    routes: [
        {
            path: '/:page?',  // página opcional, por defecto será 'index'
            component: App,
            props: true
        }
    ]
})

export default router