import { auth } from "@/lib/auth/config";

export function getServerSession(request: Request) {
  return auth.api.getSession({ headers: request.headers });
}