'use client'
import type {ButtonHTMLAttributes} from 'react'
import './AlgorithmRunButton.css'
export default function AlgorithmRunButton({className='',...props}:ButtonHTMLAttributes<HTMLButtonElement>){return <button {...props} className={'algorithm-run '+className}/>}
