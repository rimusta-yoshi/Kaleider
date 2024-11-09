import { defineConfig } from 'vite';
import glsl from 'vite-plugin-glsl';

export default defineConfig({
  base: '/Kaleider/',
  plugins: [glsl()]
});