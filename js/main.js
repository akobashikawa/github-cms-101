import { createApp } from 'vue'
import router from './router.js'
import App from './components/App.js'

const app = createApp(App)
app.use(router)
app.mount('#app')