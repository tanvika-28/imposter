"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { useSound } from "@/src/hooks/use-sound";
import { useGameStore } from "@/src/stores/game-store";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  MessageSquare,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  User,
  Vote,
  Volume2,
} from "lucide-react";
import { useTranslations } from "next-intl";

export default function DiscussionPhase() {
  const { gameState, startVoting } = useGameStore();
  const t = useTranslations("DiscussionPhase");
  const playImpostorSound = useSound("/sounds/impostor-sound.mp3", 0.7);

  // 2-Round Synonym Flow
  const [round, setRound] = useState<1 | 2>(1);
  const [currentSpeakerIndex, setCurrentSpeakerIndex] = useState(0);
  const [completedSpeakersRound1, setCompletedSpeakersRound1] = useState<number[]>([]);
  const [completedSpeakersRound2, setCompletedSpeakersRound2] = useState<number[]>([]);
  const [isBothRoundsFinished, setIsBothRoundsFinished] = useState(false);

  // Optional Turn Countdown Timer (30 seconds per turn)
  const [turnSeconds, setTurnSeconds] = useState(30);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  const totalPlayers = gameState.players.length;
  const currentSpeaker = gameState.players[currentSpeakerIndex];

  useEffect(() => {
    playImpostorSound();
  }, [playImpostorSound]);

  // Turn timer interval
  useEffect(() => {
    if (!isTimerRunning || turnSeconds <= 0 || isBothRoundsFinished) return;
    const interval = setInterval(() => {
      setTurnSeconds(prev => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning, turnSeconds, isBothRoundsFinished]);

  const handleNextSpeaker = () => {
    if (round === 1) {
      if (!completedSpeakersRound1.includes(currentSpeakerIndex)) {
        setCompletedSpeakersRound1(prev => [...prev, currentSpeakerIndex]);
      }

      if (currentSpeakerIndex + 1 < totalPlayers) {
        setCurrentSpeakerIndex(prev => prev + 1);
        setTurnSeconds(30);
      } else {
        // Round 1 completed! Advance to Round 2
        setRound(2);
        setCurrentSpeakerIndex(0);
        setTurnSeconds(30);
      }
    } else {
      // Round 2
      if (!completedSpeakersRound2.includes(currentSpeakerIndex)) {
        setCompletedSpeakersRound2(prev => [...prev, currentSpeakerIndex]);
      }

      if (currentSpeakerIndex + 1 < totalPlayers) {
        setCurrentSpeakerIndex(prev => prev + 1);
        setTurnSeconds(30);
      } else {
        // Round 2 completed! Both rounds done!
        setIsBothRoundsFinished(true);
      }
    }
  };

  const handleRestartDiscussion = () => {
    setRound(1);
    setCurrentSpeakerIndex(0);
    setCompletedSpeakersRound1([]);
    setCompletedSpeakersRound2([]);
    setIsBothRoundsFinished(false);
    setTurnSeconds(30);
    setIsTimerRunning(true);
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center p-4 text-white sm:p-6 pb-20">
      <div className="mx-auto w-full max-w-2xl space-y-6 text-center">
        {/* Round Header & Badge */}
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Badge
              className={`px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                round === 1
                  ? "border-purple-500/40 bg-purple-500/20 text-purple-300"
                  : "border-indigo-500/40 bg-indigo-500/20 text-indigo-300"
              }`}
            >
              🔄 Round {round} of 2: {round === 1 ? "First Synonym" : "Final Synonym"}
            </Badge>

            {isBothRoundsFinished && (
              <Badge className="border-emerald-500/40 bg-emerald-500/20 text-emerald-300 text-xs font-bold">
                ✓ 2 Rounds Complete
              </Badge>
            )}
          </div>

          <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
            {isBothRoundsFinished
              ? "All 2 Rounds Complete!"
              : round === 1
                ? "Round 1: Say Your First Synonym"
                : "Round 2: Say Your Second Synonym"}
          </h1>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            {isBothRoundsFinished
              ? "Everyone has given their 2 clues. Now it's time to vote and reveal the impostor!"
              : "Each person speaks 1 synonym or subtle clue for their word without giving it away."}
          </p>
        </div>

        {/* Player Order Carousel / Strip */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto py-2 px-1">
          {gameState.players.map((player, idx) => {
            const isCurrent = !isBothRoundsFinished && idx === currentSpeakerIndex;
            const hasSpokenInCurrentRound =
              round === 1
                ? completedSpeakersRound1.includes(idx)
                : completedSpeakersRound2.includes(idx);

            return (
              <div
                key={player.id}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all ${
                  isCurrent
                    ? "bg-purple-600/30 border-2 border-purple-500 scale-105 shadow-lg shadow-purple-950/50"
                    : hasSpokenInCurrentRound
                      ? "bg-zinc-900/60 border border-zinc-800 opacity-60"
                      : "bg-zinc-900/40 border border-zinc-800/60 opacity-40"
                }`}
              >
                <div
                  className={`flex size-10 items-center justify-center rounded-full text-xs font-bold ${
                    isCurrent
                      ? "bg-purple-500 text-white animate-pulse"
                      : hasSpokenInCurrentRound
                        ? "bg-emerald-600 text-white"
                        : "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  {hasSpokenInCurrentRound ? (
                    <CheckCircle2 className="size-5" />
                  ) : (
                    idx + 1
                  )}
                </div>
                <span className="text-[11px] font-semibold max-w-[70px] truncate text-zinc-200">
                  {player.name}
                </span>
              </div>
            );
          })}
        </div>

        {/* ACTIVE SPEAKER SPOTLIGHT CARD */}
        {!isBothRoundsFinished ? (
          <Card className="border-2 border-purple-500/40 bg-zinc-900/80 backdrop-blur-md shadow-2xl shadow-purple-950/30">
            <CardContent className="p-6 sm:p-8 space-y-6">
              {/* Speaker Header */}
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300">
                  <Volume2 className="size-3.5" />
                  Now Speaking (Player {currentSpeakerIndex + 1} of {totalPlayers})
                </span>

                <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-white to-indigo-300">
                  {currentSpeaker?.name}
                </h2>
              </div>

              {/* Instructions Prompt */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 text-sm text-zinc-300 space-y-1">
                {round === 1 ? (
                  <p className="leading-relaxed">
                    🗣️ <strong className="text-purple-300">{currentSpeaker?.name}</strong>, say{" "}
                    <strong>one synonym or subtle clue</strong> describing your secret word.
                  </p>
                ) : (
                  <p className="leading-relaxed">
                    🔥 <strong className="text-indigo-300">{currentSpeaker?.name}</strong>, say{" "}
                    <strong>your 2nd synonym</strong>. Prove you're crew or bluff as the impostor!
                  </p>
                )}
                <p className="text-xs text-zinc-500">
                  Remember: Don't say the word itself!
                </p>
              </div>

              {/* Turn Timer */}
              <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-zinc-950/40 border border-zinc-800/80">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <Clock className="size-4 text-purple-400" />
                  Turn Timer
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`font-mono font-bold text-lg ${
                      turnSeconds <= 5 ? "text-red-400 animate-pulse" : "text-white"
                    }`}
                  >
                    00:{turnSeconds < 10 ? `0${turnSeconds}` : turnSeconds}
                  </span>
                  <button
                    onClick={() => setIsTimerRunning(prev => !prev)}
                    className="text-zinc-400 hover:text-white transition-colors"
                  >
                    {isTimerRunning ? <Pause className="size-4" /> : <Play className="size-4" />}
                  </button>
                </div>
              </div>

              {/* Action Button: Next Speaker */}
              <Button
                onClick={handleNextSpeaker}
                className="h-14 w-full rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-lg font-semibold text-white shadow-xl shadow-purple-900/30 hover:from-purple-700 hover:to-indigo-700 hover:scale-[1.02] transition-all"
              >
                {currentSpeakerIndex + 1 < totalPlayers ? (
                  <>
                    Synonym Given ➔ Next Player ({gameState.players[currentSpeakerIndex + 1]?.name})
                    <ArrowRight className="ml-2 size-5" />
                  </>
                ) : round === 1 ? (
                  <>
                    Round 1 Done ➔ Start Round 2 (Final Synonyms)
                    <ArrowRight className="ml-2 size-5" />
                  </>
                ) : (
                  <>
                    Both Rounds Done ➔ Finish Discussion
                    <CheckCircle2 className="ml-2 size-5" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* BOTH ROUNDS COMPLETED BANNER */
          <Card className="border-2 border-emerald-500/40 bg-zinc-900/90 backdrop-blur-md shadow-2xl shadow-emerald-950/40">
            <CardContent className="p-8 space-y-6">
              <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-emerald-600/20 border-2 border-emerald-500">
                <CheckCircle2 className="size-10 text-emerald-400" />
              </div>

              <div className="space-y-2">
                <h2 className="text-3xl font-extrabold text-white">
                  All 2 Rounds Finished!
                </h2>
                <p className="text-sm text-zinc-300 max-w-md mx-auto leading-relaxed">
                  Every player has stated their 2 synonyms. Suspicions have been raised... Who sounded like they didn't know the word?
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 text-xs text-zinc-400 space-y-1">
                <p className="font-semibold text-purple-300">
                  Next: Impostor Voting Phase 🗳️
                </p>
                <p>
                  Each player will vote on who they believe the Impostor is.{" "}
                  <strong className="text-white">
                    Whoever correctly guesses the impostor will be crowned a Winner!
                  </strong>
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <Button
                  onClick={startVoting}
                  className="h-14 w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-lg font-bold text-white shadow-xl shadow-emerald-900/30 hover:from-emerald-700 hover:to-teal-700 hover:scale-[1.02] transition-all"
                >
                  <Vote className="mr-2.5 size-5" />
                  Proceed to Impostor Voting 🗳️
                </Button>

                <Button
                  variant="ghost"
                  onClick={handleRestartDiscussion}
                  className="w-full text-xs text-zinc-400 hover:text-white"
                >
                  <RotateCcw className="mr-1.5 size-3.5" />
                  Replay Synonym Rounds
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Skip to Voting */}
        {!isBothRoundsFinished && (
          <div className="pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={startVoting}
              className="text-xs text-zinc-400 hover:text-zinc-200"
            >
              Skip to Voting Phase ➔
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
