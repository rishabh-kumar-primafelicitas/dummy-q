import { Request, Response } from "express";
import {
  CREATE_EVENT_CONNECTION_MUTATION,
  FETCH_CAMPAIGNS_QUERY,
  FETCH_CONNECTION_TOKEN_QUERY,
  FETCH_QUESTS_QUERY,
  ME_QUERY,
  PARTICIPATE_TWITTER_FOLLOW_TASK_MUTATION,
  USER_EVENT_CONNECTIONS_QUERY,
  USER_TASK_PARTICIPATION_QUERY,
} from "@utils/graphql.queries";
import { executeGraphQLQuery } from "@services/graphql.service";
import { config } from "@config/server.config";
import axios from "axios";

// nterface for user response
interface UserResponse {
  status: boolean;
  message: string;
  data: {
    user: {
      lockedUntil: null | string;
      _id: string;
      username: string;
      email: string;
      oAuthProvider: null | string;
      oAuthId: null | string;
      roleId: string;
      status: string;
      walletAddress: null | string;
      walletConnected: boolean;
      lastLoginAt: string;
      loginAttempts: number;
      profilePicture: null | string;
      twoFactorEnabled: boolean;
      emailVerified: boolean;
      emailVerificationExpires: null | string;
      passwordResetExpires: null | string;
      createdAt: string;
      updatedAt: string;
      airLyftAuthToken: string;
    };
  };
}

interface AuthUser {
  userId: string;
  provider: string;
  providerId: string;
  firstName: string | null;
  lastName: string | null;
  picture: string | null;
  username: string;
  isPrimary: boolean;
  verified: boolean;
  updatedAt: string;
  __typename: string;
}

interface AuthDetails extends AuthUser {
  createdAt: string;
}

interface MeResponse {
  auth: AuthUser[];
  createdAt: string;
  email: string | null;
  firstName: string;
  id: string;
  lastName: string;
  auths: AuthDetails[];
}

export class QuestController {
  async fetchCampaigns(_req: Request, res: Response): Promise<void> {
    try {
      const projectId = process.env.AIRLYFT_PROJECT_ID;

      if (!projectId) {
        res.status(500).json({
          success: false,
          message: "Project ID not configured in environment",
        });
        return;
      }

      const variables = {
        pagination: {
          skip: 0,
          take: 100,
        },
        where: {
          projectId: projectId,
          state: ["ONGOING"],
          visibility: ["PUBLIC"],
        },
      };

      const response = await executeGraphQLQuery(
        FETCH_CAMPAIGNS_QUERY,
        variables,
        false
      );

      if (response?.errors) {
        res.status(400).json({
          status: false,
          message: "GraphQL query failed",
          errors: response.errors,
        });
        return;
      }

      const campaigns = response?.data?.exploreEvents?.data || [];

      // Fetch quest count for each campaign
      const campaignsWithQuestCount = await Promise.all(
        campaigns.map(async (campaign: any) => {
          try {
            const questVariables = {
              eventId: campaign.id,
            };

            const questResponse = await executeGraphQLQuery(
              FETCH_QUESTS_QUERY,
              questVariables,
              false
            );

            const questCount = questResponse?.data?.pTasks?.length || 0;

            return {
              ...campaign,
              questCount,
            };
          } catch (questError) {
            console.error(
              `Error fetching quest count for campaign ${campaign.id}:`,
              questError
            );
            return {
              ...campaign,
              questCount: 0,
            };
          }
        })
      );

      res.status(200).json({
        status: true,
        data: campaignsWithQuestCount,
        message: "Campaigns fetched successfully",
      });
    } catch (error: any) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({
        status: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  async fetchAllQuests(_req: Request, res: Response): Promise<void> {
    try {
      const projectId = process.env.AIRLYFT_PROJECT_ID;

      if (!projectId) {
        res.status(500).json({
          success: false,
          message: "Project ID not configured in environment",
        });
        return;
      }

      // First, fetch all campaigns
      const campaignVariables = {
        pagination: {
          skip: 0,
          take: 100,
        },
        where: {
          projectId: projectId,
          state: ["ONGOING"],
          visibility: ["PUBLIC"],
        },
      };

      const campaignResponse = await executeGraphQLQuery(
        FETCH_CAMPAIGNS_QUERY,
        campaignVariables,
        false
      );

      if (campaignResponse?.errors) {
        res.status(400).json({
          status: false,
          message: "Failed to fetch campaigns",
          errors: campaignResponse.errors,
        });
        return;
      }

      const campaigns = campaignResponse?.data?.exploreEvents?.data || [];

      // Fetch quests for each campaign
      const allQuests: any[] = [];

      for (const campaign of campaigns) {
        try {
          const questVariables = {
            eventId: campaign.id,
          };

          const questResponse = await executeGraphQLQuery(
            FETCH_QUESTS_QUERY,
            questVariables,
            false
          );

          if (questResponse?.data?.pTasks) {
            const questsWithCampaignInfo = questResponse.data.pTasks.map(
              (quest: any) => ({
                ...quest,
                tentId: campaign.id,
                tentTitle: campaign.title,
                tentState: campaign.state,
              })
            );

            allQuests.push(...questsWithCampaignInfo);
          }
        } catch (questError) {
          console.error(
            `Error fetching quests for campaign ${campaign.id}:`,
            questError
          );
          // Continue with other campaigns even if one fails
        }
      }

      res.status(200).json({
        status: true,
        data: allQuests,
        totalQuests: allQuests.length,
        message: "All quests fetched successfully",
      });
    } catch (error: any) {
      console.error("Error fetching all quests:", error);
      res.status(500).json({
        status: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  async fetchQuests(req: Request, res: Response): Promise<void> {
    try {
      const { eventId } = req.params;

      if (!eventId) {
        res.status(400).json({
          success: false,
          message: "Event ID is required",
        });
        return;
      }

      const variables = {
        eventId: eventId,
      };

      const response = await executeGraphQLQuery(
        FETCH_QUESTS_QUERY,
        variables,
        false
      );

      if (response?.errors) {
        res.status(400).json({
          status: false,
          message: "GraphQL query failed",
          errors: response.errors,
        });
        return;
      }

      res.status(200).json({
        status: true,
        data: response?.data?.pTasks,
        message: "Quests fetched successfully",
      });
    } catch (error: any) {
      console.error("Error fetching quests:", error);
      res.status(500).json({
        status: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  async fetchConnectionToken(req: Request, res: Response): Promise<void> {
    try {
      const { provider } = req.params;
      const projectId = config.airLyft.projectId;

      if (!provider) {
        res.status(400).json({
          success: false,
          message: "Provider is required",
        });
        return;
      }

      if (!projectId) {
        res.status(500).json({
          success: false,
          message: "Project ID not configured in environment",
        });
        return;
      }

      // Get authorization token from headers
      const authToken = req.headers.authorization;

      if (!authToken) {
        res.status(401).json({
          status: false,
          message: "Authorization token is required",
        });
        return;
      }

      // Fetch user details to get airLyftAuthToken
      const userResponse = await axios.get<UserResponse>(
        `${config.services.authServiceUrl}/api/v1/me`,
        {
          headers: {
            Authorization: authToken,
          },
        }
      );

      if (
        !userResponse.data ||
        !userResponse.data.status ||
        !userResponse.data.data?.user?.airLyftAuthToken
      ) {
        res.status(400).json({
          status: false,
          message: "Failed to retrieve user airLyftAuthToken",
        });
        return;
      }

      const airLyftAuthToken = userResponse.data.data.user.airLyftAuthToken;

      // Validate provider enum
      const validProviders = ["TWITTER", "TELEGRAM", "DISCORD"];
      const upperCaseProvider = provider.toUpperCase();

      if (!validProviders.includes(upperCaseProvider)) {
        res.status(400).json({
          success: false,
          message: `Invalid provider. Must be one of: ${validProviders.join(
            ", "
          )}`,
        });
        return;
      }

      const variables = {
        provider: upperCaseProvider,
        projectId: projectId,
      };

      const response = await executeGraphQLQuery(
        FETCH_CONNECTION_TOKEN_QUERY,
        variables,
        true,
        true,
        airLyftAuthToken
      );

      if (response?.errors) {
        res.status(400).json({
          status: false,
          message: "GraphQL query failed",
          errors: response.errors,
        });
        return;
      }

      const connectionToken = response?.data?.connectionToken;

      if (!connectionToken) {
        res.status(404).json({
          status: false,
          message: "Connection token not found",
        });
        return;
      }

      res.status(200).json({
        status: true,
        data: {
          connectionToken: connectionToken,
          provider: upperCaseProvider,
        },
        message: "Connection token fetched successfully",
      });
    } catch (error: any) {
      console.error("Error fetching connection token:", error);
      res.status(500).json({
        status: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  async participateTwitterFollow(req: Request, res: Response): Promise<void> {
    try {
      // Get authorization token from headers
      const authToken = req.headers.authorization;

      if (!authToken) {
        res.status(401).json({
          status: false,
          message: "Authorization token is required",
        });
        return;
      }

      console.log("Authorization token:", authToken);

      // Fetch user details to get airLyftAuthToken
      const userResponse = await axios.get<UserResponse>(
        `${config.services.authServiceUrl}/api/v1/me`,
        {
          headers: {
            Authorization: authToken,
          },
        }
      );

      if (
        !userResponse.data ||
        !userResponse.data?.status ||
        !userResponse.data?.data?.user?.airLyftAuthToken
      ) {
        res.status(400).json({
          status: false,
          message: "Failed to retrieve user airLyftAuthToken",
        });
        return;
      }

      const airLyftAuthToken = userResponse.data.data.user.airLyftAuthToken;

      // Get values from request body, with default fallbacks
      // const {
      //   eventId = "755ec7d6-abeb-466d-aa52-3ef90d64d0fb",
      //   providerId = "68412db44994b6f2b3df5021",
      //   taskId = "39343ef1-e56e-4b52-a7a4-352a9eea6ebc",
      // } = req.body;

      const eventId = "755ec7d6-abeb-466d-aa52-3ef90d64d0fb";
      const providerId = "683edb56ab8b7eb309f340bf";
      const taskId = "39343ef1-e56e-4b52-a7a4-352a9eea6ebc";

      const variables = {
        eventId,
        providerId,
        taskId,
      };

      const response = await executeGraphQLQuery(
        PARTICIPATE_TWITTER_FOLLOW_TASK_MUTATION,
        variables,
        true,
        true,
        airLyftAuthToken
      );

      console.log("GraphQL response:", response);

      if (response?.errors) {
        res.status(400).json({
          status: false,
          message: "Twitter follow task participation failed",
          errors: response.errors,
        });
        return;
      }

      const participationResult = response?.data?.participateTwitterFollowTask;

      if (!participationResult) {
        res.status(404).json({
          status: false,
          message: "No participation result returned",
        });
        return;
      }

      res.status(200).json({
        status: true,
        data: participationResult,
        message: "Twitter follow task participated successfully",
      });
    } catch (error: any) {
      console.error("Error participating in Twitter follow task:", error);
      res.status(500).json({
        status: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  async fetchEventConnections(req: Request, res: Response): Promise<void> {
    try {
      const { eventId } = req.params;

      if (!eventId) {
        res.status(400).json({
          status: false,
          message: "Event ID is required",
        });
        return;
      }

      // Get authorization token from headers to fetch user's airLyftAuthToken
      const authToken = req.headers.authorization;

      if (!authToken) {
        res.status(401).json({
          status: false,
          message: "Authorization token is required",
        });
        return;
      }

      // Fetch user details to get airLyftAuthToken
      const userResponse = await axios.get<UserResponse>(
        `${config.services.authServiceUrl}/api/v1/me`,
        {
          headers: {
            Authorization: authToken,
          },
        }
      );

      if (
        !userResponse.data ||
        !userResponse.data.status ||
        !userResponse.data.data?.user?.airLyftAuthToken
      ) {
        res.status(400).json({
          status: false,
          message: "Failed to retrieve user airLyftAuthToken",
        });
        return;
      }

      const airLyftAuthToken = userResponse.data.data.user.airLyftAuthToken;

      const variables = { eventId };

      const response = await executeGraphQLQuery(
        USER_EVENT_CONNECTIONS_QUERY,
        variables,
        true,
        true,
        airLyftAuthToken // Use user's airLyftAuthToken
      );

      if (response?.errors) {
        res.status(400).json({
          status: false,
          message: "Failed to fetch event connections",
          errors: response.errors,
        });
        return;
      }

      const eventConnections = response?.data?.eventConnections || [];

      res.status(200).json({
        status: true,
        data: {
          eventConnections,
        },
        message: "Event connections fetched successfully",
      });
    } catch (error: any) {
      console.error("Error fetching event connections:", error);
      res.status(500).json({
        status: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  async fetchMe(req: Request, res: Response): Promise<void> {
    try {
      // Get authorization token from headers to fetch user's airLyftAuthToken
      const authToken = req.headers.authorization;

      if (!authToken) {
        res.status(401).json({
          status: false,
          message: "Authorization token is required",
        });
        return;
      }

      // Fetch user details to get airLyftAuthToken
      const userResponse = await axios.get<UserResponse>(
        `${config.services.authServiceUrl}/api/v1/me`,
        {
          headers: {
            Authorization: authToken,
          },
        }
      );

      if (
        !userResponse.data ||
        !userResponse.data.status ||
        !userResponse.data.data?.user?.airLyftAuthToken
      ) {
        res.status(400).json({
          status: false,
          message: "Failed to retrieve user airLyftAuthToken",
        });
        return;
      }

      const airLyftAuthToken = userResponse.data.data.user.airLyftAuthToken;
      const projectId = config.airLyft.projectId;

      const variables = projectId ? { projectId } : {};

      const response = await executeGraphQLQuery(
        ME_QUERY,
        variables,
        true,
        true,
        airLyftAuthToken
      );

      if (response?.errors) {
        res.status(400).json({
          status: false,
          message: "Failed to fetch user profile",
          errors: response.errors,
        });
        return;
      }

      const meData = response?.data?.me;

      if (!meData) {
        res.status(404).json({
          status: false,
          message: "User profile not found",
        });
        return;
      }

      res.status(200).json({
        status: true,
        data: {
          me: meData,
        },
        message: "User profile fetched successfully",
      });
    } catch (error: any) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({
        status: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  async fetchUserTaskParticipation(req: Request, res: Response): Promise<void> {
    try {
      const { eventId } = req.params;

      if (!eventId) {
        res.status(400).json({
          status: false,
          message: "Event ID is required",
        });
        return;
      }

      // Get authorization token from headers to fetch user's airLyftAuthToken
      const authToken = req.headers.authorization;

      if (!authToken) {
        res.status(401).json({
          status: false,
          message: "Authorization token is required",
        });
        return;
      }

      // Fetch user details to get airLyftAuthToken
      const userResponse = await axios.get<UserResponse>(
        `${config.services.authServiceUrl}/api/v1/me`,
        {
          headers: {
            Authorization: authToken,
          },
        }
      );

      if (
        !userResponse.data ||
        !userResponse.data.status ||
        !userResponse.data.data?.user?.airLyftAuthToken
      ) {
        res.status(400).json({
          status: false,
          message: "Failed to retrieve user airLyftAuthToken",
        });
        return;
      }

      const airLyftAuthToken = userResponse.data.data.user.airLyftAuthToken;

      const variables = { eventId };

      const response = await executeGraphQLQuery(
        USER_TASK_PARTICIPATION_QUERY,
        variables,
        true,
        true,
        airLyftAuthToken
      );

      if (response?.errors) {
        res.status(400).json({
          status: false,
          message: "Failed to fetch user task participation",
          errors: response.errors,
        });
        return;
      }

      const userTaskParticipation = response?.data?.userTaskParticipation || [];

      res.status(200).json({
        status: true,
        data: {
          userTaskParticipation,
        },
        message: "User task participation fetched successfully",
      });
    } catch (error: any) {
      console.error("Error fetching user task participation:", error);
      res.status(500).json({
        status: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  async createEventConnection(req: Request, res: Response): Promise<void> {
    try {
      const { eventId, provider, providerId } = req.body;

      // Validate required fields
      if (!eventId || !provider || !providerId) {
        res.status(400).json({
          status: false,
          message: "eventId, provider, and providerId are required",
        });
        return;
      }

      // Get authorization token from headers
      const authToken = req.headers.authorization;

      if (!authToken) {
        res.status(401).json({
          status: false,
          message: "Authorization token is required",
        });
        return;
      }

      // Fetch user details to get airLyftAuthToken
      const userResponse = await axios.get<UserResponse>(
        `${config.services.authServiceUrl}/api/v1/me`,
        {
          headers: {
            Authorization: authToken,
          },
        }
      );

      if (
        !userResponse.data ||
        !userResponse.data.status ||
        !userResponse.data.data?.user?.airLyftAuthToken
      ) {
        res.status(400).json({
          status: false,
          message: "Failed to retrieve user airLyftAuthToken",
        });
        return;
      }

      const airLyftAuthToken = userResponse.data.data.user.airLyftAuthToken;

      // Validate provider enum
      const validProviders = ["TWITTER", "TELEGRAM", "DISCORD", "CAMP_HAVEN"];
      const upperCaseProvider = provider.toUpperCase();

      if (!validProviders.includes(upperCaseProvider)) {
        res.status(400).json({
          status: false,
          message: `Invalid provider. Must be one of: ${validProviders.join(
            ", "
          )}`,
        });
        return;
      }

      const variables = {
        eventId,
        provider: upperCaseProvider,
        providerId,
      };

      const response = await executeGraphQLQuery(
        CREATE_EVENT_CONNECTION_MUTATION,
        variables,
        true,
        true,
        airLyftAuthToken
      );

      if (response?.errors) {
        res.status(400).json({
          status: false,
          message: "Failed to create event connection",
          errors: response.errors,
        });
        return;
      }

      const eventConnection = response?.data?.createEventConnection;

      if (!eventConnection) {
        res.status(404).json({
          status: false,
          message: "Event connection creation failed",
        });
        return;
      }

      res.status(201).json({
        status: true,
        data: {
          createEventConnection: eventConnection,
        },
        message: "Event connection created successfully",
      });
    } catch (error: any) {
      console.error("Error creating event connection:", error);
      res.status(500).json({
        status: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }
}
