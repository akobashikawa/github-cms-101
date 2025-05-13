import { marked } from 'marked';

// Create a new renderer
const renderer = {
    link(href, title, text) {
        // Handle case where href is an object
        if (typeof href === 'object' && href.href) {
            title = href.title;
            text = href.text;
            href = href.href;
        }

        // Handle undefined or invalid href
        if (!href || typeof href !== 'string') {
            console.log('Invalid href:', { href, title, text });
            return text;
        }

        try {
            // If internal link (doesn't start with http or mailto)
            if (!/^(http|mailto)/.test(href)) {
                // Remove .md extension if exists
                href = href.replace(/\.md$/, '');
                // Convert to router format
                href = '#/' + href.replace(/^\/+/, '');
            }
            
            // Add target="_blank" for external links
            const target = /^(http|mailto)/.test(href) ? ' target="_blank"' : '';
            
            // Render link
            return `<a href="${href}"${title ? ` title="${title}"` : ''}${target}>${text || href}</a>`;
        } catch (error) {
            console.error('Error processing link:', { href, title, text }, error);
            return text || href;
        }
    }
};

// Configure marked with our custom renderer
marked.use({ renderer });

export { marked };