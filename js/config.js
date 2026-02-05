const config = {
    pagesBaseUrl: 'https://raw.githubusercontent.com/akobashikawa/github-cms-101/refs/heads/master/pages',
    github: {
        owner: 'akobashikawa',
        repo: 'github-cms-101',
        token: '', // Se llenará desde localStorage
        branch: 'master',
        // OAuth Device Flow settings
        // Registra una OAuth App en https://github.com/settings/developers
        // Selecciona "Device Flow" como tipo de aplicación
        oauthClientId: 'Ov23lidXuxp5WrhScyKK', // Tu OAuth Client ID aquí
        oauthScopes: 'repo'
    }
};

// Intenta recuperar el token de localStorage
const storedToken = localStorage.getItem('github_token');
if (storedToken) {
    console.log(`storedToken`, storedToken);
    config.github.token = storedToken;
}

export default config;