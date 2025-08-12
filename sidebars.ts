import type { SidebarsConfig } from '@docusaurus/plugin-content-docs'

const sidebars: SidebarsConfig = {
	tutorialSidebar: [
		'index',
		{
			type: 'category',
			label: '⭐ Quickstart Guide',
			link: { type: 'doc', id: 'quickstart/index' },
			items: [
				{
					type: 'doc',
					id: 'quickstart/creating-messages',
					label: 'Creating a SIWE Message',
				},
				{
					type: 'doc',
					id: 'quickstart/frontend-setup',
					label: 'Frontend Setup',
				},
				{
					type: 'doc',
					id: 'quickstart/backend-verification',
					label: 'Backend Verification',
				},
				{
					type: 'doc',
					id: 'quickstart/connect-the-frontend',
					label: 'Connect the Frontend',
				},
				{
					type: 'doc',
					id: 'quickstart/implement-sessions',
					label: 'Implement Sessions',
				},
				{
					type: 'doc',
					id: 'quickstart/resolve-ens-profiles',
					label: 'Resolve ENS Profiles',
				},
				{
					type: 'doc',
					id: 'quickstart/resolve-nft-holdings',
					label: 'Resolve NFT Holdings',
				},
			],
		},
		{
			type: 'category',
			label: '💻 Languages',
			collapsed: false,
			link: { type: 'doc', id: 'languages/index' },
			items: [
				{
					type: 'category',
					label: '⌨️ TypeScript',
					link: { type: 'doc', id: 'languages/typescript' },
					items: [
						'languages/typescript/migrating-to-v2',
						'languages/typescript/typescript-quickstart',
					],
				},
				'languages/rust',
				'languages/elixir',
				'languages/python',
				{
					type: 'category',
					label: '💎 Ruby',
					link: { type: 'doc', id: 'languages/ruby' },
					items: ['languages/ruby/rails'],
				},
				'languages/go',
			],
		},
		{
			type: 'category',
			label: '🔌 Integrations',
			link: { type: 'doc', id: 'integrations/index' },
			items: [
				'integrations/discourse',
				'integrations/nextauth.js',
				'integrations/auth0',
			],
		},
		{
			type: 'category',
			label: '🔐 OIDC Provider',
			link: { type: 'doc', id: 'oidc-provider/index' },
			items: [
				'oidc-provider/deployment-guide',
				'oidc-provider/hosted-oidc-provider',
			],
		},

		'security-considerations',
		{
			type: 'category',
			collapsed: false,
			label: '📘 General Information',
			link: { type: 'doc', id: 'general-information/overview' },
			items: [
				'general-information/overview',
				'general-information/eip-4361-specification',
				'general-information/related-standards',
			],
		},
	],
}

export default sidebars
