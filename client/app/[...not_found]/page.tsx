import { notFound } from "next/navigation";

// This catch-all route will trigger the not-found.tsx component
// without causing infinite reloads
// Had to do this because of the way Next.js handles 404s and redirects
// This works pretty well for now
const NotFoundCatchAll = () => notFound();

export default NotFoundCatchAll;