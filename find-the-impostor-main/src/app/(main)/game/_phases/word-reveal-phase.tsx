"use client";

import { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import {
  CheckCircle2,
  Copy,
  Drama,
  Eye,
  EyeOff,
  Maximize2,
  MessageCircle,
  QrCode,
  RotateCcw,
  Smartphone,
  Users,
  Wifi,
  X,
} from "lucide-react";
import { useGameStore } from "@/src/stores/game-store";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

export default function WordRevealPhase() {
  const { gameState, nextRevealPlayer, startDiscussion } = useGameStore();
  const t = useTranslations("WordRevealPhase");

  // Mode: "qr" (scan on mobile) or "device" (pass around host screen)
  const [revealMode, setRevealMode] = useState<"qr" | "device">("qr");

  // Network IP for QR generation
  const [hostAddress, setHostAddress] = useState<string>("");
  const [activeModalPlayerIndex, setActiveModalPlayerIndex] = useState<number | null>(null);

  // Pass-and-play local state
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [randomHint, setRandomHint] = useState<string>("");
  const [revealedPlayers, setRevealedPlayers] = useState<number[]>([]);

  // Track which players have scanned/revealed via QR
  const [scannedPlayerIndexes, setScannedPlayerIndexes] = useState<number[]>([]);

  // Fetch host LAN IP
  useEffect(() => {
    let isMounted = true;
    async function fetchHostIp() {
      try {
        const res = await fetch("/api/network-ip");
        if (res.ok) {
          const data = await res.json();
          if (data.ip && isMounted) {
            const port = window.location.port ? `:${window.location.port}` : "";
            setHostAddress(`http://${data.ip}${port}`);
            return;
          }
        }
      } catch (err) {
        console.warn("Could not fetch server network IP, falling back to window location", err);
      }
      if (isMounted) {
        setHostAddress(window.location.origin);
      }
    }
    fetchHostIp();
    return () => {
      isMounted = false;
    };
  }, []);

  // Generate player secret link
  const getPlayerRevealUrl = useMemo(() => {
    return (index: number) => {
      const player = gameState.players[index];
      if (!player) return "";

      const baseUrl = hostAddress || (typeof window !== "undefined" ? window.location.origin : "");
      const payload = {
        playerName: player.name,
        role: player.role,
        word: gameState.currentWord,
        hints:
          player.role === "impostor" && gameState.showHintsToImpostors
            ? gameState.currentHints
            : [],
        category: gameState.currentCategory,
      };

      try {
        const token = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
        return `${baseUrl}/reveal?d=${token}`;
      } catch {
        return `${baseUrl}/reveal?name=${encodeURIComponent(player.name)}&role=${player.role}&word=${encodeURIComponent(gameState.currentWord)}&category=${encodeURIComponent(gameState.currentCategory)}`;
      }
    };
  }, [hostAddress, gameState.players, gameState.currentWord, gameState.showHintsToImpostors, gameState.currentHints, gameState.currentCategory]);

  const handleToggleScanned = (index: number) => {
    setScannedPlayerIndexes(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index],
    );
  };

  const handleCopyLink = (index: number) => {
    const url = getPlayerRevealUrl(index);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      toast.success(`${gameState.players[index]?.name}'s secret link copied!`);
    }
  };

  // Pass-and-play handlers
  const handleCardSelect = (index: number) => {
    setSelectedCardIndex(index);
    setIsCardFlipped(false);
    window.scrollTo(0, 0);
  };

  const handleCardFlip = () => {
    if (isCardFlipped) return;
    setIsCardFlipped(true);

    const selectedPlayer = selectedCardIndex !== null ? gameState.players[selectedCardIndex] : null;
    if (selectedPlayer?.role === "impostor" && gameState.showHintsToImpostors) {
      const hints = gameState.currentHints;
      const randomIndex = Math.floor(Math.random() * hints.length);
      setRandomHint(hints[randomIndex]);
    }
  };

  const handleNextPlayer = () => {
    if (selectedCardIndex !== null && !revealedPlayers.includes(selectedCardIndex)) {
      setRevealedPlayers([...revealedPlayers, selectedCardIndex]);
    }
    setSelectedCardIndex(null);
    setIsCardFlipped(false);

    if (revealedPlayers.length < gameState.players.length - 1) {
      nextRevealPlayer();
    }
  };

  const allPlayersRevealedPass = revealedPlayers.length >= gameState.players.length;

  return (
    <div className="min-h-dvh p-4 text-white sm:p-6 pb-20">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Top Header & Mode Toggle */}
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="space-y-1 text-center sm:text-left">
            <Badge
              variant="outline"
              className="border-purple-500/30 bg-purple-500/10 text-purple-300"
            >
              Secret Word Reveal
            </Badge>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
              {revealMode === "qr" ? "Scan QR Code on Mobile" : t("chooseYourCard")}
            </h1>
            <p className="text-xs text-zinc-400">
              {revealMode === "qr"
                ? "Each player scans their QR code to view their secret word privately on their phone"
                : t("selectAnyCard")}
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center rounded-xl bg-zinc-900 border border-zinc-800 p-1">
            <button
              onClick={() => setRevealMode("qr")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                revealMode === "qr"
                  ? "bg-purple-600 text-white shadow-md shadow-purple-900/40"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <QrCode className="size-3.5" />
              Mobile QR Code
            </button>
            <button
              onClick={() => setRevealMode("device")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                revealMode === "device"
                  ? "bg-purple-600 text-white shadow-md shadow-purple-900/40"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Users className="size-3.5" />
              Pass & Play
            </button>
          </div>
        </div>

        {/* MODE 1: MOBILE QR CODE REVEAL */}
        {revealMode === "qr" && (
          <div className="space-y-6">
            {/* Host Network Info Banner */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-xs text-zinc-400 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <Wifi className="size-4 text-emerald-400" />
                <span>
                  Connected network URL:{" "}
                  <strong className="text-zinc-200">{hostAddress || "loading..."}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-zinc-700 bg-zinc-800/80 text-zinc-300">
                  {scannedPlayerIndexes.length} of {gameState.players.length} ready
                </Badge>
              </div>
            </div>

            {/* Players QR Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {gameState.players.map((player, index) => {
                const playerUrl = getPlayerRevealUrl(index);
                const isScanned = scannedPlayerIndexes.includes(index);

                return (
                  <Card
                    key={player.id}
                    className={`relative overflow-hidden border transition-all duration-300 ${
                      isScanned
                        ? "border-emerald-500/40 bg-zinc-900/40 opacity-80"
                        : "border-zinc-800 bg-zinc-900/80 hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-950/20"
                    }`}
                  >
                    <CardContent className="p-5 flex flex-col items-center text-center space-y-3">
                      {/* Player Header */}
                      <div className="flex w-full items-center justify-between">
                        <span className="flex size-7 items-center justify-center rounded-full bg-purple-600/20 text-xs font-bold text-purple-300 border border-purple-500/30">
                          {index + 1}
                        </span>
                        <h3 className="font-bold text-base text-white truncate max-w-[150px]">
                          {player.name}
                        </h3>
                        <button
                          onClick={() => handleToggleScanned(index)}
                          title="Mark as scanned"
                          className="text-zinc-400 hover:text-emerald-400 transition-colors"
                        >
                          <CheckCircle2
                            className={`size-5 ${
                              isScanned ? "text-emerald-400 fill-emerald-400/20" : "text-zinc-600"
                            }`}
                          />
                        </button>
                      </div>

                      {/* QR Code Container */}
                      <div
                        onClick={() => setActiveModalPlayerIndex(index)}
                        className="group relative cursor-pointer rounded-2xl bg-white p-3.5 shadow-md shadow-black/40 transition-transform duration-200 hover:scale-[1.03]"
                      >
                        {playerUrl ? (
                          <QRCodeSVG
                            value={playerUrl}
                            size={160}
                            level="M"
                            marginSize={1}
                          />
                        ) : (
                          <div className="size-[160px] flex items-center justify-center text-zinc-400 text-xs">
                            Generating...
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                          <Maximize2 className="size-8 text-white drop-shadow" />
                        </div>
                      </div>

                      <p className="text-[11px] text-zinc-400">
                        Scan with mobile camera to view secret word
                      </p>

                      {/* Action buttons */}
                      <div className="flex w-full items-center gap-2 pt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveModalPlayerIndex(index)}
                          className="flex-1 h-8 text-xs border border-zinc-700/60 bg-zinc-800/60 hover:bg-zinc-700 text-zinc-200"
                        >
                          <Maximize2 className="size-3 mr-1.5" />
                          Enlarge
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyLink(index)}
                          className="h-8 px-2.5 text-xs border border-zinc-700/60 bg-zinc-800/60 hover:bg-zinc-700 text-zinc-300"
                          title="Copy player link"
                        >
                          <Copy className="size-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Ready to proceed bar */}
            <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-950/40 to-indigo-950/40 p-5 backdrop-blur-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <h4 className="font-bold text-white text-base flex items-center justify-center sm:justify-start gap-2">
                  <Smartphone className="size-4 text-purple-400" />
                  All players scanned their secret words?
                </h4>
                <p className="text-xs text-zinc-300">
                  Next: Each player will say a synonym of their word in <strong>2 rounds</strong>!
                </p>
              </div>

              <Button
                onClick={startDiscussion}
                className="h-12 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold text-sm shadow-xl shadow-purple-900/30 hover:scale-[1.02] transition-all shrink-0 w-full sm:w-auto"
              >
                <MessageCircle className="mr-2 size-4" />
                Start 2-Round Synonym Discussion 🗣️
              </Button>
            </div>
          </div>
        )}

        {/* MODE 2: PASS & PLAY REVEAL (Device-based fallback) */}
        {revealMode === "device" && (
          <div>
            {allPlayersRevealedPass ? (
              <div className="flex flex-col items-center justify-center p-8 text-center space-y-6">
                <Users className="size-16 text-emerald-400" />
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">{t("allCardsRevealed")}</h2>
                  <p className="text-zinc-400">{t("everyPlayerSeen")}</p>
                </div>
                <Button
                  onClick={startDiscussion}
                  className="h-12 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  <MessageCircle className="mr-2 size-4" />
                  Start 2-Round Synonym Discussion 🗣️
                </Button>
              </div>
            ) : selectedCardIndex === null ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {gameState.players.map((player, index) => {
                  const hasBeenRevealed = revealedPlayers.includes(index);
                  return (
                    <Card
                      key={index}
                      onClick={() => handleCardSelect(index)}
                      className={`cursor-pointer border transition-all duration-300 ${
                        hasBeenRevealed
                          ? "border-zinc-800 bg-zinc-900/30 opacity-50 pointer-events-none"
                          : "border-zinc-700 bg-zinc-900/80 hover:border-purple-500 hover:scale-105"
                      }`}
                    >
                      <CardContent className="p-6 text-center space-y-3">
                        <div className="mx-auto flex size-14 items-center justify-center rounded-xl bg-purple-600/20 text-purple-300 font-bold text-xl border border-purple-500/30">
                          {hasBeenRevealed ? (
                            <Eye className="size-6 text-zinc-500" />
                          ) : (
                            player.name[0]?.toUpperCase()
                          )}
                        </div>
                        <p className="font-semibold text-white truncate">{player.name}</p>
                        <p className="text-xs text-zinc-400">
                          {hasBeenRevealed ? "Card Seen" : t("tapToReveal")}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="mx-auto max-w-md space-y-6 text-center">
                <h2 className="text-3xl font-extrabold text-white">
                  {gameState.players[selectedCardIndex]?.name}
                </h2>

                <Card
                  onClick={handleCardFlip}
                  className="cursor-pointer border-2 border-zinc-700 bg-zinc-900/90 p-6 min-h-[280px] flex items-center justify-center"
                >
                  <CardContent className="p-4 w-full">
                    {!isCardFlipped ? (
                      <div className="space-y-4">
                        <EyeOff className="size-16 text-zinc-500 mx-auto animate-pulse" />
                        <p className="text-lg font-bold text-zinc-200">{t("readyToReveal")}</p>
                        <p className="text-xs text-zinc-400">Tap to flip</p>
                      </div>
                    ) : gameState.players[selectedCardIndex]?.role === "impostor" ? (
                      <div className="space-y-4">
                        <Drama className="size-14 text-red-400 mx-auto" />
                        <h3 className="text-3xl font-black text-red-400">IMPOSTOR</h3>
                        <p className="text-xs text-zinc-400">You do not know the word!</p>
                        {gameState.showHintsToImpostors && randomHint && (
                          <Badge className="bg-red-950 border-red-700 text-red-300 text-xs">
                            Hint: {randomHint}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Eye className="size-14 text-purple-400 mx-auto" />
                        <p className="text-xs text-zinc-400">{t("yourWordIs")}</p>
                        <h3 className="text-3xl font-black text-purple-300">
                          {gameState.currentWord}
                        </h3>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Button
                  onClick={!isCardFlipped ? handleCardFlip : handleNextPlayer}
                  className="h-12 w-full rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold"
                >
                  {!isCardFlipped ? (
                    <>
                      <RotateCcw className="mr-2 size-4" />
                      {t("flipCard")}
                    </>
                  ) : (
                    t("nextPlayer")
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ENLARGED QR CODE MODAL */}
        {activeModalPlayerIndex !== null && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200"
            onClick={() => setActiveModalPlayerIndex(null)}
          >
            <div
              className="relative w-full max-w-sm rounded-3xl border border-zinc-800 bg-zinc-950 p-6 text-center text-white shadow-2xl shadow-purple-950/50 sm:p-8 space-y-5 animate-in zoom-in-95 duration-200"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setActiveModalPlayerIndex(null)}
                className="absolute right-4 top-4 rounded-full p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                title="Close"
              >
                <X className="size-5" />
              </button>

              <div className="space-y-1">
                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs mx-auto">
                  Player {activeModalPlayerIndex + 1}
                </Badge>
                <h3 className="text-2xl font-black text-white">
                  {gameState.players[activeModalPlayerIndex]?.name}
                </h3>
                <p className="text-xs text-zinc-400">
                  Scan with your mobile camera to see your secret word
                </p>
              </div>

              <div className="mx-auto rounded-2xl bg-white p-5 shadow-2xl shadow-purple-900/30 flex justify-center">
                <QRCodeSVG
                  value={getPlayerRevealUrl(activeModalPlayerIndex)}
                  size={220}
                  level="H"
                  marginSize={1}
                />
              </div>

              <div className="w-full space-y-2 pt-2">
                <Button
                  onClick={() => {
                    handleCopyLink(activeModalPlayerIndex);
                  }}
                  variant="outline"
                  className="w-full h-10 border-zinc-700 bg-zinc-900 text-xs text-zinc-200"
                >
                  <Copy className="size-3.5 mr-2" />
                  Copy Secret Link
                </Button>
                <Button
                  onClick={() => {
                    handleToggleScanned(activeModalPlayerIndex);
                    setActiveModalPlayerIndex(null);
                  }}
                  className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white"
                >
                  <CheckCircle2 className="size-3.5 mr-2" />
                  Done / Mark as Scanned
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
