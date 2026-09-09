"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Eye, EyeOff, Drama, ShieldAlert, Sparkles, Volume2, CheckCircle2 } from "lucide-react";

interface RevealData {
  playerName: string;
  role: "player" | "impostor";
  word: string;
  hints?: string[];
  category?: string;
}

function RevealContent() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<RevealData | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const encoded = searchParams.get("d");
      if (encoded) {
        // Decode base64
        const jsonStr = decodeURIComponent(escape(atob(encoded)));
        const parsed = JSON.parse(jsonStr) as RevealData;
        setData(parsed);
      } else {
        const name = searchParams.get("name") || "Player";
        const role = (searchParams.get("role") || "player") as "player" | "impostor";
        const word = searchParams.get("word") || "Unknown";
        const category = searchParams.get("category") || "General";
        const hintsParam = searchParams.get("hints");
        const hints = hintsParam ? hintsParam.split(",") : [];

        setData({
          playerName: name,
          role,
          word,
          hints,
          category,
        });
      }
    } catch (e) {
      console.error("Failed to decode player secret", e);
      setError("Unable to decode secret word card. Please rescan your QR code.");
    }
  }, [searchParams]);

  const handleToggleReveal = () => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(40);
    }
    setIsRevealed(prev => !prev);
  };

  if (error) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center p-6 text-center text-white">
        <ShieldAlert className="size-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Scan Error</h1>
        <p className="text-zinc-400 max-w-sm mb-6">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-6 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
          <p className="text-sm text-zinc-400">Loading your secret role...</p>
        </div>
      </div>
    );
  }

  const isImpostor = data.role === "impostor";

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center p-4 text-white sm:p-6 select-none">
      <div className="mx-auto w-full max-w-md space-y-6 text-center">
        {/* Top Header */}
        <div className="space-y-1">
          <Badge
            variant="outline"
            className="border-purple-500/30 bg-purple-500/10 text-purple-300 px-3 py-1"
          >
            📱 Secret Player Card
          </Badge>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            {data.playerName}
          </h1>
          <p className="text-xs text-zinc-400">
            Keep this screen private from other players!
          </p>
        </div>

        {/* Interactive Reveal Card */}
        <Card
          onClick={handleToggleReveal}
          className={`cursor-pointer border-2 transition-all duration-300 ${
            isRevealed
              ? isImpostor
                ? "border-red-500/50 bg-red-950/30 shadow-2xl shadow-red-950/50"
                : "border-purple-500/50 bg-zinc-900/90 shadow-2xl shadow-purple-950/50"
              : "border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 active:scale-95"
          }`}
        >
          <CardContent className="p-8 flex flex-col items-center justify-center min-h-[320px]">
            {!isRevealed ? (
              <div className="space-y-4 text-center">
                <div className="mx-auto flex size-24 items-center justify-center rounded-full bg-zinc-800/80 border border-zinc-700 shadow-inner">
                  <EyeOff className="size-12 text-zinc-500 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-bold text-white">Tap to Reveal</p>
                  <p className="text-xs text-zinc-400">
                    Make sure nobody is looking at your screen
                  </p>
                </div>
              </div>
            ) : isImpostor ? (
              <div className="space-y-5 text-center w-full animate-in fade-in zoom-in-95 duration-200">
                <div className="mx-auto flex size-20 items-center justify-center rounded-full border-2 border-red-500 bg-red-600/20 shadow-lg shadow-red-500/20">
                  <Drama className="size-10 text-red-400" />
                </div>

                <div className="space-y-1">
                  <Badge className="bg-red-500/20 text-red-300 border-red-500/40 text-xs px-2.5 py-0.5 uppercase tracking-widest font-bold">
                    SECRET ROLE
                  </Badge>
                  <h2 className="text-4xl font-black tracking-wider text-red-400 drop-shadow">
                    IMPOSTOR
                  </h2>
                  <p className="text-xs text-red-200/80">
                    You do not know the secret word!
                  </p>
                </div>

                {data.category && (
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 text-xs text-zinc-400">
                    Category: <span className="font-semibold text-white capitalize">{data.category.replace(/_/g, " ")}</span>
                  </div>
                )}

                {data.hints && data.hints.length > 0 && (
                  <div className="space-y-1 text-left rounded-xl border border-red-900/40 bg-red-950/20 p-3">
                    <p className="text-[11px] font-semibold text-red-300 flex items-center gap-1">
                      <Sparkles className="size-3" /> Impostor Clues / Hints:
                    </p>
                    <p className="text-xs text-zinc-300 italic">
                      {data.hints.join(" • ")}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-5 text-center w-full animate-in fade-in zoom-in-95 duration-200">
                <div className="mx-auto flex size-20 items-center justify-center rounded-full border-2 border-purple-500 bg-purple-600/20 shadow-lg shadow-purple-500/20">
                  <Eye className="size-10 text-purple-400" />
                </div>

                <div className="space-y-1">
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-xs px-2.5 py-0.5 uppercase tracking-widest font-bold">
                    CREW MEMBER
                  </Badge>
                  <p className="text-xs text-zinc-400">Your Secret Word is</p>
                  <h2 className="text-4xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-white to-indigo-300 drop-shadow-md">
                    {data.word}
                  </h2>
                </div>

                {data.category && (
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 text-xs text-zinc-400">
                    Category: <span className="font-semibold text-white capitalize">{data.category.replace(/_/g, " ")}</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Synonym Rounds Instructions */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4 text-left space-y-2.5 text-xs backdrop-blur-sm">
          <p className="font-semibold text-purple-300 flex items-center gap-1.5">
            <Volume2 className="size-4 text-purple-400" />
            Game Rules for 2 Rounds:
          </p>
          <ul className="space-y-2 text-zinc-300">
            <li className="flex items-start gap-2">
              <span className="flex size-4 items-center justify-center rounded-full bg-purple-500/20 text-[10px] font-bold text-purple-400 shrink-0 mt-0.5">
                1
              </span>
              <span><strong>Round 1 (First Synonym):</strong> Speak 1 word/synonym that relates to your word.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex size-4 items-center justify-center rounded-full bg-indigo-500/20 text-[10px] font-bold text-indigo-400 shrink-0 mt-0.5">
                2
              </span>
              <span><strong>Round 2 (Second Synonym):</strong> Speak a second synonym to prove your innocence or bluff!</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex size-4 items-center justify-center rounded-full bg-emerald-500/20 text-[10px] font-bold text-emerald-400 shrink-0 mt-0.5">
                3
              </span>
              <span><strong>Voting:</strong> Everyone votes for the impostor. If you correctly guess the impostor, you WIN!</span>
            </li>
          </ul>
        </div>

        {/* Hide / Reveal Button */}
        <Button
          onClick={handleToggleReveal}
          className={`h-12 w-full rounded-xl font-medium transition-all ${
            isRevealed
              ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
              : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-900/30"
          }`}
        >
          {isRevealed ? (
            <>
              <EyeOff className="mr-2 size-4" />
              Hide Secret Word
            </>
          ) : (
            <>
              <Eye className="mr-2 size-4" />
              Tap to Reveal Word
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default function RevealPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center p-6 text-white">
          <div className="size-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
        </div>
      }
    >
      <RevealContent />
    </Suspense>
  );
}
