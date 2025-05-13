import { ref, onMounted } from 'vue';
import axios from 'axios';
import { marked } from 'marked';
import config from '../config.js';

const App = {
    template: `
    <div class="container">
        <nav>
            <a href="#" @click.prevent="loadPage('index')">Home</a> |
            <a href="#" @click.prevent="loadPage('about')">About</a>
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
        const content = ref('');
        const showCreateForm = ref(false);
        const newContent = ref('');
        const currentPage = ref('');
        
        const loadPage = async (page) => {
            currentPage.value = page;
            try {
                const response = await axios.get(`${config.pagesBaseUrl}/${page}.md`);
                content.value = marked(response.data);
                showCreateForm.value = false;
            } catch (error) {
                console.error('Error loading content:', error);
                if (error.response && error.response.status === 404) {
                    showCreateForm.value = true;
                    newContent.value = '';
                } else {
                    content.value = 'Error loading content';
                }
            }
        };

        const saveContent = async () => {
            try {
                // 1. Crear una nueva rama
                const branchName = `page-${currentPage.value}-${Date.now()}`;
                const mainBranchRef = await axios.get(
                    `https://api.github.com/repos/${config.github.owner}/${config.github.repo}/git/refs/heads/${config.github.branch}`,
                    {
                        headers: { 'Authorization': `token ${config.github.token}` }
                    }
                );

                await axios.post(
                    `https://api.github.com/repos/${config.github.owner}/${config.github.repo}/git/refs`,
                    {
                        ref: `refs/heads/${branchName}`,
                        sha: mainBranchRef.data.object.sha
                    },
                    {
                        headers: { 'Authorization': `token ${config.github.token}` }
                    }
                );

                // 2. Crear/actualizar el archivo en la nueva rama
                const base64Content = btoa(unescape(encodeURIComponent(newContent.value))); // Changed variable name
                await axios.put(
                    `https://api.github.com/repos/${config.github.owner}/${config.github.repo}/contents/pages/${currentPage.value}.md`,
                    {
                        message: `Add/Update ${currentPage.value}.md`,
                        content: base64Content,
                        branch: branchName
                    },
                    {
                        headers: { 'Authorization': `token ${config.github.token}` }
                    }
                );

                // 3. Crear el Pull Request
                const pr = await axios.post(
                    `https://api.github.com/repos/${config.github.owner}/${config.github.repo}/pulls`,
                    {
                        title: `Add/Update page: ${currentPage.value}`,
                        body: 'Created via CMS',
                        head: branchName,
                        base: config.github.branch
                    },
                    {
                        headers: { 'Authorization': `token ${config.github.token}` }
                    }
                );

                showCreateForm.value = false;
                content.value = marked(newContent.value);
                alert(`Pull Request created: ${pr.data.html_url}`);
            } catch (error) {
                console.error('Error creating PR:', error);
                alert('Error creating Pull Request');
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
            loadPage,
            saveContent,
            cancelCreate,
            config,
            setupToken
        }
    },
};

export default App;