export type {
  CitizenOverviewIssue as CitizenDashboardIssue,
  CitizenOverviewStat as CitizenDashboardStat,
} from "@/components/citizen-v2/citizen-adapters";

export {
  buildCitizenOverviewIssues,
  buildCitizenOverviewStats,
  buildCitizenOverviewIssues as buildCitizenDashboardIssues,
  buildCitizenOverviewStats as buildCitizenDashboardStats,
  ISSUE_TITLES,
} from "@/components/citizen-v2/citizen-adapters";
