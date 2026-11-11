'use client'

import {createContext,useContext} from 'react'

type AlgorithmExampleOverlayHandler=(open:boolean)=>void

const AlgorithmExampleOverlayContext=createContext<AlgorithmExampleOverlayHandler|undefined>(undefined)

export const AlgorithmExampleOverlayProvider=AlgorithmExampleOverlayContext.Provider

export function useAlgorithmExampleOverlay(){
 return useContext(AlgorithmExampleOverlayContext)
}
