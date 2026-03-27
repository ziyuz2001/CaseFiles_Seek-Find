import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Lightbulb, Search, Trophy, ArrowRight, RotateCcw, Globe, MapPin, CheckCircle, XCircle, Lock, Unlock, Star, ChevronRight } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { WorldMap, getChineseName } from "./WorldMap";
import { playSoundEffect } from "./soundUtils";
import confetti from "canvas-confetti";

// ─── Types ───────────────────────────────────────────────────────────────────

type Difficulty = "easy" | "medium" | "hard";

interface Level {
  id: number;
  country: string;       // Chinese name (for display)
  mapCountry: string;    // English name (matches topojson geo.properties.name)
  imageUrl: string;
  clues: string[];
  funFact: string;
  difficulty: Difficulty;
}

interface LevelResult {
  levelIndex: number;
  country: string;
  selectedEnglish: string | null;
  correct: boolean;
  points: number;
  cluesUsed: number;
  difficulty: Difficulty;
}

// ─── Game Data ────────────────────────────────────────────────────────────────

const LEVELS: Level[] = [
  // ── Easy ──
  {
    id: 1, difficulty: "easy",
    country: "法国", mapCountry: "France",
    imageUrl: "https://images.unsplash.com/photo-1693320791402-a7417face1a8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    clues: [
      "这个西欧国家的首都是欧洲最浪漫的城市之一",
      "这里有一座由铁构成的世界最著名地标建筑，于1889年建成",
      "这个国家以葡萄酒、奶酪和高级时装享誉全球，是欧洲最大农业国",
    ],
    funFact: "埃菲尔铁塔原计划在1909年拆除，因其可用作无线电天线塔而得以保留至今。",
  },
  {
    id: 2, difficulty: "easy",
    country: "日本", mapCountry: "Japan",
    imageUrl: "https://images.unsplash.com/photo-1730800328179-3fb51d1e0438?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    clues: [
      "这个东亚岛国的樱花季每年春天吸引数百万游客",
      "这里是动漫文化、索尼、丰田等全球知名品牌的故乡",
      "这个国家由四个主要岛屿组成，拥有一座著名的对称火山",
    ],
    funFact: "日本共有约6800个岛屿，其中约430个有人居住。富士山最近一次喷发是在1707年。",
  },
  {
    id: 3, difficulty: "easy",
    country: "美国", mapCountry: "United States of America",
    imageUrl: "https://images.unsplash.com/photo-1635136397086-e3ce828d3876?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    clues: [
      "这个国家有一处壮观的红色大峡谷，深达1600米",
      "好莱坞、硅谷和百老汇都位于这个国家",
      "这个由50个州组成的联邦国家有一座举世闻名的自由女神像",
    ],
    funFact: "科罗拉多大峡谷有约17亿年历史的岩层，科罗拉多河用了500-600万年的时间切割形成了它。",
  },
  // ── Medium ──
  {
    id: 4, difficulty: "medium",
    country: "埃及", mapCountry: "Egypt",
    imageUrl: "https://images.unsplash.com/photo-1630776212743-6d31601fd616?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    clues: [
      "这个北非国家是人类最古老文明之一的发源地",
      "这里有人类有史以来建造的最大石头建筑群，已矗立超过4500年",
      "尼罗河流经这片沙漠国家，一旁有神秘的狮身人面像守护",
    ],
    funFact: "吉萨大金字塔原高146.5米，使用了约230万块石头，每块重达2.5至15吨。",
  },
  {
    id: 5, difficulty: "medium",
    country: "巴西", mapCountry: "Brazil",
    imageUrl: "https://images.unsplash.com/photo-1599128971079-281d0da05544?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    clues: [
      "这个南美国家拥有全球最大的热带雨林——亚马逊雨林",
      "这里有一座俯瞰海湾的巨型基督张臂雕像，是世界七大奇迹之一",
      "这个国家举办世界上最大的嘉年华（狂欢节），足球文化风靡全球",
    ],
    funFact: "亚马逊雨林产生的氧气占地球20%以上，被称为'地球之肺'。里约基督像高30米。",
  },
  {
    id: 6, difficulty: "medium",
    country: "澳大利亚", mapCountry: "Australia",
    imageUrl: "https://images.unsplash.com/photo-1695018228065-2e0026c654af?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    clues: [
      "这个大洋洲国家既是一个大陆也是一个国家，全球独此一份",
      "这里拥有全球最大的珊瑚礁系统——大堡礁，绵延约2300公里",
      "袋鼠和考拉是这个国家的标志性动物，其最大城市有一座著名的贝壳形歌剧院",
    ],
    funFact: "悉尼歌剧院的屋顶由超过一百万块瑞典制造的瓷砖拼成，每块都经过特殊处理以自洁。",
  },
  // ── Hard ──
  {
    id: 7, difficulty: "hard",
    country: "冰岛", mapCountry: "Iceland",
    imageUrl: "https://images.unsplash.com/photo-1604403667191-ace082e0cf02?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    clues: [
      "这个北大西洋岛国是地球上观看极光最佳的地点之一",
      "这里有大量活火山、间歇泉和冰川，地热能源极为丰富",
      "这个人口约37万的北欧国家从名字看似极寒，实际气候因洋流影响比邻国格陵兰温和得多",
    ],
    funFact: "冰岛99%的电力来自可再生能源（地热和水力发电），是世界上最环保的国家之一。",
  },
  {
    id: 8, difficulty: "hard",
    country: "摩洛哥", mapCountry: "Morocco",
    imageUrl: "https://images.unsplash.com/photo-1716146755954-4f197a5b6031?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    clues: [
      "这个北非国家的迷宫式古城麦地那被列为联合国世界文化遗产",
      "撒哈拉大沙漠的北端延伸至这个国家境内，是骑骆驼游沙漠的热门目的地",
      "阿拉伯文化与柏柏尔文化在这里深度交融，手工皮革、地毯和香料贸易闻名于世",
    ],
    funFact: "摩洛哥的非斯古城（Fes el-Bali）建于公元789年，其染坊是世界上最古老的皮革作坊之一。",
  },
  {
    id: 9, difficulty: "hard",
    country: "越南", mapCountry: "Vietnam",
    imageUrl: "https://images.unsplash.com/photo-1759853713088-44c5dfeb266d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    clues: [
      "这个东南亚国家的海湾中有逾3000个石灰岩小岛，被列为世界自然遗产",
      "法国殖民历史为这里留下了法棍面包、咖啡馆等独特饮食文化",
      "这个南北狭长的S形国家在20世纪下半叶经历了长达数十年的战争后走向统一",
    ],
    funFact: "下龙湾的'下龙'在越南语中意为'龙下降之处'，当地传说是神龙喷玉而形成的岛屿群。",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DIFFICULTY_CONFIG = {
  easy:   { label: "简单", color: "text-emerald-400", bg: "bg-emerald-500/20 border-emerald-500/40", dot: "bg-emerald-400", gradient: "from-emerald-900/40", icon: "🟢" },
  medium: { label: "中级", color: "text-amber-400",   bg: "bg-amber-500/20 border-amber-500/40",   dot: "bg-amber-400",   gradient: "from-amber-900/40",   icon: "🟡" },
  hard:   { label: "困难", color: "text-red-400",     bg: "bg-red-500/20 border-red-500/40",       dot: "bg-red-400",     gradient: "from-red-900/40",     icon: "🔴" },
};

function getDifficulty(levelIndex: number): Difficulty {
  if (levelIndex < 3) return "easy";
  if (levelIndex < 6) return "medium";
  return "hard";
}

function calcPoints(cluesUsed: number): number {
  if (cluesUsed === 1) return 30;
  if (cluesUsed === 2) return 20;
  return 10;
}

function fireConfetti() {
  confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ["#22c55e", "#f59e0b", "#6366f1", "#ec4899"] });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DifficultyBadge({ d, size = "sm" }: { d: Difficulty; size?: "sm" | "md" }) {
  const cfg = DIFFICULTY_CONFIG[d];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${cfg.bg} ${size === "md" ? "text-sm" : "text-xs"}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      <span className={cfg.color}>{cfg.label}</span>
    </span>
  );
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: total }, (_, i) => {
        const d = getDifficulty(i);
        const cfg = DIFFICULTY_CONFIG[d];
        const done = i < current;
        const active = i === current;
        return (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
              done ? cfg.dot : active ? `${cfg.dot} opacity-70 animate-pulse` : "bg-white/10"
            }`}
          />
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function GameCard() {
  const [gameState, setGameState] = useState<"welcome" | "playing" | "result">("welcome");
  const [currentLevel, setCurrentLevel] = useState(0);
  const [score, setScore] = useState(0);
  const [revealedClues, setRevealedClues] = useState<number[]>([0]);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [results, setResults] = useState<LevelResult[]>([]);
  const [activeTab, setActiveTab] = useState<"clues" | "map">("clues");
  const [showTransition, setShowTransition] = useState(false);
  const [transitionDiff, setTransitionDiff] = useState<Difficulty>("medium");
  const scoreRef = useRef(0);

  const level = LEVELS[currentLevel];
  const diff = level?.difficulty;

  const startGame = () => {
    playSoundEffect("start");
    setGameState("playing");
    setCurrentLevel(0);
    setScore(0);
    scoreRef.current = 0;
    setRevealedClues([0]);
    setSelectedCountry(null);
    setAnswered(false);
    setIsCorrect(false);
    setEarnedPoints(0);
    setResults([]);
    setActiveTab("clues");
  };

  const revealNextClue = () => {
    if (revealedClues.length < level.clues.length && !answered) {
      playSoundEffect("clue");
      setRevealedClues(prev => [...prev, prev.length]);
    }
  };

  const handleCountryClick = (name: string) => {
    if (answered) return;
    playSoundEffect("click");
    setSelectedCountry(name);
    setActiveTab("map");
  };

  const handleSubmit = () => {
    if (!selectedCountry || answered) return;

    const correct = selectedCountry === level.mapCountry;
    const pts = correct ? calcPoints(revealedClues.length) : 0;

    setAnswered(true);
    setIsCorrect(correct);
    setEarnedPoints(pts);
    scoreRef.current += pts;
    setScore(scoreRef.current);

    if (correct) {
      playSoundEffect("correct");
      setTimeout(fireConfetti, 200);
    } else {
      playSoundEffect("wrong");
    }

    setResults(prev => [...prev, {
      levelIndex: currentLevel,
      country: level.country,
      selectedEnglish: selectedCountry,
      correct,
      points: pts,
      cluesUsed: revealedClues.length,
      difficulty: level.difficulty,
    }]);
  };

  const nextLevel = () => {
    playSoundEffect("click");
    const nextIdx = currentLevel + 1;

    if (nextIdx >= LEVELS.length) {
      playSoundEffect("complete");
      setTimeout(fireConfetti, 100);
      setGameState("result");
      return;
    }

    // Check difficulty transition
    const currentDiff = getDifficulty(currentLevel);
    const nextDiff = getDifficulty(nextIdx);
    if (currentDiff !== nextDiff) {
      setTransitionDiff(nextDiff);
      setShowTransition(true);
      setTimeout(() => {
        setShowTransition(false);
        advanceToLevel(nextIdx);
      }, 2200);
    } else {
      advanceToLevel(nextIdx);
    }
  };

  const advanceToLevel = (idx: number) => {
    setCurrentLevel(idx);
    setRevealedClues([0]);
    setSelectedCountry(null);
    setAnswered(false);
    setIsCorrect(false);
    setEarnedPoints(0);
    setActiveTab("clues");
  };

  // ── Welcome Screen ──────────────────────────────────────────────────────────
  if (gameState === "welcome") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "linear-gradient(135deg, #070d1a 0%, #0f1f3d 50%, #0d1a30 100%)" }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl w-full"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4"
              style={{ background: "linear-gradient(135deg, #1e3a5f, #2d5a8e)" }}
            >
              <Search className="w-10 h-10 text-amber-400" />
            </motion.div>
            <h1 className="text-white mb-2" style={{ fontSize: "2rem" }}>🌍 环球侦探</h1>
            <p className="text-slate-400">GeoGuessr 风格 · 地图点击 · 三级难度</p>
          </div>

          {/* Difficulty preview */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {(["easy", "medium", "hard"] as Difficulty[]).map((d, di) => {
              const cfg = DIFFICULTY_CONFIG[d];
              const levelSlice = LEVELS.filter(l => l.difficulty === d);
              return (
                <motion.div
                  key={d}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + di * 0.1 }}
                  className={`rounded-xl border p-4 ${cfg.bg}`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                    <span className={`text-sm font-semibold ${cfg.color}`}>{cfg.label}</span>
                  </div>
                  <div className="space-y-1">
                    {levelSlice.map(l => (
                      <div key={l.id} className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Globe className="w-3 h-3" />
                        {l.country}
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Rules */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="rounded-xl border border-white/10 bg-white/5 p-5 mb-6 space-y-2"
          >
            <h3 className="text-white text-sm font-semibold flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              游戏规则
            </h3>
            {[
              "查看图片线索，阅读文字提示，在世界地图上点击你认为的正确国家",
              "线索越少答对，得分越高：1条→30分，2条→20分，3条→10分",
              "可滚轮缩放地图，拖拽平移，精准点击目标国家后点击「确认答案」",
              "共9关，简单→中级→困难，考验你的地理知识！",
            ].map((r, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-slate-400">
                <span className="text-amber-500 mt-0.5">•</span>
                {r}
              </div>
            ))}
          </motion.div>

          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            onClick={startGame}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition-all"
            style={{ background: "linear-gradient(135deg, #1d4ed8, #7c3aed)" }}
          >
            开始侦探之旅
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // ── Final Result Screen ─────────────────────────────────────────────────────
  if (gameState === "result") {
    const maxScore = LEVELS.length * 30;
    const pct = Math.round((score / maxScore) * 100);
    const byDiff = (d: Difficulty) => results.filter(r => r.difficulty === d);
    const rating = pct >= 90 ? { text: "地理大师！", emoji: "🏆", color: "text-amber-400" }
      : pct >= 70 ? { text: "探险家！", emoji: "🌟", color: "text-blue-400" }
      : pct >= 50 ? { text: "地图爱好者！", emoji: "🗺️", color: "text-emerald-400" }
      : { text: "继续探索！", emoji: "🔍", color: "text-slate-400" };

    return (
      <div className="min-h-screen p-4 py-8" style={{ background: "linear-gradient(135deg, #070d1a 0%, #0f1f3d 50%, #0d1a30 100%)" }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl mx-auto"
        >
          {/* Score hero */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-4"
              style={{ background: "linear-gradient(135deg, #1e3a5f, #2d5a8e)" }}
            >
              <Trophy className="w-12 h-12 text-amber-400" />
            </motion.div>
            <h2 className="text-white mb-1" style={{ fontSize: "1.75rem" }}>任务完成！</h2>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className={`text-5xl font-bold mb-1 ${rating.color}`}>{score}<span className="text-2xl text-slate-500 ml-1">/ {maxScore}</span></div>
              <div className="text-slate-400 text-sm">准确率 {pct}% · {rating.emoji} {rating.text}</div>
            </motion.div>
          </div>

          {/* By difficulty */}
          {(["easy", "medium", "hard"] as Difficulty[]).map((d, di) => {
            const cfg = DIFFICULTY_CONFIG[d];
            const dResults = byDiff(d);
            const dScore = dResults.reduce((s, r) => s + r.points, 0);
            return (
              <motion.div
                key={d}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + di * 0.1 }}
                className={`rounded-xl border p-4 mb-3 ${cfg.bg}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                    <span className={`font-semibold text-sm ${cfg.color}`}>{cfg.label}</span>
                  </div>
                  <span className="text-white text-sm">{dScore} / 90 分</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {dResults.map((r, ri) => (
                    <div key={ri} className="bg-white/5 rounded-lg p-2 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-slate-300 truncate">{r.country}</span>
                        {r.correct ? <CheckCircle className="w-3 h-3 text-emerald-400 flex-shrink-0" /> : <XCircle className="w-3 h-3 text-red-400 flex-shrink-0" />}
                      </div>
                      <div className="text-slate-500">
                        {r.correct ? `+${r.points}分 · ${r.cluesUsed}条线索` : `选了: ${getChineseName(r.selectedEnglish || "")}`}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            onClick={startGame}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 rounded-xl text-white font-semibold flex items-center justify-center gap-2 mt-4"
            style={{ background: "linear-gradient(135deg, #1d4ed8, #7c3aed)" }}
          >
            <RotateCcw className="w-5 h-5" />
            再挑战一次
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // ── Difficulty Transition Overlay ──────────────────────────────────────────
  if (showTransition) {
    const tcfg = DIFFICULTY_CONFIG[transitionDiff];
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #070d1a 0%, #0f1f3d 100%)" }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-6xl mb-4"
          >
            {tcfg.icon}
          </motion.div>
          <div className={`text-4xl font-bold mb-2 ${tcfg.color}`}>进入{tcfg.label}难度！</div>
          <div className="text-slate-400">准备好了吗？</div>
          <motion.div
            className={`h-1 mx-auto mt-6 rounded-full ${tcfg.dot}`}
            initial={{ width: 0 }}
            animate={{ width: 200 }}
            transition={{ duration: 2, ease: "linear" }}
          />
        </motion.div>
      </div>
    );
  }

  // ── Playing Screen ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg, #070d1a 0%, #0f1f3d 50%, #0d1a30 100%)" }}>

      {/* ── Top Header ── */}
      <div className="sticky top-0 z-20 border-b border-white/10 backdrop-blur-md" style={{ background: "rgba(7,13,26,0.85)" }}>
        <div className="max-w-7xl mx-auto px-4 py-2">
          {/* Row 1: branding + score */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-amber-400" />
              <span className="text-white font-semibold hidden sm:block">环球侦探</span>
              <DifficultyBadge d={diff} size="md" />
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-amber-400 font-bold text-xl leading-none">{score}</div>
                <div className="text-slate-500 text-xs">总分</div>
              </div>
            </div>
          </div>
          {/* Row 2: progress + level */}
          <div className="flex items-center gap-3">
            <span className="text-slate-500 text-xs whitespace-nowrap">第 {currentLevel + 1} / 9 关</span>
            <ProgressBar current={currentLevel} total={9} />
          </div>
        </div>
      </div>

      {/* ── Mobile Tab Bar ── */}
      <div className="flex lg:hidden border-b border-white/10" style={{ background: "rgba(7,13,26,0.9)" }}>
        {(["clues", "map"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 text-sm font-medium transition-all ${
              activeTab === tab
                ? "text-white border-b-2 border-blue-500"
                : "text-slate-500"
            }`}
          >
            {tab === "clues" ? "📋 线索与图片" : "🗺️ 世界地图"}
          </button>
        ))}
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full px-4 py-4 gap-4">

        {/* ── Left: Clue Panel ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentLevel}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.4 }}
            className={`lg:w-80 xl:w-96 flex-shrink-0 flex flex-col gap-3 ${activeTab === "map" ? "hidden lg:flex" : "flex"}`}
          >
            {/* Image */}
            <div className="relative rounded-xl overflow-hidden">
              <ImageWithFallback
                src={level.imageUrl}
                alt={`关卡 ${currentLevel + 1} 线索图片`}
                className="w-full object-cover"
                style={{ height: "220px" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute top-2 left-2">
                <DifficultyBadge d={diff} />
              </div>
              <div className="absolute bottom-2 left-2 right-2">
                <div className="text-white text-xs opacity-70 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  这是哪个国家？在地图上点击作答
                </div>
              </div>
            </div>

            {/* Clues */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex-1">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white text-sm font-semibold flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  文字线索
                </h3>
                {revealedClues.length < level.clues.length && !answered && (
                  <button
                    onClick={revealNextClue}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg border border-amber-500/40 text-amber-400 hover:bg-amber-500/10 transition"
                  >
                    <Unlock className="w-3 h-3" />
                    揭示线索 ({-calcPoints(revealedClues.length + 1) + calcPoints(revealedClues.length)} 分)
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {level.clues.map((clue, i) => {
                  const revealed = revealedClues.includes(i);
                  return (
                    <AnimatePresence key={i}>
                      {revealed ? (
                        <motion.div
                          initial={{ opacity: 0, height: 0, y: -8 }}
                          animate={{ opacity: 1, height: "auto", y: 0 }}
                          transition={{ duration: 0.35 }}
                          className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20"
                        >
                          <span className="text-amber-400 text-xs font-bold mt-0.5 flex-shrink-0">#{i + 1}</span>
                          <p className="text-slate-300 text-sm leading-relaxed">{clue}</p>
                        </motion.div>
                      ) : (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/10">
                          <Lock className="w-3 h-3 text-slate-600 flex-shrink-0" />
                          <p className="text-slate-600 text-sm italic">线索 {i + 1} 未解锁</p>
                        </div>
                      )}
                    </AnimatePresence>
                  );
                })}
              </div>

              {/* Score preview */}
              {!answered && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">当前可得</span>
                    <span className="text-amber-400 font-semibold">
                      {selectedCountry ? `${calcPoints(revealedClues.length)} 分` : "选择国家后确认"}
                    </span>
                  </div>
                </div>
              )}

              {/* Fun fact after answer */}
              {answered && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 pt-3 border-t border-white/10"
                >
                  <div className="flex items-start gap-2 text-xs">
                    <Star className="w-3 h-3 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-slate-400 leading-relaxed">{level.funFact}</p>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* ── Right: Map Panel ── */}
        <div className={`flex-1 flex flex-col gap-3 min-w-0 ${activeTab === "clues" ? "hidden lg:flex" : "flex"}`}>
          {/* Map */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`map-${currentLevel}`}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="flex-1 flex flex-col gap-3"
            >
              {/* Map container */}
              <div className="flex-1 rounded-xl overflow-hidden" style={{ minHeight: "300px" }}>
                <WorldMap
                  selectedCountry={selectedCountry}
                  correctCountry={answered ? level.mapCountry : null}
                  wrongCountry={answered && !isCorrect ? selectedCountry : null}
                  onCountryClick={handleCountryClick}
                  disabled={answered}
                />
              </div>

              {/* Selection + submit row */}
              <div className="flex items-center gap-3">
                <div className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 flex items-center gap-2 min-w-0">
                  <MapPin className={`w-4 h-4 flex-shrink-0 ${selectedCountry ? "text-amber-400" : "text-slate-600"}`} />
                  {selectedCountry ? (
                    <div className="min-w-0">
                      <div className="text-white text-sm truncate">{getChineseName(selectedCountry)}</div>
                      {getChineseName(selectedCountry) !== selectedCountry && (
                        <div className="text-slate-500 text-xs truncate">{selectedCountry}</div>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-500 text-sm">点击地图选择国家</span>
                  )}
                </div>
                {!answered && (
                  <button
                    onClick={handleSubmit}
                    disabled={!selectedCountry}
                    className={`px-5 py-3 rounded-xl font-semibold text-sm transition-all flex-shrink-0 ${
                      selectedCountry
                        ? "text-white shadow-lg hover:scale-105 active:scale-95"
                        : "bg-white/10 text-slate-600 cursor-not-allowed"
                    }`}
                    style={selectedCountry ? { background: "linear-gradient(135deg, #1d4ed8, #7c3aed)" } : {}}
                  >
                    确认答案
                  </button>
                )}
              </div>

              {/* Answer result */}
              <AnimatePresence>
                {answered && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={`rounded-xl border p-4 ${
                      isCorrect
                        ? "bg-emerald-500/10 border-emerald-500/40"
                        : "bg-red-500/10 border-red-500/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {isCorrect ? (
                          <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
                        )}
                        <div>
                          <div className={`font-semibold ${isCorrect ? "text-emerald-300" : "text-red-300"}`}>
                            {isCorrect ? "回答正确！" : `答错了！正确答案是：${level.country}`}
                          </div>
                          <div className="text-slate-400 text-sm mt-0.5">
                            {isCorrect ? `使用了 ${revealedClues.length} 条线索` : `你选了：${getChineseName(selectedCountry || "")}`}
                          </div>
                        </div>
                      </div>
                      {isCorrect && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
                          className="text-right flex-shrink-0"
                        >
                          <div className="text-amber-400 font-bold text-2xl">+{earnedPoints}</div>
                          <div className="text-slate-500 text-xs">分</div>
                        </motion.div>
                      )}
                    </div>

                    <button
                      onClick={nextLevel}
                      className="mt-4 w-full py-2.5 rounded-lg text-white font-medium text-sm flex items-center justify-center gap-2 transition hover:opacity-90"
                      style={{ background: "linear-gradient(135deg, #1d4ed8, #7c3aed)" }}
                    >
                      {currentLevel < LEVELS.length - 1 ? (
                        <>下一关 <ChevronRight className="w-4 h-4" /></>
                      ) : (
                        <>查看最终结果 <Trophy className="w-4 h-4" /></>
                      )}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}