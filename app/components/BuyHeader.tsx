'use client'

type BuyHeaderESProps = {
  title?: string
  subtitle?: string
}

export default function BuyHeaderES({
  title = 'Twuanis',
  subtitle = 'Encuentra Propiedades en Venta'
}: BuyHeaderESProps) {

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

                color: '#ffffff',

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
          color: '#fff',
          fontSize: '22px'
        }}
      >
        {subtitle}
      </p>

    </div>

  )

}