import { themes as prismThemes } from 'prism-react-renderer'
import type { Config } from '@docusaurus/types'
import type * as Preset from '@docusaurus/preset-classic'

const config: Config = {
	title: 'Sign in with Ethereum',
	tagline: 'Decentralized authentication for Web3 applications',
	favicon: 'img/favicon.ico',

	future: {
		v4: true,
	},

	url: 'https://siwe-docs.example.com',
	baseUrl: '/',

	organizationName: 'siwe',
	projectName: 'siwe-docs',

	onBrokenLinks: 'throw',
	onBrokenMarkdownLinks: 'warn',

	i18n: {
		defaultLocale: 'en',
		locales: ['en'],
	},

	presets: [
		[
			'classic',
			{
				docs: {
					sidebarPath: './sidebars.ts',
					routeBasePath: '/',
					editUrl: 'https://github.com/siwe/siwe-docs/tree/main/',
				},
				blog: false,
				theme: {
					customCss: './src/css/custom.css',
				},
			} satisfies Preset.Options,
		],
	],

	clientModules: [require.resolve('./src/components/pageActionsGlobal.js')],

	themeConfig: {
		image: 'img/siwe-social-card.jpg',
		navbar: {
			title: 'Sign in with Ethereum',
			logo: {
				alt: 'SIWE Logo',
				src: 'img/logo.svg',
			},
			items: [
				{
					type: 'docSidebar',
					sidebarId: 'tutorialSidebar',
					position: 'left',
					label: 'Documentation',
				},
				{
					href: 'https://github.com/signinwithethereum/siwe',
					label: 'GitHub',
					position: 'right',
				},
			],
		},
		footer: {
			style: 'dark',
			links: [
				{
					title: 'Documentation',
					items: [
						{
							label: 'Getting Started',
							to: '/',
						},
						{
							label: 'Quickstart Guide',
							to: '/quickstart',
						},
						{
							label: 'EIP-4361 Specification',
							to: '/general-information/eip-4361-specification',
						},
					],
				},
				{
					title: 'Community',
					items: [
						{
							label: 'Discord',
							href: 'https://discord.gg/siwe',
						},
						{
							label: 'Twitter',
							href: 'https://twitter.com/signinwithethereum',
						},
						{
							label: 'Stack Overflow',
							href: 'https://stackoverflow.com/questions/tagged/sign-in-with-ethereum',
						},
					],
				},
				{
					title: 'Resources',
					items: [
						{
							label: 'GitHub',
							href: 'https://github.com/signinwithethereum/siwe',
						},
						{
							label: 'npm Package',
							href: 'https://www.npmjs.com/package/siwe',
						},
						{
							label: 'Security Best Practices',
							to: '/advanced/security-best-practices',
						},
					],
				},
			],
			copyright: `Copyright © ${new Date().getFullYear()} Sign in with Ethereum. Built with Docusaurus.`,
		},
		prism: {
			theme: prismThemes.github,
			darkTheme: prismThemes.dracula,
			additionalLanguages: ['solidity', 'rust', 'ruby', 'elixir'],
		},
	} satisfies Preset.ThemeConfig,
}

export default config
