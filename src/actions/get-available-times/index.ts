import z from "zod";

import { actionClient } from "@/lib/next-safe-action";

export const getAvailableTimes = actionClient.schema(z.object({}));
