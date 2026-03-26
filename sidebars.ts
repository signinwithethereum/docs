import type { SidebarsConfig } from '@docusaurus/plugin-content-docs'

const sidebars: SidebarsConfig = {
	tutorialSidebar: [
		{
			type: 'doc',
			id: 'index',
			label: 'Introduction',
		},
		{
			type: 'category',
			label: 'Quickstart Guide',
			link: { type: 'doc', id: 'quickstart/index' },
			items: [
				{
					type: 'doc',
					id: 'quickstart/frontend',
					label: 'Frontend',
				},
				{
					type: 'doc',
					id: 'quickstart/backend',
					label: 'Backend',
				},
			],
		},
		{
			type: 'category',
			label: 'TypeScript Library',
			collapsed: false,
			link: { type: 'doc', id: 'libraries/typescript' },
			items: [
				'libraries/typescript/typescript-quickstart',
				'libraries/typescript/migrating-to-v4',
			],
		},
		{
			type: 'category',
			label: 'Integrations',
			link: { type: 'doc', id: 'integrations/index' },
			items: [
				'integrations/discourse',
				'integrations/nextauth.js',
				'integrations/auth0',
			],
		},
		{
			type: 'category',
			label: 'OIDC Provider',
			link: { type: 'doc', id: 'oidc-provider/index' },
			items: [
				'oidc-provider/api-reference',
				'oidc-provider/deployment-guide',
				'oidc-provider/client-setup',
				{
					type: 'link',
					label: 'Provider GitHub',
					href: 'https://github.com/signinwithethereum/oidc-provider',
					className: 'text-accent hover:text-white transition-colors font-medium group',
				},
				{
					type: 'link',
					label: 'Client GitHub',
					href: 'https://github.com/signinwithethereum/oidc-client',
					className: 'text-accent hover:text-white transition-colors font-medium group',
				},
			],
		},

		{
			type: 'category',
			label: 'Message Validator',
            link: { type: 'doc', id: 'validator/index' },
            items: [
				'validator/validator-guide',
			],
		},

		'security-considerations',

		{
			type: 'link',
			label: 'EIP-4361 Specification',
			href: 'https://eips.ethereum.org/EIPS/eip-4361',
			className: 'text-accent hover:text-white transition-colors font-medium group',
		},
		
		{
			type: 'doc',
			id: 'media-kit',
			label: 'Media Kit',
		}
	],
}

export default sidebars
