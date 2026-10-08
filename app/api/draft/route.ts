import { draftMode } from "next/headers";
import { redirect } from "next/navigation";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");
  const slug = url.searchParams.get("slug") || "/";
  if (!process.env.SANITY_PREVIEW_SECRET || secret !== process.env.SANITY_PREVIEW_SECRET) {
    return new Response("Invalid preview secret", { status: 401 });
  }
  if (!slug.startsWith("/") || slug.startsWith("//")) {
    return new Response("Invalid preview path", { status: 400 });
  }
  const draft = await draftMode();
  draft.enable();
  redirect(slug);
}
