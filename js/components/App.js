import { ref, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';
import { marked } from '../marked-config.js';
import config from '../config.js';

const App = {
    template: `
    <div class="container">
        <nav>
            <router-link to="/">Home</router-link> &nbsp;|&nbsp;
            <router-link to="/about">About</router-link>
            
            <span v-if="!isAuthenticated">
                | <a href="#" @click.prevent="loginWithGitHub">Login with GitHub</a>
            </span>
            <span v-else>
                | <a href="#" @click.prevent="logout">Logout</a>
            </span>
        </nav>

        <!-- OAuth Device Flow UI -->
        <div v-if="showOAuthFlow" class="oauth-flow">
            <h2>Login with GitHub</h2>
            <p>Please visit <a :href="verificationUri" target="_blank">{{ verificationUri }}</a> and enter the code:</p>
            <div class="code-display">{{ userCode }}</div>
            <p v-if="!accessToken" class="polling">Verifying...
                <span v-if="oauthError" class="error">{{ oauthError }}</span>
            </p>
            <p v-else class="success">Authentication successful! Loading content...</p>
        </div>

        <div v-else-if="!showEditForm">
            <div v-if="loading" class="loading">Loading...</div>
            <div v-else v-html="content"></div>
            <div v-if="isAuthenticated && !loading" class="mt-2">
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
        const rawContent = ref('');
        const loading = ref(false);
        
        // OAuth Device Flow state
        const showOAuthFlow = ref(false);
        const userCode = ref('');
        const verificationUri = ref('https://github.com/login/device');
        const deviceCode = ref('');
        const accessToken = ref('');
        const oauthError = ref('');
        const pollingInterval = ref(null);
        const retryPageName = ref(''); // Store page name to retry after OAuth

        // Computed property for authentication state
        const isAuthenticated = () => !!config.github.token;

        const loadPage = async (pageName) => {
            currentPage.value = pageName || 'index';
            loading.value = true;
            retryPageName.value = pageName || 'index';
            
            try {
                const response = await axios.get(
                    `https://api.github.com/repos/${config.github.owner}/${config.github.repo}/contents/pages/${currentPage.value}.md`,
                    {
                        headers: { 
                            'Authorization': `token ${config.github.token}`,
                            'Accept': 'application/vnd.github.v3+json'
                        }
                    }
                );
                
                // Decodificar correctamente el contenido base64
                const decodedContent = decodeURIComponent(escape(atob(response.data.content)));
                rawContent.value = decodedContent;
                content.value = marked(decodedContent);
                showEditForm.value = false;
            } catch (error) {
                if (error.response) {
                    const status = error.response.status;
                    
                    // Authentication errors - trigger OAuth flow
                    if (status === 401 || status === 403) {
                        console.log('Authentication failed, starting OAuth flow...');
                        loginWithGitHub();
                        return;
                    }
                    
                    // Page not found - show edit form to create new page
                    if (status === 404) {
                        showEditForm.value = true;
                        newContent.value = '';
                        rawContent.value = '';
                    } else {
                        console.error('Error loading content:', error);
                        content.value = 'Error loading content';
                    }
                } else {
                    console.error('Error loading content:', error);
                    content.value = 'Error loading content';
                }
            } finally {
                loading.value = false;
            }
        };

        watch(
            () => route.params.page,
            (newPage) => {
                loadPage(newPage);
            },
            { immediate: true }
        );

        // OAuth Device Flow Methods
        const loginWithGitHub = async () => {
            if (!config.github.oauthClientId) {
                alert('Please configure your OAuth Client ID in js/config.js');
                return;
            }
            
            try {
                // Step 1: Request device code
                const codeResponse = await axios.post(
                    'https://github.com/login/oauth/device/code',
                    new URLSearchParams({
                        client_id: config.github.oauthClientId,
                        scope: config.github.oauthScopes
                    }),
                    {
                        headers: { 'Accept': 'application/json' }
                    }
                );
                
                const { user_code, device_code, verification_uri, expires_in, interval } = codeResponse.data;
                
                userCode.value = user_code;
                verificationUri.value = verification_uri;
                deviceCode.value = device_code;
                showOAuthFlow.value = true;
                oauthError.value = '';
                
                // Step 2: Poll for access token
                startPolling(device_code, interval, expires_in);
                
            } catch (error) {
                console.error('Error starting OAuth flow:', error);
                oauthError.value = 'Failed to start authentication';
            }
        };

        const startPolling = (deviceCode, interval, expiresIn) => {
            const startTime = Date.now();
            const expiresAt = startTime + (expiresIn * 1000);
            
            pollingInterval.value = setInterval(async () => {
                // Check if expired
                if (Date.now() > expiresAt) {
                    stopPolling();
                    oauthError.value = 'Authentication timed out. Please try again.';
                    return;
                }
                
                try {
                    const tokenResponse = await axios.post(
                        'https://github.com/login/oauth/access_token',
                        new URLSearchParams({
                            client_id: config.github.oauthClientId,
                            device_code: deviceCode,
                            grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
                        }),
                        {
                            headers: { 'Accept': 'application/json' }
                        }
                    );
                    
                    const { access_token, error } = tokenResponse.data;
                    
                    if (access_token) {
                        stopPolling();
                        handleAuthSuccess(access_token);
                    } else if (error === 'authorization_pending') {
                        // Continue polling
                    } else if (error === 'slow_down') {
                        // Increase interval
                        clearInterval(pollingInterval.value);
                        const newInterval = interval * 2;
                        startPolling(deviceCode, newInterval, expiresIn);
                    } else {
                        stopPolling();
                        oauthError.value = error || 'Authentication failed';
                    }
                } catch (error) {
                    console.error('Polling error:', error);
                }
            }, (interval || 5) * 1000);
        };

        const stopPolling = () => {
            if (pollingInterval.value) {
                clearInterval(pollingInterval.value);
                pollingInterval.value = null;
            }
        };

        const handleAuthSuccess = (token) => {
            config.github.token = token;
            localStorage.setItem('github_token', token);
            accessToken.value = token;
            showOAuthFlow.value = false;
            
            // Retry loading the page after successful authentication
            loadPage(retryPageName.value);
        };

        const logout = () => {
            config.github.token = '';
            localStorage.removeItem('github_token');
            accessToken.value = '';
        };

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
                loadPage('index');
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
            isAuthenticated,
            showOAuthFlow,
            userCode,
            verificationUri,
            accessToken,
            oauthError,
            loading,
            loginWithGitHub,
            logout,
            saveContent,
            editContent,
            cancelEdit,
            setupToken
        }
    },
};

export default App;
