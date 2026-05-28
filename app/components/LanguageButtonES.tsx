'use client'

export default function LanguageButtonES() {

  return (

    <button
      onClick={() => {
        window.location.href =
          '/en/'
      }}
      style={{
        background:'#ffffff00',

        border:'none',

        color:'#00ff99',

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
      ES
    </button>

  )

}