"use client";

import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { useSound } from "@/src/hooks/use-sound";
import { useGameStore } from "@/src/stores/game-store";
import {
  Clock,
  Dices,
  Eye,
  MessageSquareCode,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
  User,
  Vote,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

const TECH_DISCUSSION_QUESTIONS = [
  "Would you deploy this to production on a Friday afternoon?",
  "Is this more CPU-intensive or GPU/memory-bound?",
  "Could an intern configure this without crashing the whole cluster?",
  "Is this open-source with 50k stars, or proprietary behind an enterprise paywall?",
  "Does this run better on bare-metal Linux, macOS, or in a Docker container?",
  "Would Linus Torvalds send a spicy mailing-list email about this?",
  "Does this usually cause merge conflicts or merge smoothly?",
  "Can this be replaced by a 10-line Python script?",
  "Does this require 500 lines of nested YAML configuration?",
  "Is this mostly frontend hype or deep backend infrastructure?",
  "Would you put this keyword on your senior engineer résumé?",
  "Does this scale horizontally or vertically?",
];

export default function DiscussionPhase() {
  const { gameState, endGame, startVoting } = useGameStore();
  const t = useTranslations("DiscussionPhase");
  const playImpostorSound = useSound("/sounds/impostor-sound.mp3", 0.7);

  // Pick starter player once per discussion
  const startPlayer = useMemo(() => {
    if (gameState.players.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * gameState.players.length);
    return gameState.players[randomIndex];
  }, [gameState.players]);

  // Discussion Countdown Timer
  const [secondsRemaining, setSecondsRemaining] = useState(60);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  // Tech Question Prompts
  const [questionIndex, setQuestionIndex] = useState(0);

  useEffect(() => {
    playImpostorSound();
  }, [playImpostorSound]);

  useEffect(() => {
    if (!isTimerRunning || secondsRemaining <= 0) return;

    const interval = setInterval(() => {
      setSecondsRemaining(prev => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning, secondsRemaining]);

  const handleNextQuestion = () => {
    setQuestionIndex(prev => (prev + 1) % TECH_DISCUSSION_QUESTIONS.length);
  };

  const handleAdd30Seconds = () => {
    setSecondsRemaining(prev => prev + 30);
    if (!isTimerRunning) setIsTimerRunning(true);
  };

  const handleToggleTimer = () => {
    setIsTimerRunning(prev => !prev);
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const isCriticalTime = secondsRemaining <= 10 && secondsRemaining > 0;
  const isTimeUp = secondsRemaining === 0;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center p-4 text-white sm:p-6">
      <div className="mx-auto w-full max-w-md space-y-6 text-center">
        {/* Starter Player Banner */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-400">
            <User className="size-3.5" />
            First Clue Speaker
          </div>

          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-emerald-400 sm:text-4xl">
              {startPlayer?.name}
            </h1>
            <p className="text-sm text-zinc-400">
              {t("starts")} — give your first tech clue!
            </p>
          </div>
        </div>

        {/* Live Discussion Countdown Timer */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-400">
              <Clock className="size-3.5 text-purple-400" />
              Discussion Timer
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAdd30Seconds}
                className="h-7 gap-1 px-2 text-xs text-purple-300 hover:bg-purple-950/40 hover:text-purple-200"
              >
                <Plus className="size-3" />
                30s
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleTimer}
                className="h-7 w-7 p-0 text-zinc-400 hover:text-white"
              >
                {isTimerRunning ? (
                  <Pause className="size-3.5" />
                ) : (
                  <Play className="size-3.5" />
                )}
              </Button>
            </div>
          </div>

          <div className="py-3">
            <div
              className={`text-4xl font-mono font-bold tracking-tight transition-colors duration-300 sm:text-5xl ${
                isTimeUp
                  ? "text-red-500 animate-bounce"
                  : isCriticalTime
                    ? "text-amber-400 animate-pulse"
                    : "text-white"
              }`}
            >
              {formatTime(secondsRemaining)}
            </div>
            {isTimeUp && (
              <p className="mt-1 text-xs font-semibold text-red-400">
                ⏰ Time's up! Ready for votes?
              </p>
            )}
          </div>
        </div>

        {/* Tech Clue / Starter Question Card */}
        <Card className="border-zinc-800 bg-zinc-900/60 text-left backdrop-blur-sm">
          <CardContent className="p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400">
                <Sparkles className="size-3.5" />
                Tech Clue Prompt
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNextQuestion}
                className="h-7 gap-1 px-2 text-xs text-zinc-400 hover:text-indigo-300"
              >
                <Dices className="size-3.5" />
                Shuffle
              </Button>
            </div>
            <p className="text-sm font-medium text-zinc-200 leading-relaxed">
              "{TECH_DISCUSSION_QUESTIONS[questionIndex]}"
            </p>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          <Button
            onClick={startVoting}
            className="h-14 w-full rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-lg font-semibold text-white shadow-xl shadow-purple-900/30 transition-all duration-200 hover:from-purple-700 hover:to-indigo-700 hover:scale-[1.02]"
          >
            <Vote className="mr-2.5 size-5" />
            {t("startVoting")}
          </Button>

          <Button
            onClick={endGame}
            variant="ghost"
            className="w-full text-xs text-zinc-500 hover:text-zinc-300"
          >
            <Eye className="mr-1.5 size-3.5" />
            {t("revealImpostor")}
          </Button>
        </div>
      </div>
    </div>
  );
}
