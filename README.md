# GitHub CMS 101

A simple CMS (Content Management System) that uses GitHub's infrastructure for deployment and publishing.

## Features

- Uses GitHub as content backend
- No server required (static hosting)
- Markdown content
- Edit content directly from the web interface
- Authentication via GitHub token
- Vue.js single page application

## Technologies

- Vue.js 3
- Vue Router
- Marked (for Markdown parsing)
- Matcha CSS
- GitHub API

## Setup

### Option 1: OAuth Device Flow (Recommended)

1. Register a new OAuth App at [GitHub Developer Settings](https://github.com/settings/developers):
   - **Application name**: GitHub CMS
   - **Homepage URL**: `http://localhost:5500` (or your local server URL)
   - **Authorization callback URL**: Not required for Device Flow
   - **Device flow**: Enable this option
2. Copy the **Client ID** from your OAuth App settings
3. Open `js/config.js` and set your OAuth Client ID:
   ```javascript
oauthClientId: 'your-client-id-here',
   ```
4. Open `index.html` in a browser
5. Click "Login with GitHub" and follow the on-screen instructions

### Option 2: Manual PAT (Legacy)

1. Create a Fine-grained Personal Access Token in GitHub with:
   - Repository access: Select this repository
   - Permissions: Read and write access to content
2. Open `index.html` in a browser
3. Click "Setup Token" and enter your token

## Usage

- Navigate using the menu links
- Click "Login with GitHub" to authenticate
- Click "Edit" to modify content (requires authentication)
- Content is saved as Markdown files in the `pages/` directory
- All changes are committed directly to the repository
- Click "Logout" to clear your authentication

## Development

```bash
git clone https://github.com/akobashikawa/github-cms-101.git
cd github-cms-101
```

## License

MIT
