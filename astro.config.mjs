import { defineConfig } from 'astro/config';
export default defineConfig({
  site: 'https://www.ralcompanies.com',
  trailingSlash: 'always',
  build: { format: 'directory' },
  image: { responsiveStyles: false },
});
