import { themes as prismThemes } from 'prism-react-renderer'
import type { Config } from '@docusaurus/types'
import type * as Preset from '@docusaurus/preset-classic'

const config: Config = {
	title: 'Sign in with Ethereum',
	tagline: 'Open standard for authentication with Ethereum accounts.',
	favicon: 'img/favicon.ico',

	headTags: [
		{
			tagName: 'meta',
			attributes: {
				name: 'description',
				content: 'Open standard for authentication with Ethereum accounts.',
			},
		},
		{
			tagName: 'meta',
			attributes: {
				name: 'algolia-site-verification',
				content: 'D8806D3B9177E538',
			},
		},
	],

	future: {
		v4: true,
	},

	url: 'https://docs.siwe.xyz',
	baseUrl: '/',

	organizationName: 'siwe',
	projectName: 'docs',

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
					editUrl:
						'https://github.com/signinwithethereum/docs/tree/main/',
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
							href: 'https://eips.ethereum.org/EIPS/eip-4361',
						},
					],
				},
				{
					title: 'Community',
					items: [
						// {
						// 	label: 'Discord',
						// 	href: 'https://discord.gg/siwe',
						// },
						{
							label: 'Twitter',
							href: 'https://twitter.com/signinethereum',
						},
					],
				},
				{
					title: 'Resources',
					items: [
						{
							label: 'GitHub',
							href: 'https://github.com/signinwithethereum',
						},
						{
							label: 'npm Package',
							href: 'https://www.npmjs.com/package/siwe',
						},
						{
							label: 'Security Best Practices',
							to: '/security-considerations',
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
		algolia: {
			appId: 'XAFC9HX1ZS',
			apiKey: 'e369a9df2df2fd28c98f1b56452ff1ba',
			// apiKey: '0d1815cb49d708f7a6d50960e6f85528',
			indexName: 'SIWE Docs',
		},
	} satisfies Preset.ThemeConfig,
}

export default config
