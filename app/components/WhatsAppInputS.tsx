'use client'

type WhatsAppInputSProps = {
  whatsapp: string
  addWhatsAppDigit: (digit: string) => void
  deleteWhatsAppDigit: () => void
  formatWhatsAppNumber: (
    number: string
  ) => string
}

export default function WhatsAppInputS({
  whatsapp,
  addWhatsAppDigit,
  deleteWhatsAppDigit,
  formatWhatsAppNumber
}: WhatsAppInputSProps) {

  return (

    <div style={{ marginTop:'4rem' }}>

      <h2 style={sectionHeading}>
        WhatsApp Number
      </h2>

      <div style={phoneDisplay}>
        +506 {' '}
        {formatWhatsAppNumber(whatsapp)
          || '____-____'}
      </div>

      <div style={phoneKeypad}>

        {[
          '1','2','3',
          '4','5','6',
          '7','8','9'
        ].map((digit) => (

          <button
            key={digit}
            onClick={() =>
              addWhatsAppDigit(digit)
            }
            style={phoneKey}
          >
            {digit}
          </button>

        ))}

        <div></div>

        <button
          onClick={() =>
            addWhatsAppDigit('0')
          }
          style={phoneKey}
        >
          0
        </button>

        <button
          onClick={deleteWhatsAppDigit}
          style={phoneDeleteKey}
        >
          ⌫
        </button>

      </div>

    </div>

  )

}

const sectionHeading = {
  fontSize:'1rem',
  marginBottom:'1rem',
  color:'#ff3b00'
}

const phoneDisplay = {
  background:'#111',
  border:'1px solid #222',
  borderRadius:'1rem',
  padding:'1.5rem',
  fontSize:'2rem',
  textAlign:'center' as const,
  marginBottom:'1.5rem',
  fontWeight:'bold',
  letterSpacing:'.1rem'
}

const phoneKeypad = {
  display:'grid',
  gridTemplateColumns:'repeat(3,1fr)',
  gap:'1rem'
}

const phoneKey = {
  background:'#181818',
  border:'1px solid #333',
  color:'#fff',
  borderRadius:'1rem',
  padding:'1.5rem',
  fontSize:'1.5rem',
  cursor:'pointer'
}

const phoneDeleteKey = {
  ...phoneKey,
  color:'#ff6666'
}