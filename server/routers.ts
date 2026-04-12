import { router } from "./_core/trpc";
import { eleitusRouter } from "./eleituRouter";

export const appRouter = router({
  eleitus: eleitusRouter,
});

export type AppRouter = typeof appRouter;
