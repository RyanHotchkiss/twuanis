import TopBar from '@/app/components/TopBar'
import BankDetail from '@/app/components/remates/BankDetail'
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <><TopBar mobileFit/><BankDetail id={id} language="es"/></>}
