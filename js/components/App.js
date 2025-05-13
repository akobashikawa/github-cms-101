import { ref, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';
import { marked } from '../marked-config.js';  // Cambiamos el import
import config from '../config.js';

const App = {
    template: `
    <div class="container">
        <nav>
            <router-link to="/">Home</router-link> |
            <router-link to="/about">About</router-link>
            <span v-if="!config.github.token">
                | <a href="#" @click.prevent="setupToken">Setup Token</a>
            </span>
        </nav>

        <div v-if="!showCreateForm" v-html="content"></div>
        
        <div v-else class="create-form">
            <h2>Create New Page: {{currentPage}}</h2>
            <textarea v-model="newContent" rows="10" class="form-control" placeholder="Enter markdown content..."></textarea>
            <div class="mt-2">
                <button @click="saveContent" class="btn">Save</button>
                <button @click="cancelCreate" class="btn">Cancel</button>
            </div>
        </div>

        <footer>
            <em><a href="https://github.com/akobashikawa/github-cms-101" target="_blank">@GitHub</a></em>
        </footer>
    </div>
    `,

    setup() {
        const route = useRoute();
        const content = ref('');
        const showCreateForm = ref(false);
        const newContent = ref('');
        const currentPage = ref('');
        
        const loadPage = async (pageName) => {
            currentPage.value = pageName || 'index';
            try {
                const response = await axios.get(`${config.pagesBaseUrl}/${currentPage.value}.md`);
                content.value = marked(response.data);  // Usa marked con la configuración personalizada
                showCreateForm.value = false;
            } catch (error) {
                if (error.response && error.response.status === 404) {
                    showCreateForm.value = true;
                    newContent.value = '';
                } else {
                    console.error('Error loading content:', error);
                    content.value = 'Error loading content';
                }
            }
        };

        watch(
            () => route.params.page,
            (newPage) => {
                loadPage(newPage);
            },
            { immediate: true }
        );

        const saveContent = async () => {
            try {
                const base64Content = btoa(unescape(encodeURIComponent(newContent.value)));
                
                // Commit directo a la rama principal
                await axios.put(
                    `https://api.github.com/repos/${config.github.owner}/${config.github.repo}/contents/pages/${currentPage.value}.md`,
                    {
                        message: `Add/Update ${currentPage.value}.md`,
                        content: base64Content,
                        branch: config.github.branch
                    },
                    {
                        headers: { 
                            'Authorization': `token ${config.github.token}`,
                            'Accept': 'application/vnd.github.v3+json'
                        }
                    }
                );

                content.value = marked(newContent.value);
                showCreateForm.value = false;
                
            } catch (error) {
                console.error('Error saving content:', error);
                alert('Error saving content');
            }
        };

        const cancelCreate = () => {
            showCreateForm.value = false;
            content.value = 'Page not found';
        };

        const setupToken = () => {
            const token = prompt('Enter your GitHub Fine-grained Access Token:');
            if (token) {
                localStorage.setItem('github_token', token);
                config.github.token = token;
            }
        };

        onMounted(() => {
            loadPage('index');
        });

        return {
            content,
            showCreateForm,
            newContent,
            currentPage,
            config,
            setupToken,
            saveContent,
            cancelCreate
        }
    },
};

export default App;