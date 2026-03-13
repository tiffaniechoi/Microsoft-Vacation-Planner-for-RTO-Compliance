import type { Config } from 'tailwindcss'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const config: Config = {
  content: [
    resolve(root, 'index.html'),
    resolve(root, 'src/**/*.{ts,tsx}'),
  ],
  theme: {
    extend: {
      colors: {
        'day-inoffice': '#0078D4',
        'day-inoffice-extra': '#005A9E',
        'day-wfh': '#F3F2F1',
        'day-vacation': '#D13438',
        'day-travel': '#8764B8',
        'chip-strong': '#107C10',
        'chip-borderline': '#FF8C00',
        'chip-weak': '#D13438',
      },
    },
  },
  plugins: [],
}

export default config
