import { ref, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';
import { marked } from '../marked-config.js';  // Cambiamos el import
import config from '../config.js';

const App = {
    template: `
    <div class="container">
        <nav>
            <router-link to="/">Home</router-link> &nbsp;|&nbsp;
            <router-link to="/about">About</router-link>
            <span v-if="!config.github.token">
                | <a href="#" @click.prevent="setupToken">Setup Token</a>
            </span>
        </nav>

        <div v-if="!showEditForm">
            <div v-html="content"></div>
            <div v-if="config.github.token" class="mt-2">
                <button @click="editContent" class="btn">Edit</button>
            </div>
        </div>
        
        <div v-else class="edit-form">
            <h2>Edit Page: {{currentPage}}</h2>
            <textarea v-model="newContent" rows="10" class="form-control" placeholder="Enter markdown content..."></textarea>
            <div class="mt-2">
                <button @click="saveContent" class="btn">Save</button>
                <button @click="cancelEdit" class="btn">Cancel</button>
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
        const showEditForm = ref(false);
        const newContent = ref('');
        const currentPage = ref('');
        const rawContent = ref(''); // Para guardar el contenido markdown sin procesar
        
        const loadPage = async (pageName) => {
            currentPage.value = pageName || 'index';
            try {
                const response = await axios.get(`${config.pagesBaseUrl}/${currentPage.value}.md`);
                rawContent.value = response.data; // Guardamos el contenido sin procesar
                content.value = marked(response.data);  // Usa marked con la configuración personalizada
                showEditForm.value = false;
            } catch (error) {
                if (error.response && error.response.status === 404) {
                    showEditForm.value = true;
                    newContent.value = '';
                    rawContent.value = '';
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
                let sha = '';

                // Intentar obtener el sha del archivo si existe
                try {
                    const fileResponse = await axios.get(
                        `https://api.github.com/repos/${config.github.owner}/${config.github.repo}/contents/pages/${currentPage.value}.md`,
                        {
                            headers: { 
                                'Authorization': `token ${config.github.token}`,
                                'Accept': 'application/vnd.github.v3+json'
                            }
                        }
                    );
                    sha = fileResponse.data.sha;
                } catch (error) {
                    // El archivo no existe, es una creación nueva
                    console.log('Creating new file');
                }

                // Preparar el payload para la actualización
                const payload = {
                    message: `Add/Update ${currentPage.value}.md`,
                    content: base64Content,
                    branch: config.github.branch
                };

                // Agregar sha solo si existe (actualización)
                if (sha) {
                    payload.sha = sha;
                }
                        
                // Commit a la rama principal
                await axios.put(
                    `https://api.github.com/repos/${config.github.owner}/${config.github.repo}/contents/pages/${currentPage.value}.md`,
                    payload,
                    {
                        headers: { 
                            'Authorization': `token ${config.github.token}`,
                            'Accept': 'application/vnd.github.v3+json'
                        }
                    }
                );

                content.value = marked(newContent.value);
                showEditForm.value = false;
                
            } catch (error) {
                console.error('Error saving content:', error);
                alert('Error saving content');
            }
        };

        const editContent = () => {
            newContent.value = rawContent.value;
            showEditForm.value = true;
        };

        const cancelEdit = () => {
            showEditForm.value = false;
            newContent.value = '';
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
            showEditForm,
            newContent,
            currentPage,
            config,
            setupToken,
            saveContent,
            editContent,
            cancelEdit
        }
    },
};

export default App;