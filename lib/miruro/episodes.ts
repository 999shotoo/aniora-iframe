import { cache } from "react";
import { pipeRequest } from "./core";

export const fetchRawEpisodes = cache(async (anilistId: number) => {
  return pipeRequest(
    { path: "episodes", method: "GET", query: { anilistId }, body: null },
    300
  );
});