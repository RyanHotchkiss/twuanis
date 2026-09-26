'use client'

type BuyHeaderProps = {
  title?: string
  subtitle?: string
  theme?: 'dark' | 'light'
}

export default function BuyHeader({
  title = 'Twuanis',
  subtitle = 'Find Properties for Sale',
  theme = 'dark'
}: BuyHeaderProps) {

  return (

    <div
      style={{
        textAlign: 'center',
        marginBottom: '40px'
      }}
    >

      <h1
            style={{
                fontSize: '72px',
                marginBottom: '10px',

                color:
                  theme === 'dark'
                    ? '#ffffff'
                    : '#000000',

                WebkitTextStroke: '2px #d4af37',

                textShadow: `
                0 0 8px rgba(212,175,55,.45),
                0 0 18px rgba(212,175,55,.25)
                `
            }}
            >
            {title}
      </h1>

      <p
        style={{
          color:
            theme === 'dark'
              ? '#ffffff'
              : '#000000',
          fontSize: '22px'
        }}
      >
        {subtitle}
      </p>

    </div>

  )

}