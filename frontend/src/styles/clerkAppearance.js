export const clerkAppearance = {
	variables: {
		colorPrimary: '#E8A94B',
		colorText: '#F6F4EF',
		colorTextSecondary: '#9AA2AF',
		colorBackground: '#0F1420',
		colorInputBackground: '#1B2333',
		colorInputText: '#F6F4EF',
		colorSuccess: '#3E9C8F',
		colorDanger: '#D9634F',
		borderRadius: '1.25rem',
	},
	elements: {
		card: 'border border-white/10 bg-[rgba(15,20,32,0.9)] shadow-[0_32px_80px_rgba(2,6,23,0.58)] backdrop-blur-xl',
		headerTitle: '!text-[#F6F4EF] !text-3xl !font-semibold !tracking-tight',
		headerSubtitle: '!text-[#9AA2AF] !text-sm',
		dividerText: '!text-[#9AA2AF] !bg-transparent',
		dividerLine: '!bg-white/12',
		formFieldLabel: '!text-[#DDE1E6] !text-sm !font-medium',
		formFieldInput:
			'!bg-[#0F1420] !text-[#F6F4EF] !border-[#44506b] placeholder:!text-[#9AA2AF] focus:!border-[#E8A94B] focus:!ring-[#E8A94B]',
		formButtonPrimary:
			'!bg-[#E8A94B] !text-[#0F1420] !font-semibold hover:!bg-[#F0BC6D] active:!bg-[#CC8F35] !shadow-lg !shadow-amber-950/20',
		formButtonReset: '!text-[#9AA2AF] hover:!text-[#F6F4EF]',
		socialButtonsBlockButton:
			'!bg-[#F6F4EF] !text-[#0F1420] !border !border-[#EBE8E0] hover:!bg-[#EBE8E0] focus:!ring-[#E8A94B]',
		socialButtonsBlockButtonText: '!text-[#0F1420] !font-semibold',
		socialButtonsBlockButtonArrow: '!text-[#0F1420]',
		footerActionLink: '!text-[#E8A94B] hover:!text-[#F0BC6D]',
		identityPreview: '!bg-[#1B2333] !text-[#F6F4EF] !border-[#44506b]',
		identityPreviewText: '!text-[#F6F4EF]',
		identityPreviewEditButton: '!text-[#E8A94B] hover:!text-[#F0BC6D]',
		alertText: '!text-[#D9634F]',
		formResendCodeLink: '!text-[#E8A94B] hover:!text-[#F0BC6D]',
	},
}

export const authShellClassName =
	'min-h-screen bg-[radial-gradient(circle_at_top,#1B2333_0%,#0F1420_42%,#060912_100%)] px-4 py-10 text-slate-100 sm:px-6 lg:px-8'

export const authCardShellClassName =
	'w-full max-w-md rounded-[2rem] border border-white/10 bg-white/5 p-4 shadow-2xl shadow-cyan-950/30 backdrop-blur'