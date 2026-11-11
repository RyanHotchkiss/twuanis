"use server"
import { executeAskingPrice } from './asking-price-engine'
export async function analyzeAskingPrice(input:unknown){return executeAskingPrice(input)}
