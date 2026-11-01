import { createFileRoute, redirect } from "@tanstack/react-router";

// Old address: send everybody to the new beheer page.
export const Route = createFileRoute("/admin")({
  beforeLoad: () => {
    throw redirect({ to: "/beheer" });
  },
});
