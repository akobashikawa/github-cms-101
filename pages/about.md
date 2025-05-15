# Acerca de GitHub CMS

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

1. Clone this repository
2. Create a Fine-grained Personal Access Token in GitHub with:
   - Repository access: Select this repository
   - Permissions: Read and write access to content
3. Open `index.html` in a browser
4. Click "Setup Token" and enter your token

## Usage

- Navigate using the menu links
- Click "Edit" to modify content (requires token)
- Content is saved as Markdown files in the `pages/` directory
- All changes are committed directly to the repository

## Development

```bash
git clone https://github.com/akobashikawa/github-cms-101.git
cd github-cms-101
```

## License

MIT


Github: [akobashikawa/github-cms-101: Idea de CMS usando github](https://github.com/akobashikawa/github-cms-101)
