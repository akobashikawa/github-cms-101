import { ref, useTemplateRef, onMounted, watch, nextTick } from 'vue';
import axios from 'axios';
import config from '../config.js';

const App = {
    components: {
    },

    template: `
    <div class="container">
        <h1>GitHub CMS</h1>

        <div v-html="content"></div>

        <footer>
            <em><a href="https://github.com/akobashikawa/github-cms-101" target="_blank">@GitHub></a></em>
        </footer>
    </div>
    `,

    setup() {
        const content = ref('');
        
        onMounted(async () => {
            try {
                const response = await axios.get(`${config.pagesBaseUrl}/index.md`);
                content.value = response.data;
            } catch (error) {
                console.error('Error loading content:', error);
                content.value = 'Error loading content';
            }
        });

        return {
            content
        }
    },
};

export default App;