import { revalidateTag } from "next/cache";

export async function POST(request: Request) {
  const secret = request.headers.get("x-sanity-secret");
  if (!process.env.SANITY_REVALIDATE_SECRET || secret !== process.env.SANITY_REVALIDATE_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }
  revalidateTag("editorial", "max");
  return Response.json({ revalidated: true });
}
