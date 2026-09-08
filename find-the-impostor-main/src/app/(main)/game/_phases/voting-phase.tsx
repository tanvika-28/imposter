"use client";

import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Separator } from "@/src/components/ui/separator";
import { useSound } from "@/src/hooks/use-sound";
import { useGameStore } from "@/src/stores/game-store";
import {
  AlertTriangle,
  Award,
  Check,
  CheckCircle2,
  ChevronRight,
  Crosshair,
  Eye,
  RotateCcw,
  Shield,
  Skull,
  Terminal,
  Trophy,
  User,
  Vote,
  Zap,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

export default function VotingPhase() {
  const {
    gameState,
    castVote,
    nextVotingPlayer,
    endGame,
    newGame,
    recordRoundResult,
    crewWins,
    impostorWins,
    roundsPlayed,
  } = useGameStore();
  const t = useTranslations("VotingPhase");
  const playSound = useSound("/sounds/reveal-sound.mp3", 0.7);

  const [isReadyToVote, setIsReadyToVote] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<number | null>(
    null,
  );
  const [isRevealed, setIsRevealed] = useState(false);

  // Impostor Counter-Hack State
  const [showCounterHack, setShowCounterHack] = useState(false);
  const [hackGuess, setHackGuess] = useState("");
  const [hackResult, setHackResult] = useState<"success" | "failure" | null>(
    null,
  );

  const totalPlayers = gameState.players.length;
  const currentVoterIndex = gameState.currentVotingPlayerIndex;
  const currentVoter = gameState.players[currentVoterIndex];

  // All players have completed their vote if index >= totalPlayers
  const isVotingComplete = currentVoterIndex >= totalPlayers;

  // Calculate vote tally
  const voteTally = useMemo(() => {
    const counts: Record<number, number> = {};
    gameState.players.forEach(p => {
      counts[p.id] = 0;
    });

    Object.values(gameState.votes).forEach(targetId => {
      if (counts[targetId] !== undefined) {
        counts[targetId] += 1;
      }
    });

    return counts;
  }, [gameState.players, gameState.votes]);

  // Determine top-voted player(s)
  const topSuspects = useMemo(() => {
    let maxVotes = -1;
    let suspects: typeof gameState.players = [];

    gameState.players.forEach(player => {
      const votes = voteTally[player.id] || 0;
      if (votes > maxVotes) {
        maxVotes = votes;
        suspects = [player];
      } else if (votes === maxVotes && maxVotes > 0) {
        suspects.push(player);
      }
    });

    const isTie = suspects.length > 1;
    return { suspects, maxVotes, isTie };
  }, [gameState.players, voteTally]);

  const impostors = useMemo(
    () => gameState.players.filter(p => p.role === "impostor"),
    [gameState.players],
  );

  const crewMembers = useMemo(
    () => gameState.players.filter(p => p.role !== "impostor"),
    [gameState.players],
  );

  const handleConfirmVote = () => {
    if (!selectedCandidateId || !currentVoter) return;

    castVote(currentVoter.id, selectedCandidateId);
    setSelectedCandidateId(null);
    setIsReadyToVote(false);
    nextVotingPlayer();
  };

  const handleRevealVerdict = () => {
    playSound();
    setIsRevealed(true);

    const accused = topSuspects.suspects[0];
    const isTie = topSuspects.isTie || topSuspects.maxVotes === 0;
    const accusedIsImpostor = accused && accused.role === "impostor";

    if (!isTie && accusedIsImpostor) {
      recordRoundResult(
        "crew",
        crewMembers.map(c => c.name),
      );
    } else {
      recordRoundResult(
        "impostor",
        impostors.map(imp => imp.name),
      );
    }
  };

  const handleCounterHackSubmit = () => {
    if (!hackGuess.trim()) return;

    const normalizedGuess = hackGuess.trim().toLowerCase();
    const normalizedActual = gameState.currentWord.trim().toLowerCase();

    if (
      normalizedGuess === normalizedActual ||
      normalizedActual.includes(normalizedGuess) ||
      normalizedGuess.includes(normalizedActual)
    ) {
      setHackResult("success");
      recordRoundResult(
        "impostor",
        impostors.map(imp => imp.name),
      );
    } else {
      setHackResult("failure");
    }
  };

  // STAGE 2: ALL VOTES CAST -> TALLY & DRAMATIC REVEAL
  if (isVotingComplete) {
    const accused = topSuspects.suspects[0];
    const isTie = topSuspects.isTie || topSuspects.maxVotes === 0;
    const accusedIsImpostor = accused && accused.role === "impostor";

    const effectiveCrewWin =
      !isTie && accusedIsImpostor && hackResult !== "success";
    const effectiveImpostorWin =
      isTie || !accusedIsImpostor || hackResult === "success";

    return (
      <div className="flex min-h-dvh flex-col items-center justify-center p-4 text-white sm:p-6">
        <div className="mx-auto w-full max-w-lg space-y-5 text-center">
          {/* Header */}
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3.5 py-1 text-xs font-semibold tracking-wider text-purple-300 uppercase">
              <Vote className="size-3.5" />
              {t("votingResults")}
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {t("allVotesIn")}
            </h1>
            <p className="text-xs text-zinc-400">
              {roundsPlayed > 0 && (
                <span className="font-mono text-purple-400">
                  Round {roundsPlayed} • Crew: {crewWins} | Impostors: {impostorWins}
                </span>
              )}
            </p>
          </div>

          {/* Vote Counts List */}
          <div className="space-y-2">
            {gameState.players.map(player => {
              const votes = voteTally[player.id] || 0;
              const isTop =
                !isTie && topSuspects.suspects.some(s => s.id === player.id);

              return (
                <div
                  key={player.id}
                  className={`flex items-center justify-between rounded-xl border p-3 transition-all ${
                    isTop
                      ? "border-red-500/50 bg-red-950/20 shadow-md shadow-red-950/30"
                      : "border-zinc-800 bg-zinc-900/60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex size-8 items-center justify-center rounded-full font-bold text-xs ${
                        isTop
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : "bg-zinc-800 text-zinc-300"
                      }`}
                    >
                      {player.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-white">
                        {player.name}
                      </p>
                      {isTop && (
                        <p className="text-xs font-medium text-red-400">
                          {t("mostSuspected")}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        isTop
                          ? "bg-red-500/20 text-red-300 border border-red-500/30"
                          : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {votes} {t("votesCount")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Reveal Section */}
          {!isRevealed ? (
            <div className="pt-2">
              <Button
                onClick={handleRevealVerdict}
                className="h-14 w-full rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 text-lg font-semibold text-white shadow-xl shadow-red-900/30 transition-all duration-200 hover:from-red-700 hover:to-rose-700 hover:scale-[1.02]"
              >
                <Eye className="mr-2.5 size-5" />
                {t("revealVerdict")}
              </Button>
            </div>
          ) : (
            <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/90 p-5 backdrop-blur-md animate-in fade-in zoom-in-95 duration-300">
              {/* Result Banner */}
              {isTie ? (
                <div className="space-y-1.5 text-center">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <AlertTriangle className="size-6" />
                  </div>
                  <h2 className="text-2xl font-bold text-amber-400">
                    {t("tieResult")}
                  </h2>
                  <p className="text-xs text-zinc-300">
                    {t("tieDescription")}
                  </p>
                </div>
              ) : effectiveCrewWin ? (
                <div className="space-y-1.5 text-center">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <Award className="size-6" />
                  </div>
                  <h2 className="text-2xl font-bold text-emerald-400">
                    {t("crewVictory")}
                  </h2>
                  <p className="text-sm text-zinc-200">
                    <span className="font-bold text-white">{accused.name}</span>{" "}
                    {t("impostorCaught")}
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5 text-center">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                    <Skull className="size-6" />
                  </div>
                  <h2 className="text-2xl font-bold text-red-400">
                    {t("impostorVictory")}
                  </h2>
                  <p className="text-sm text-zinc-200">
                    {hackResult === "success" ? (
                      <span>
                        💥 Impostor executed a successful Counter-Hack by
                        guessing the secret word!
                      </span>
                    ) : (
                      <>
                        <span className="font-bold text-white">
                          {accused.name}
                        </span>{" "}
                        {t("innocentAccused")}
                      </>
                    )}
                  </p>
                </div>
              )}

              <Separator className="bg-zinc-800" />

              {/* Impostor Counter-Hack Feature */}
              {accusedIsImpostor && hackResult === null && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-left space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
                      <Terminal className="size-3.5" />
                      Impostor Counter-Hack Opportunity
                    </div>
                    {!showCounterHack && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowCounterHack(true)}
                        className="h-6 border-amber-500/40 bg-amber-500/20 text-xs text-amber-200 hover:bg-amber-500/30"
                      >
                        <Zap className="mr-1 size-3" />
                        Attempt Hack
                      </Button>
                    )}
                  </div>

                  {showCounterHack && (
                    <div className="space-y-2 pt-1">
                      <p className="text-xs text-zinc-300">
                        {accused.name}: Can you guess the secret word to steal victory?
                      </p>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Type secret AI word..."
                          value={hackGuess}
                          onChange={e => setHackGuess(e.target.value)}
                          className="h-8 border-zinc-700 bg-zinc-800 text-xs"
                        />
                        <Button
                          size="sm"
                          onClick={handleCounterHackSubmit}
                          className="h-8 bg-amber-600 px-3 text-xs text-white hover:bg-amber-700"
                        >
                          Submit
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {hackResult === "failure" && (
                <div className="rounded-lg border border-red-500/30 bg-red-950/30 p-2 text-xs text-red-300">
                  ❌ Counter-Hack failed! "{hackGuess}" was incorrect. Crew victory stands!
                </div>
              )}

              {/* Real Impostor(s) Identification */}
              <div className="space-y-1.5 text-left">
                <p className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
                  {t("realImpostors")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {impostors.map(imp => (
                    <div
                      key={imp.id}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-300"
                    >
                      <Skull className="size-3.5 text-red-400" />
                      {imp.name}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                <Button
                  onClick={endGame}
                  className="h-11 w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 font-semibold text-white transition-all hover:from-purple-700 hover:to-indigo-700"
                >
                  {t("viewFullResults")}
                </Button>
                <Button
                  onClick={newGame}
                  variant="outline"
                  className="h-11 w-full rounded-xl border-zinc-700 bg-zinc-800/50 font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white"
                >
                  <RotateCcw className="mr-2 size-4" />
                  Next Match
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // STAGE 1A: PRIVACY SHIELD BEFORE VOTING
  if (!isReadyToVote) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center p-6 text-white">
        <div className="mx-auto w-full max-w-sm space-y-8 text-center">
          <div className="space-y-4">
            <div className="mx-auto flex size-20 items-center justify-center rounded-full border border-purple-500/30 bg-purple-500/10 shadow-lg shadow-purple-900/20">
              <Shield className="size-10 text-purple-400" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold tracking-wider text-purple-400 uppercase">
                Vote {currentVoterIndex + 1} of {totalPlayers}
              </span>
              <p className="text-lg text-zinc-400">{t("passDeviceTo")}</p>
              <h2 className="text-3xl font-bold text-white">
                {currentVoter?.name}
              </h2>
            </div>

            <p className="text-xs text-zinc-500">{t("keepItSecret")}</p>
          </div>

          <Button
            onClick={() => setIsReadyToVote(true)}
            className="h-14 w-full rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-lg font-semibold text-white shadow-xl shadow-purple-900/30 transition-all duration-200 hover:from-purple-700 hover:to-indigo-700 hover:scale-[1.02]"
          >
            {t("readyToVote")}
            <ChevronRight className="ml-2 size-5" />
          </Button>
        </div>
      </div>
    );
  }

  // STAGE 1B: BALLOT SELECTION SCREEN
  const candidateOptions = gameState.players.filter(
    p => p.id !== currentVoter?.id,
  );

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center p-4 text-white sm:p-6">
      <div className="mx-auto w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-0.5 text-xs font-medium text-purple-300">
            <User className="size-3" />
            {currentVoter?.name} is voting ({currentVoterIndex + 1}/{totalPlayers})
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {t("whoIsTheImpostor")}
          </h1>
          <p className="text-sm text-zinc-400">{t("selectSuspect")}</p>
        </div>

        {/* Suspect Candidates Grid */}
        <div className="grid gap-3">
          {candidateOptions.map(candidate => {
            const isSelected = selectedCandidateId === candidate.id;

            return (
              <Card
                key={candidate.id}
                onClick={() => setSelectedCandidateId(candidate.id)}
                className={`cursor-pointer border transition-all duration-200 ${
                  isSelected
                    ? "border-red-500 bg-red-950/40 shadow-lg shadow-red-950/50 scale-[1.01]"
                    : "border-zinc-800 bg-zinc-900/70 hover:border-zinc-700 hover:bg-zinc-800/60"
                }`}
              >
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`flex size-11 items-center justify-center rounded-xl font-bold text-base transition-colors ${
                        isSelected
                          ? "bg-red-600 text-white shadow-md shadow-red-700/40"
                          : "bg-zinc-800 text-zinc-300"
                      }`}
                    >
                      {candidate.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-base font-semibold text-white">
                        {candidate.name}
                      </p>
                      <p className="text-xs text-zinc-400">Suspect Player</p>
                    </div>
                  </div>

                  <div
                    className={`flex size-6 items-center justify-center rounded-full border transition-all ${
                      isSelected
                        ? "border-red-500 bg-red-500 text-white"
                        : "border-zinc-700 bg-zinc-800/80"
                    }`}
                  >
                    {isSelected && <Check className="size-4 stroke-[3]" />}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <Button
            onClick={handleConfirmVote}
            disabled={!selectedCandidateId}
            className="h-14 w-full rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 text-lg font-semibold text-white shadow-xl shadow-red-900/30 transition-all duration-200 hover:from-red-700 hover:to-rose-700 hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
          >
            <CheckCircle2 className="mr-2 size-5" />
            {t("confirmVote")}
          </Button>
        </div>
      </div>
    </div>
  );
}
