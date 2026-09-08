import { Locale } from "../config/language";
import { getRandomWordWithHints } from "@/src/lib/word-service";
import type {
  Difficulty,
  GameState,
  Player,
  TranslationFunction,
} from "@/src/types/game";
import { create } from "zustand";
import { persist } from "zustand/middleware";

function fisherYatesShuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

interface GameStore {
  gameState: GameState;
  playerNames: string[];
  customCategories: string[];
  lastImpostorId: number | null;
  scores: Record<string, number>;
  crewWins: number;
  impostorWins: number;
  roundsPlayed: number;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;

  setPlayerCount: (count: number, t: TranslationFunction) => void;
  setPlayerName: (index: number, name: string) => void;
  setImpostorCount: (count: number) => void;
  setDifficulty: (difficulty: Difficulty) => void;
  toggleCategory: (category: string) => void;
  addCustomCategory: (category: string) => void;
  setCustomCategory: (category: string) => void;
  removeCustomCategory: (category: string) => void;
  toggleHints: () => void;

  startGame: (t: TranslationFunction, language: Locale) => Promise<void>;
  nextRevealPlayer: () => void;
  startDiscussion: () => void;
  startVoting: () => void;
  castVote: (voterId: number, targetPlayerId: number) => void;
  nextVotingPlayer: () => void;
  resetVoting: () => void;
  recordRoundResult: (
    winner: "crew" | "impostor",
    winningPlayerNames: string[],
  ) => void;
  resetScores: () => void;
  endGame: () => void;
  newGame: () => void;
  setPhase: (phase: GameState["phase"]) => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      gameState: {
        phase: "setup",
        players: [],
        totalPlayers: 3,
        impostorCount: 1,
        currentWord: "",
        currentHints: [],
        currentCategory: "",
        selectedCategories: [
          "ai_concepts",
          "ai_models_tools",
          "tech_hardware",
          "software_dev",
        ],
        customCategory: "",
        difficulty: "medium",
        showHintsToImpostors: true,
        currentRevealIndex: 0,
        currentVotingPlayerIndex: 0,
        votes: {},
        gameStarted: false,
      },

      playerNames: [],
      customCategories: [],
      lastImpostorId: null,
      scores: {},
      crewWins: 0,
      impostorWins: 0,
      roundsPlayed: 0,
      _hasHydrated: false,
      setHasHydrated: state => set({ _hasHydrated: state }),
      setPlayerCount: (count, t) => {
        set(state => {
          const newPlayerNames = Array.from(
            { length: count },
            (_, i) => state.playerNames[i] || `${t("player")} ${i + 1}`,
          );

          return {
            gameState: {
              ...state.gameState,
              totalPlayers: count,
              impostorCount: Math.min(
                state.gameState.impostorCount,
                Math.floor(count / 3),
              ),
            },
            playerNames: newPlayerNames,
          };
        });
      },

      setPlayerName: (index, name) => {
        set(state => {
          const updatedNames = [...state.playerNames];
          updatedNames[index] = name;
          return { playerNames: updatedNames };
        });
      },

      setImpostorCount: count => {
        set(state => ({
          gameState: { ...state.gameState, impostorCount: count },
        }));
      },

      setDifficulty: difficulty => {
        set(state => ({
          gameState: { ...state.gameState, difficulty },
        }));
      },

      toggleCategory: category => {
        set(state => {
          const selected = state.gameState.selectedCategories;
          const newSelected = selected.includes(category)
            ? selected.filter(c => c !== category)
            : [...selected, category];

          return {
            gameState: { ...state.gameState, selectedCategories: newSelected },
          };
        });
      },

      addCustomCategory: category => {
        if (!category.trim()) return;

        set(state => {
          const newCustomCategories = [...state.customCategories];
          if (!newCustomCategories.includes(category)) {
            newCustomCategories.push(category);
          }

          return {
            customCategories: newCustomCategories,
            gameState: {
              ...state.gameState,
              selectedCategories: [
                ...state.gameState.selectedCategories,
                category,
              ],
              customCategory: "",
            },
          };
        });
      },

      removeCustomCategory: category => {
        set(state => {
          const newCustomCategories = state.customCategories.filter(
            c => c !== category,
          );
          const newSelectedCategories =
            state.gameState.selectedCategories.filter(c => c !== category);

          return {
            customCategories: newCustomCategories,
            gameState: {
              ...state.gameState,
              selectedCategories: newSelectedCategories,
            },
          };
        });
      },

      setCustomCategory: category => {
        set(state => ({
          gameState: { ...state.gameState, customCategory: category },
        }));
      },

      toggleHints: () => {
        set(state => ({
          gameState: {
            ...state.gameState,
            showHintsToImpostors: !state.gameState.showHintsToImpostors,
          },
        }));
      },

      setPhase: phase => {
        set(state => ({
          gameState: { ...state.gameState, phase },
        }));
      },

      startGame: async (t: TranslationFunction, language: Locale) => {
        const { gameState, playerNames } = get();

        if (gameState.selectedCategories.length === 0) {
          console.error("No categories selected");
          return;
        }

        const players: Player[] = Array.from(
          { length: gameState.totalPlayers },
          (_, i) => ({
            id: i + 1,
            name: playerNames[i] || `${t("player")} ${i + 1}`,
            role: "player",
          }),
        );

        const availableIndexes = Array.from(
          { length: gameState.totalPlayers },
          (_, i) => i,
        );

        let shuffledIndexes = fisherYatesShuffle(availableIndexes);

        // Streak prevention: if > 2 players and we had an impostor last round, avoid picking the exact same player
        const previousImpostorId = get().lastImpostorId;
        if (gameState.totalPlayers > 2 && previousImpostorId !== null) {
          const lastPlayerIndex = players.findIndex(
            p => p.id === previousImpostorId,
          );
          if (
            lastPlayerIndex !== -1 &&
            shuffledIndexes[0] === lastPlayerIndex
          ) {
            const swapIdx =
              1 + Math.floor(Math.random() * (shuffledIndexes.length - 1));
            [shuffledIndexes[0], shuffledIndexes[swapIdx]] = [
              shuffledIndexes[swapIdx],
              shuffledIndexes[0],
            ];
          }
        }

        for (let i = 0; i < gameState.impostorCount; i++) {
          players[shuffledIndexes[i]].role = "impostor";
        }
        const assignedImpostorId = players[shuffledIndexes[0]].id;

        const randomCategory =
          gameState.selectedCategories[
            Math.floor(Math.random() * gameState.selectedCategories.length)
          ];
        const wordWithHints = await getRandomWordWithHints(
          randomCategory,
          language,
          gameState.difficulty,
        );

        console.log(
          `Starting game with category: ${randomCategory}, word: ${
            wordWithHints.word
          }, hints: ${wordWithHints.hints.join(", ")}`,
        );
        set(state => ({
          lastImpostorId: assignedImpostorId,
          gameState: {
            ...state.gameState,
            phase: "wordreveal",
            gameStarted: true,
            players,
            currentWord: wordWithHints.word,
            currentHints: wordWithHints.hints,
            currentCategory: randomCategory,
            currentRevealIndex: 0,
          },
        }));
      },

      nextRevealPlayer: () => {
        set(state => {
          const nextIndex = state.gameState.currentRevealIndex + 1;
          return {
            gameState: {
              ...state.gameState,
              currentRevealIndex: nextIndex,
            },
          };
        });
      },

      startDiscussion: () => {
        set(state => ({
          gameState: { ...state.gameState, phase: "discussion" },
        }));
      },

      startVoting: () => {
        set(state => ({
          gameState: {
            ...state.gameState,
            phase: "voting",
            currentVotingPlayerIndex: 0,
            votes: {},
          },
        }));
      },

      castVote: (voterId: number, targetPlayerId: number) => {
        set(state => ({
          gameState: {
            ...state.gameState,
            votes: {
              ...state.gameState.votes,
              [voterId]: targetPlayerId,
            },
          },
        }));
      },

      nextVotingPlayer: () => {
        set(state => ({
          gameState: {
            ...state.gameState,
            currentVotingPlayerIndex:
              state.gameState.currentVotingPlayerIndex + 1,
          },
        }));
      },

      resetVoting: () => {
        set(state => ({
          gameState: {
            ...state.gameState,
            currentVotingPlayerIndex: 0,
            votes: {},
          },
        }));
      },

      recordRoundResult: (winner, winningPlayerNames) => {
        set(state => {
          const updatedScores = { ...state.scores };
          winningPlayerNames.forEach(name => {
            const pointsToAdd = winner === "impostor" ? 2 : 1;
            updatedScores[name] = (updatedScores[name] || 0) + pointsToAdd;
          });

          return {
            scores: updatedScores,
            crewWins: winner === "crew" ? state.crewWins + 1 : state.crewWins,
            impostorWins:
              winner === "impostor" ? state.impostorWins + 1 : state.impostorWins,
            roundsPlayed: state.roundsPlayed + 1,
          };
        });
      },

      resetScores: () => {
        set({
          scores: {},
          crewWins: 0,
          impostorWins: 0,
          roundsPlayed: 0,
          lastImpostorId: null,
        });
      },

      endGame: () => {
        set(state => ({
          gameState: { ...state.gameState, phase: "results" },
        }));
      },

      newGame: () => {
        set(state => ({
          gameState: {
            ...state.gameState,
            phase: "setup",
            gameStarted: false,
            currentRevealIndex: 0,
            currentVotingPlayerIndex: 0,
            votes: {},
            players: [],
            currentWord: "",
            currentHints: [],
            currentCategory: "",
          },
        }));
      },
    }),
    {
      name: "party-game-storage",
      version: 2,
      migrate: (persistedState: unknown, version: number) => {
        const state = persistedState as Partial<GameStore>;
        if (version === 0) {
          if (state.gameState) {
            state.gameState.difficulty = "medium";
          }
        }
        if (version < 2) {
          if (state.gameState) {
            state.gameState.selectedCategories = [
              "ai_concepts",
              "ai_models_tools",
              "tech_hardware",
              "software_dev",
            ];
          }
        }
        return state;
      },
      partialize: state =>
        ({
          customCategories: state.customCategories,
          playerNames: state.playerNames,
          scores: state.scores,
          crewWins: state.crewWins,
          impostorWins: state.impostorWins,
          roundsPlayed: state.roundsPlayed,
          gameState: {
            totalPlayers: state.gameState.totalPlayers,
            impostorCount: state.gameState.impostorCount,
            difficulty: state.gameState.difficulty,
            selectedCategories: state.gameState.selectedCategories,
            showHintsToImpostors: state.gameState.showHintsToImpostors,
          },
        }) as unknown as GameStore,
      onRehydrateStorage: () => state => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
