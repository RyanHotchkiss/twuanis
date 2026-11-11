import './sinpe-journey.css'
export default function SinpeProgress({step,es}:{step:number;es:boolean}){
 const labels=es?['Compra','Datos bancarios','Transferencia','Verificación','Acceso']:['Purchase','Bank details','Transfer','Verification','Access']
 return <nav className="sinpe-progress" aria-label={es?'Progreso del pago':'Payment progress'}><ol>{labels.map((label,index)=><li key={label} aria-current={step===index+1?'step':undefined} data-complete={step>index+1}><span aria-hidden="true">{index+1}</span>{label}{step>index+1&&<span className="sinpe-sr-only">{es?' completado':' completed'}</span>}</li>)}</ol></nav>
}
