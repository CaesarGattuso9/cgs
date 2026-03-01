import { NextResponse } from "next/server";
import { z } from "zod";

import { createAdminSessionToken, setAdminSessionCookie, validateAdminCredentials } from "@/lib/auth";

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const payload = loginSchema.parse(await req.json());
    const isValid = validateAdminCredentials(payload.username, payload.password);

    if (!isValid) {
      return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
    }

    const token = createAdminSessionToken(payload.username);
    const response = NextResponse.json({ ok: true, user: { username: payload.username } });
    setAdminSessionCookie(response, token);
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Login failed." }, { status: 500 });
  }
}
