import { createApp, h } from 'vue';
import App from "./components/App.js";

const app = createApp({
    render: () => h(App)
});

app.mount('#app');