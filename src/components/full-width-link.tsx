import React from 'react'

interface FullWidthLinkProps {
	href: string
	logo: string
	text: string
	className?: string
	themeAware?: boolean
}

const FullWidthLink: React.FC<FullWidthLinkProps> = ({
	href,
	logo,
	text,
	className = '',
	themeAware = false,
}) => {
	// Generate a unique class name based on the logo path
	const logoFileName = logo?.split('/').pop()?.split('.')[0] || 'logo'
	const maskClassName = `${logoFileName}-mask`

	return (
		<a href={href} className={`full-size-url ${className}`}>
			<div className='full-size-url-content'>
				{themeAware ? (
					<div
						className={`logo-mask ${maskClassName}`}
						style={{
							WebkitMask: `url(${logo}) no-repeat center`,
							mask: `url(${logo}) no-repeat center`,
							WebkitMaskSize: 'contain',
							maskSize: 'contain',
						}}
					/>
				) : (
					<img src={logo} alt={text} />
				)}
				<p>{text}</p>
			</div>
			<p className='full-size-url-arrow'>→</p>
		</a>
	)
}

export default FullWidthLink
