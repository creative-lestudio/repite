import { NextResponse } from "next/server";

// Wallet envía aquí sus mensajes de diagnóstico; no hace falta guardarlos.
export async function POST() {
  return new NextResponse(null, { status: 200 });
}
