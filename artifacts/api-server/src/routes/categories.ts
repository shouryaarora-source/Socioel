import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db, eventsTable } from "@workspace/db";

const router: IRouter = Router();

const CATEGORY_ICONS: Record<string, string> = {
  Running: "footprints",
  Walking: "walk",
  Cycling: "bike",
  Hiking: "mountain",
  Sports: "trophy",
  Fitness: "dumbbell",
  Yoga: "heart",
  Swimming: "waves",
  Social: "users",
  Other: "star",
};

router.get("/categories", async (_req, res): Promise<void> => {
  const counts = await db
    .select({
      category: eventsTable.category,
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(eventsTable)
    .groupBy(eventsTable.category)
    .orderBy(sql`count(*) desc`);

  const allCategories = Object.keys(CATEGORY_ICONS);
  const countMap = new Map(counts.map((c) => [c.category, c.count]));

  const result = allCategories.map((name) => ({
    name,
    icon: CATEGORY_ICONS[name] ?? null,
    eventCount: countMap.get(name) ?? 0,
  }));

  res.json(result);
});

export default router;
