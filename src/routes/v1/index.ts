import { QuestController } from "@controllers/quest.controller";
import { Router } from "express";

const router = Router();
const questController = new QuestController();

router.get("/quests/:eventId", questController.fetchQuests);

// Campaigns and Quests
router.get("/campaigns", questController.fetchCampaigns);
router.get("/quests", questController.fetchAllQuests);

// Generate Connection Token
router.get("/connection-token/:provider", questController.fetchConnectionToken);

// User Info
router.get("/me", questController.fetchMe);
router.get(
  "/user-task-participation/:eventId",
  questController.fetchUserTaskParticipation
);

// Event Connections
router.get(
  "/event-connections/:eventId",
  questController.fetchEventConnections
);
router.post("/create-event-connection", questController.createEventConnection);

// Event Tasks
router.post(
  "/participate/twitter-follow",
  questController.participateTwitterFollow
);

export default router;
