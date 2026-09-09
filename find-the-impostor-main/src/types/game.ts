import { Locale } from "../config/language";

export type Difficulty = "easy" | "medium" | "hard";

export type TranslationFunction = (key: string) => string;

export interface Player {
  id: number;
  name: string;
  role: "player" | "impostor";
}

export interface WordWithHints {
  word: string;
  hints: string[];
}

export interface WordSet {
  id: string;
  category: string;
  wordsWithHints: WordWithHints[];
  language: Locale;
  createdAt: Date;
  usageCount?: number;
}

export interface RoundSummary {
  impostorIds: number[];
  impostorNames: string[];
  correctGuesserIds: number[];
  correctGuesserNames: string[];
  fooledPlayerNames: string[];
  votes: Record<number, number>; // voterId -> targetId
  impostorWon: boolean;
  word: string;
  category: string;
}

export interface GameState {
  phase: "setup" | "wordreveal" | "discussion" | "voting" | "results";
  players: Player[];
  totalPlayers: number;
  impostorCount: number;
  currentWord: string;
  currentHints: string[];
  currentCategory: string;
  selectedCategories: string[];
  customCategory: string;
  difficulty: Difficulty;
  showHintsToImpostors: boolean;
  currentRevealIndex: number;
  currentVotingPlayerIndex: number;
  votes: Record<number, number>; // voterId -> suspectPlayerId
  gameStarted: boolean;
  lastRoundSummary?: RoundSummary | null;
}

