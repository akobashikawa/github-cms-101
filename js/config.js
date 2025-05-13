const config = {
    pagesBaseUrl: 'https://raw.githubusercontent.com/akobashikawa/github-cms-101/refs/heads/master/pages',
    github: {
        owner: 'akobashikawa',
        repo: 'github-cms-101',
        token: '', // Se llenará desde localStorage
        branch: 'master'
    }
};

// Intenta recuperar el token de localStorage
const storedToken = localStorage.getItem('github_token');
if (storedToken) {
    config.github.token = storedToken;
}

export default config;