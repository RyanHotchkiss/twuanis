import type {ReactNode, RefObject} from 'react'
import AnalyticalSynthesis from './AnalyticalSynthesis'
import type {Synthesis} from '@/lib/analytical-synthesis-segments'

// One committed-result introduction; evidence-specific wording stays with its formatter.
export default function AnalyticalResultIntroduction({title, question, synthesis, heading, questionClassName}: {
  title: ReactNode
  question: ReactNode
  synthesis: string | Synthesis
  heading?: RefObject<HTMLHeadingElement | null>
  questionClassName?: string
}) {
  return <div data-analytical-introduction>
    <h3 ref={heading} tabIndex={-1}>{title}</h3>
    <p className={questionClassName}>{question}</p>
    <AnalyticalSynthesis primary>{synthesis}</AnalyticalSynthesis>
  </div>
}
