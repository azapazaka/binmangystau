import type { HumanConfirmationStatus, HumanVoteVerdict, ReportRecord } from "@/types";

const MIN_HUMAN_CONFIRMATION_VOTES = 3;

type HumanConfirmationMeta = {
  label: string;
  shortLabel: string;
  tone: string;
  description: string;
};

export function getHumanConfirmationStatus(
  realVotes: number,
  fakeVotes: number,
): HumanConfirmationStatus {
  const totalVotes = realVotes + fakeVotes;

  if (totalVotes < MIN_HUMAN_CONFIRMATION_VOTES) {
    return "pending";
  }

  if (Math.abs(realVotes - fakeVotes) <= 1) {
    return "disputed";
  }

  return realVotes > fakeVotes ? "confirmed_real" : "confirmed_fake";
}

export function getHumanConfirmationMeta(
  status: HumanConfirmationStatus,
): HumanConfirmationMeta {
  switch (status) {
    case "confirmed_real":
      return {
        label: "Подтверждено жителями",
        shortLabel: "Люди: реально",
        tone: "bg-emerald-100 text-emerald-900",
        description: "Жители чаще считают, что жалоба описывает реальную городскую проблему.",
      };
    case "confirmed_fake":
      return {
        label: "Похоже на фейк по мнению жителей",
        shortLabel: "Люди: фейк",
        tone: "bg-rose-100 text-rose-900",
        description: "Жители чаще считают, что жалоба не подтверждается.",
      };
    case "disputed":
      return {
        label: "Мнения жителей расходятся",
        shortLabel: "Люди: спорно",
        tone: "bg-amber-100 text-amber-900",
        description: "Голоса жителей разделились, и по жалобе нет явного большинства.",
      };
    case "pending":
      return {
        label: "Ожидается подтверждение жителей",
        shortLabel: "Люди: ожидается",
        tone: "bg-slate-100 text-slate-800",
        description: "Пока недостаточно голосов жителей, чтобы сделать устойчивый вывод.",
      };
  }
}

export function getHumanVoteLabel(verdict: HumanVoteVerdict) {
  return verdict === "real" ? "Реально" : "Фейк";
}

export function getHumanConfirmationCountsLabel(report: Pick<
  ReportRecord,
  "humanRealVotes" | "humanFakeVotes" | "humanVotesTotal"
>) {
  if (report.humanVotesTotal === 0) {
    return "Пока нет голосов жителей";
  }

  return `${report.humanRealVotes} реально · ${report.humanFakeVotes} фейк`;
}

export function getHumanConfirmationInterpretation(report: Pick<
  ReportRecord,
  "humanConfirmationStatus" | "humanRealVotes" | "humanFakeVotes"
>) {
  const meta = getHumanConfirmationMeta(report.humanConfirmationStatus);

  if (report.humanConfirmationStatus === "pending") {
    return meta.description;
  }

  return `${meta.description} Сейчас распределение голосов: ${report.humanRealVotes} за "реально" и ${report.humanFakeVotes} за "фейк".`;
}
