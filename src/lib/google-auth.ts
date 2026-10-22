/** El botón «Registrarme con Google» solo se muestra cuando Google está activado en Supabase (NEXT_PUBLIC_GOOGLE_LOGIN=1). */
export const googleAuthEnabled = process.env.NEXT_PUBLIC_GOOGLE_LOGIN === "1";
