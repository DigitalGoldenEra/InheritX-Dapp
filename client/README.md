## InheritX dApp Landing Page

InheritX is a next-generation inheritance planning dApp that guides wealth transfers to beneficiaries with clarity, automation, and security. This repository contains the marketing landing page that introduces the product, highlights its benefits, and invites users to connect their wallet or contact support.

---

## Tech Stack

| Layer     | Details                                                                  |
| --------- | ------------------------------------------------------------------------ |
| Framework | [Next.js 16 (App Router)](https://nextjs.org/)                           |
| Language  | [TypeScript 5](https://www.typescriptlang.org/)                          |
| Styling   | [Tailwind CSS v4 (experimental `@import` API)](https://tailwindcss.com/) |
| Icons     | [react-icons 5](https://react-icons.github.io/react-icons/)              |

---

## Project Structure

- `app/page.tsx` – Fully composed landing page with semantic sections and decorative layers.
- `app/globals.css` – Global styles, base colors, and typography.
- `public/img/logo.svg` – InheritX logo rendered inside the navigation and footer.

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

> **Note:** If installation fails because of blocked network access, run the command once you regain connectivity. The landing page requires `react-icons` in addition to the default Next.js packages.

### 2. Start the development server

```bash
npm run dev
```

Visit `http://localhost:3000` to preview the landing page. The server provides hot reloading for changes inside the `app` directory.

---

## Available Scripts

| Script          | Purpose                                           |
| --------------- | ------------------------------------------------- |
| `npm run dev`   | Starts the dev server on `http://localhost:3000`. |
| `npm run build` | Generates an optimized production build.          |
| `npm run start` | Serves the production build locally.              |
| `npm run lint`  | Runs ESLint with the Next.js configuration.       |

---

## Environment

No environment variables are required for the marketing page. If you connect this UI to on-chain functionality later, consider adding environment variable support via `.env.local`.

---

## Testing & Quality

- _Automated tests_: Not included yet. Add unit tests (Jest/React Testing Library) when you integrate interactive flows.
- _Manual_: After running `npm run dev`, confirm responsive behavior across breakpoints (mobile ≥320px, tablets ≥768px, desktops ≥1280px).
- _Linting_: Run `npm run lint` before committing to surface TypeScript and accessibility suggestions.

---

## Deployment

1. Run `npm run build` to create the optimized bundle.
2. Deploy the `.next` output to any Node-compatible hosting (Vercel, Netlify, AWS Amplify, etc.).
3. Ensure the project is served with HTTPS to protect wallet connections when those are implemented.

---

## Known Limitations & Future Enhancements

- Wallet connection buttons are placeholders; integrate with your preferred web3 provider (e.g., WalletConnect, RainbowKit) once backend contracts are ready.
- All copy is static. For marketing teams, consider connecting a CMS (Sanity, Contentful, Hygraph) to manage content updates.
- Decorative gradients are implemented in CSS; replace with bespoke illustrations if design assets become available.
- Accessibility improvements such as keyboard focus styles and reduced-motion variants can be added in future iterations.

---

## Contributing

1. Fork and clone the repository.
2. Create a feature branch (`git checkout -b feature/my-change`).
3. Run `npm run lint` and ensure the page builds (`npm run build`).
4. Submit a descriptive pull request summarizing user-facing changes.

---

## Support

Questions, feedback, or design requests? Contact the product team or open an issue in this repository. Continuous iteration keeps the InheritX experience sharp for every family. 💙
