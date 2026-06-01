'use client'

export default function LanguageButtonES() {

  return (

    <button
      onClick={() => {
        sessionStorage.setItem(
            'skipIntro',
            'true'
            )

            window.location.href =
            '/en/'
      }}
      style={{
        background:'#ffffff00',

        border:'none',

        color:'#D4AF37',

        borderRadius:'999px',

        padding:'5px 5px',

        cursor:'pointer',

        display:'flex',
        alignItems:'center',
        justifyContent:'center',

        fontSize:'1rem',
        

        letterSpacing:'.08em',

        textTransform:'uppercase'
      }}
    >
      EN
    </button>

  )

}