import { ref, onMounted } from 'vue';
import axios from 'axios';
import { marked } from 'marked'; // Changed this line to use named import
import config from '../config.js';

const App = {
    components: {
    },

    template: `
    <div class="container">
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
                content.value = marked(response.data); // Parse markdown to HTML
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