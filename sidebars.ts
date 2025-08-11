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
			link: { type: 'doc', id: 'libraries/index' },
			items: [
				{
					type: 'category',
					label: '⌨️ TypeScript',
					link: { type: 'doc', id: 'libraries/typescript' },
					items: [
						'libraries/typescript/migrating-to-v2',
						'libraries/typescript/typescript-quickstart',
					],
				},
				'libraries/rust',
				'libraries/elixir',
				'libraries/python',
				{
					type: 'category',
					label: '💎 Ruby',
					link: { type: 'doc', id: 'libraries/ruby' },
					items: ['libraries/ruby/rails'],
				},
				'libraries/go',
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
