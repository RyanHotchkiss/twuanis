import type { AuthLocale } from './account-access'
const en = {
 signIn:'Sign In', signUp:'Create Account', forgot:'Forgot Password?', reset:'Send Reset Link',
 signInTitle:'Sign In to MarketHub', signUpTitle:'Create Your MarketHub Account', resetTitle:'Reset Your Password',
 signInDescription:'Enter your email address and password.',signUpDescription:'Create an account using your email address and password.',resetDescription:'Enter your email address to request a password-reset link.',
 email:'Email address',password:'Password',confirmPassword:'Confirm password',close:'Close',working:'Working…',
 invalidEmail:'Enter a valid email address.',shortPassword:'Your password must contain at least 6 characters.',mismatch:'The passwords do not match.',
 confirmation:'Check your email for account confirmation. Confirmation is required before signing in.',
 recoverySent:'If this address is eligible, you will receive a password-reset email.',
 failure:'We could not complete this request. Check your details or request a new link.',
 unconfirmed:'Confirm your email before signing in. Check your confirmation email.',
 callback:'Completing your secure sign-in…',badLink:'This link could not establish a valid session. It may be invalid, expired or already used. Request a new link.',
 loading:'Loading MarketHub…',newPassword:'Create a New Password',confirmNew:'Confirm new password',savePassword:'Save Password',saved:'Your password was updated.',
 pendingEmail:'Email change requested. Complete the provider’s confirmation steps. Your account email changes only when confirmed.',
 returnHub:'Return to MarketHub'
}
const es: typeof en = {
 signIn:'Iniciar sesión',signUp:'Crear cuenta',forgot:'¿Olvidó su contraseña?',reset:'Enviar enlace de recuperación',
 signInTitle:'Iniciar sesión en MarketHub',signUpTitle:'Cree su cuenta de MarketHub',resetTitle:'Restablezca su contraseña',
 signInDescription:'Ingrese su correo electrónico y contraseña.',signUpDescription:'Cree una cuenta con su correo electrónico y contraseña.',resetDescription:'Ingrese su correo electrónico para solicitar un enlace de recuperación.',
 email:'Correo electrónico',password:'Contraseña',confirmPassword:'Confirme la contraseña',close:'Cerrar',working:'Procesando…',
 invalidEmail:'Ingrese un correo electrónico válido.',shortPassword:'La contraseña debe tener al menos 6 caracteres.',mismatch:'Las contraseñas no coinciden.',
 confirmation:'Revise su correo para confirmar la cuenta. Debe confirmarla antes de iniciar sesión.',
 recoverySent:'Si esta dirección reúne los requisitos, recibirá un correo para restablecer su contraseña.',
 failure:'No pudimos completar la solicitud. Revise los datos o solicite un enlace nuevo.',unconfirmed:'Confirme su correo antes de iniciar sesión. Revise el correo de confirmación.',
 callback:'Completando el inicio de sesión seguro…',badLink:'El enlace no pudo establecer una sesión válida. Puede ser inválido, haber vencido o haberse utilizado. Solicite uno nuevo.',
 loading:'Cargando MarketHub…',newPassword:'Cree una contraseña nueva',confirmNew:'Confirme la contraseña nueva',savePassword:'Guardar contraseña',saved:'Se actualizó su contraseña.',
 pendingEmail:'Se solicitó el cambio de correo. Complete la confirmación del proveedor. El correo de la cuenta cambia únicamente al confirmarse.',returnHub:'Volver a MarketHub'
}
export const accountCopy=(locale:AuthLocale)=>locale==='es'?es:en
export function safeAuthError(error: unknown,locale:AuthLocale){return error&&typeof error==='object'&&'code' in error&&error.code==='email_not_confirmed'?accountCopy(locale).unconfirmed:accountCopy(locale).failure}
