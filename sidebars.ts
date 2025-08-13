import type { SidebarsConfig } from '@docusaurus/plugin-content-docs'

const sidebars: SidebarsConfig = {
	tutorialSidebar: [
		{
			type: 'doc',
			id: 'index',
			label: '👋 Introduction',
		},
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
			],
		},
		{
			type: 'category',
			label: '💻 Libraries',
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
				'libraries/ethereum-idetntiy-kit',
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
			label: '⛓️ Onchain Data',
			collapsed: false,
			link: { type: 'doc', id: 'quickstart/retrieve-onchain-data' },
			items: [
						{
							type: 'doc',
							id: 'quickstart/resolve-ens-profiles',
							label: 'ENS Profiles',
						},
						{
							type: 'doc',
							id: 'quickstart/retrieve-efp-data',
							label: 'EFP Social Graph',
						},
						{
							type: 'doc',
							id: 'quickstart/resolve-onchain-holdings',
							label: 'Other Onchain Assets',
						},
						],
				},
		{
			type: 'category',
			label: '🔐 OIDC Provider',
			link: { type: 'doc', id: 'oidc-provider/index' },
			items: [
				'oidc-provider/deployment-guide',
				// 'oidc-provider/hosted-oidc-provider',
			],
		},

		'security-considerations',
		// {
		// 	type: 'category',
		// 	collapsed: false,
		// 	label: '📘 General Information',
		// 	link: { type: 'doc', id: 'general-information/overview' },
		// 	items: [
		// 		'general-information/overview',
		// 		'general-information/eip-4361-specification',
		// 		'general-information/related-standards',
		// 	],
		// },
		{
			type: 'link',
			label: '📄 EIP-4361 Specification',
			href: 'https://eips.ethereum.org/EIPS/eip-4361',
			className: 'text-accent hover:text-white transition-colors font-medium group',
		}
	],
}

export default sidebars
