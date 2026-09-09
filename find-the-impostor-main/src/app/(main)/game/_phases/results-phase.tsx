"use client";

import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Separator } from "@/src/components/ui/separator";
import { useGameStore } from "@/src/stores/game-store";
import { RotateCcw, Skull, Trash2, Trophy, Users, CheckCircle2, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";

export function ResultsPhase() {
  const {
    gameState,
    newGame,
    scores,
    crewWins,
    impostorWins,
    roundsPlayed,
    resetScores,
  } = useGameStore();
  const t = useTranslations("ResultsPhase");

  const summary = gameState.lastRoundSummary;
  const impostors = gameState.players.filter(p => p.role === "impostor");

  const rankedPlayers = Object.entries(scores).sort(
    ([, scoreA], [, scoreB]) => scoreB - scoreA,
  );

  const correctGuessers = summary?.correctGuesserNames || [];
  const hasCorrectGuessers = correctGuessers.length > 0;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center p-4 text-white sm:p-6 pb-20">
      <div className="mx-auto w-full max-w-md space-y-6 text-center">
        {/* Header */}
        <div className="space-y-1">
          <Badge
            variant="outline"
            className="border-purple-500/30 bg-purple-500/10 text-purple-300"
          >
            Round Complete
          </Badge>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            {t("results")}
          </h1>
        </div>

        {/* WINNER SPOTLIGHT CARD */}
        {hasCorrectGuessers ? (
          <div className="rounded-2xl border-2 border-emerald-500/50 bg-emerald-950/30 p-5 shadow-xl shadow-emerald-950/50 space-y-2">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Trophy className="size-6 text-amber-400" />
            </div>
            <h2 className="text-2xl font-black text-emerald-400">
              🏆 ROUND WINNER{correctGuessers.length > 1 ? "S" : ""}!
            </h2>
            <p className="text-xs text-zinc-300">
              Guessed the Impostor correctly:
            </p>
            <div className="flex flex-wrap justify-center gap-2 pt-1">
              {correctGuessers.map(name => (
                <span
                  key={name}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/50 bg-emerald-500/20 px-3.5 py-1 text-sm font-bold text-emerald-200"
                >
                  <Trophy className="size-3.5 text-amber-400" />
                  {name}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-red-500/50 bg-red-950/30 p-5 shadow-xl shadow-red-950/50 space-y-2">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
              <Skull className="size-6 text-red-400" />
            </div>
            <h2 className="text-2xl font-black text-red-400">
              🎭 IMPOSTOR WINS!
            </h2>
            <p className="text-xs text-zinc-300">
              Nobody guessed the Impostor! The Impostor tricked everyone!
            </p>
          </div>
        )}

        {/* Secret Word Card */}
        <div className="rounded-2xl border border-blue-500/30 bg-blue-950/20 p-4 shadow-lg shadow-blue-950/30 backdrop-blur-sm space-y-1">
          <p className="text-[10px] font-semibold tracking-wider text-blue-400 uppercase">
            {t("theWordWas")}
          </p>
          <p className="text-3xl font-black tracking-wide text-white">
            {gameState.currentWord || summary?.word}
          </p>
          <p className="text-xs text-zinc-400 capitalize">
            Category: {(gameState.currentCategory || summary?.category || "General").replace(/_/g, " ")}
          </p>
        </div>

        {/* Impostor Identity Card */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold tracking-wider text-zinc-500 uppercase">
            {impostors.length === 1 ? "The Impostor" : "The Impostors"}
          </p>
          <div className="space-y-2">
            {(summary?.impostorNames?.length ? summary.impostorNames : impostors.map(i => i.name)).map(name => (
              <div
                key={name}
                className="flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-950/20 p-3"
              >
                <Skull className="size-5 text-red-400" />
                <p className="text-lg font-bold text-red-300">{name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Vote Breakdown Card */}
        {summary?.votes && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 text-left space-y-2.5">
            <p className="text-xs font-semibold tracking-wider text-purple-400 uppercase">
              Round Votes & Outcomes
            </p>
            <div className="space-y-1.5 text-xs">
              {gameState.players.map(voter => {
                const targetId = summary.votes[voter.id];
                const target = gameState.players.find(p => p.id === targetId);
                const isImpostor = summary.impostorIds.includes(voter.id);
                const isTargetImpostor = target && summary.impostorIds.includes(target.id);

                return (
                  <div
                    key={voter.id}
                    className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-zinc-800/40"
                  >
                    <span className="font-semibold text-zinc-200">
                      {voter.name}
                      {isImpostor && " 🎭"}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="text-zinc-400">voted for</span>
                      <strong className="text-white">{target?.name || "No vote"}</strong>
                      {isTargetImpostor && !isImpostor ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                          <CheckCircle2 className="size-3.5" /> Winner
                        </span>
                      ) : !isImpostor ? (
                        <span className="text-zinc-500 flex items-center gap-0.5">
                          <XCircle className="size-3.5" /> Fooled
                        </span>
                      ) : null}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Match Scoreboard */}
        {roundsPlayed > 0 && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 text-left space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-400">
                <Trophy className="size-3.5 text-amber-400" />
                Leaderboard ({roundsPlayed} {roundsPlayed === 1 ? "round" : "rounds"})
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span className="text-emerald-400 font-semibold">
                  Crew: {crewWins}
                </span>
                <span>•</span>
                <span className="text-red-400 font-semibold">
                  Impostors: {impostorWins}
                </span>
              </div>
            </div>

            <Separator className="bg-zinc-800" />

            <div className="space-y-1.5">
              {rankedPlayers.map(([name, score], index) => (
                <div
                  key={name}
                  className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-zinc-800/40"
                >
                  <span className="font-medium text-zinc-200">
                    #{index + 1} {name}
                  </span>
                  <span className="font-mono font-bold text-purple-300">
                    {score} {score === 1 ? "pt" : "pts"}
                  </span>
                </div>
              ))}
            </div>

            <div className="text-right pt-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={resetScores}
                className="h-6 px-2 text-[10px] text-zinc-500 hover:text-red-400"
              >
                <Trash2 className="size-2.5 mr-1" />
                Reset Scores
              </Button>
            </div>
          </div>
        )}

        {/* New Match Action */}
        <div className="pt-2">
          <Button
            onClick={newGame}
            className="h-14 w-full rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-lg font-semibold text-white shadow-xl shadow-purple-900/30 transition-all duration-200 hover:from-purple-700 hover:to-indigo-700 hover:scale-[1.02]"
          >
            <RotateCcw className="mr-2.5 size-5" />
            {t("newGame")}
          </Button>
        </div>
      </div>
    </div>
  );
}
