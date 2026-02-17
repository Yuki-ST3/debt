"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Lock,
  ChevronRight,
  CheckCircle,
  Phone,
  Mail,
  MapPin,
  User,
  TrendingDown,
  Heart,
  Loader2,
  MessageCircle,
  ArrowDownRight,
} from "lucide-react";

/* ─────────────────────── 定数 ─────────────────────── */

const PREFECTURES = [
  "北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県",
  "茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県",
  "新潟県","富山県","石川県","福井県","山梨県","長野県","岐阜県",
  "静岡県","愛知県","三重県","滋賀県","京都府","大阪府","兵庫県",
  "奈良県","和歌山県","鳥取県","島根県","岡山県","広島県","山口県",
  "徳島県","香川県","愛媛県","高知県","福岡県","佐賀県","長崎県",
  "熊本県","大分県","宮崎県","鹿児島県","沖縄県",
];

type Step = "welcome" | "q1" | "q2" | "q3" | "empathy" | "loading" | "result";

/* ─────────────────── 結果シミュレーション ─────────────────── */

function getResults(amount: string, period: string, status: string) {
  let before = 4;
  let after = 1.5;

  switch (amount) {
    case "50万円未満":
      before = 2;
      after = 0.8;
      break;
    case "50〜100万円":
      before = 4;
      after = 1.5;
      break;
    case "100〜200万円":
      before = 6;
      after = 2;
      break;
    case "200万円以上":
      before = 8;
      after = 3;
      break;
  }

  // 返済状況が厳しいほど減額幅を少し上乗せ
  if (status === "かなりきつい") after = Math.max(after - 0.5, 0.5);
  if (status === "返済不可") after = Math.max(after - 1, 0.3);

  const hasOverpayment = period === "5年以上";

  return {
    before,
    after,
    savings: +(before - after).toFixed(1),
    reductionRate: Math.round(((before - after) / before) * 100),
    hasOverpayment,
  };
}

/* ─────────────────── アニメーション定義 ─────────────────── */

const pageVariants = {
  initial: { opacity: 0, y: 24, scale: 0.98 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
  },
  exit: {
    opacity: 0,
    y: -16,
    scale: 0.98,
    transition: { duration: 0.3 },
  },
};

const staggerChildren = {
  animate: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

/* ─────────────────── メインコンポーネント ─────────────────── */

export default function DebtSimulator() {
  const [step, setStep] = useState<Step>("welcome");
  const [answers, setAnswers] = useState({
    amount: "",
    period: "",
    status: "",
  });
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    prefecture: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingPhase, setLoadingPhase] = useState(0);
  const [showEmpathyText, setShowEmpathyText] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  /* ── ローディング演出 ── */
  useEffect(() => {
    if (step !== "loading") return;
    setLoadingPhase(0);
    const t1 = setTimeout(() => setLoadingPhase(1), 1500);
    const t2 = setTimeout(() => setStep("result"), 3200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [step]);

  /* ── 共感ステップの自動進行 ── */
  useEffect(() => {
    if (step !== "empathy") return;
    setShowEmpathyText(false);
    const t1 = setTimeout(() => setShowEmpathyText(true), 900);
    const t2 = setTimeout(() => setStep("loading"), 3800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [step]);

  /* ── ハンドラー ── */
  const handleQ1 = (value: string) => {
    setAnswers((prev) => ({ ...prev, amount: value }));
    setTimeout(() => setStep("q2"), 350);
  };

  const handleQ2 = (value: string) => {
    setAnswers((prev) => ({ ...prev, period: value }));
    setTimeout(() => setStep("q3"), 350);
  };

  const handleQ3 = (value: string) => {
    setAnswers((prev) => ({ ...prev, status: value }));
    if (value === "かなりきつい" || value === "返済不可") {
      setTimeout(() => setStep("empathy"), 350);
    } else {
      setTimeout(() => setStep("loading"), 350);
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "お名前を入力してください";
    if (!form.phone.trim()) {
      errs.phone = "電話番号を入力してください";
    } else if (!/^[\d\-]{10,13}$/.test(form.phone.replace(/\s/g, ""))) {
      errs.phone = "正しい電話番号を入力してください";
    }
    if (!form.email.trim()) {
      errs.email = "メールアドレスを入力してください";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = "正しいメールアドレスを入力してください";
    }
    if (!form.prefecture) errs.prefecture = "都道府県を選択してください";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      // 実際にはここで API に送信
      setSubmitted(true);
    }
  };

  const results = getResults(answers.amount, answers.period, answers.status);
  const currentQ =
    step === "q1" ? 1 : step === "q2" ? 2 : step === "q3" ? 3 : 0;

  /* ───────── 共通パーツ ───────── */

  /** アドバイザーアイコン付きの質問吹き出し */
  const QuestionBubble = ({ children }: { children: React.ReactNode }) => (
    <motion.div
      variants={fadeUp}
      initial="initial"
      animate="animate"
      className="flex items-start gap-3 mb-6"
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#2C3E50] flex items-center justify-center">
        <MessageCircle className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 bg-white rounded-2xl rounded-tl-md px-4 py-3 shadow-sm border border-gray-100">
        <p className="text-[#2C3E50] font-medium text-[15px] leading-relaxed">
          {children}
        </p>
      </div>
    </motion.div>
  );

  /** 選択肢ボタン */
  const OptionButton = ({
    label,
    onClick,
    hint,
  }: {
    label: string;
    onClick: () => void;
    hint?: string;
  }) => (
    <motion.button
      variants={fadeUp}
      whileTap={{ scale: 0.95 }}
      whileHover={{ borderColor: "#27AE60", backgroundColor: "#f0fdf4" }}
      onClick={onClick}
      className="w-full p-4 rounded-xl border-2 border-gray-200 bg-white text-center font-semibold text-[#2C3E50] text-[15px] transition-shadow hover:shadow-md active:bg-green-50 cursor-pointer"
    >
      {label}
      {hint && (
        <span className="block text-xs text-[#27AE60] font-normal mt-1">
          {hint}
        </span>
      )}
    </motion.button>
  );

  /** 信頼バッジ */
  const TrustBadges = () => (
    <div className="flex flex-wrap justify-center gap-3 mt-6">
      {[
        { icon: Shield, label: "匿名OK" },
        { icon: Lock, label: "SSL暗号化" },
        { icon: CheckCircle, label: "完全無料" },
      ].map(({ icon: Icon, label }) => (
        <div
          key={label}
          className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 rounded-full px-3 py-1.5"
        >
          <Icon className="w-3.5 h-3.5" />
          <span>{label}</span>
        </div>
      ))}
    </div>
  );

  /* ─────────────────── 各ステップの描画 ─────────────────── */

  const renderWelcome = () => (
    <motion.div
      key="welcome"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="text-center"
    >
      {/* ビジュアルヘッダー */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
        className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#2C3E50] to-[#34495e] flex items-center justify-center shadow-lg"
      >
        <TrendingDown className="w-10 h-10 text-white" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="text-2xl font-bold text-[#2C3E50] leading-tight mb-3"
      >
        あなたの借金、
        <br />
        <span className="text-[#27AE60]">いくら減額</span>できる？
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-gray-500 text-sm leading-relaxed mb-8"
      >
        匿名・無料。たった1分の診断で
        <br />
        あなたの借金がいくら減るか分かります。
      </motion.p>

      {/* パルスCTAボタン */}
      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65 }}
        onClick={() => setStep("q1")}
        className="relative w-full max-w-xs mx-auto block"
      >
        <motion.span
          className="absolute inset-0 rounded-2xl bg-[#27AE60]"
          animate={{
            boxShadow: [
              "0 0 0 0px rgba(39, 174, 96, 0.4)",
              "0 0 0 14px rgba(39, 174, 96, 0)",
            ],
          }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
        />
        <span className="relative flex items-center justify-center gap-2 bg-[#27AE60] hover:bg-[#219a52] text-white font-bold text-lg py-4 px-8 rounded-2xl shadow-lg transition-colors cursor-pointer">
          診断を始める
          <ChevronRight className="w-5 h-5" />
        </span>
      </motion.button>

      <TrustBadges />

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="text-[11px] text-gray-400 mt-6 leading-relaxed"
      >
        ※ 本診断は一般的な事例に基づく簡易シミュレーションです。
        <br />
        正確な減額金額は専門家への相談で確定します。
      </motion.p>
    </motion.div>
  );

  const renderQ1 = () => (
    <motion.div
      key="q1"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <QuestionBubble>
        まず、現在の借入総額をおおよそで教えてください。
      </QuestionBubble>
      <motion.div
        variants={staggerChildren}
        initial="initial"
        animate="animate"
        className="grid grid-cols-2 gap-3"
      >
        {["50万円未満", "50〜100万円", "100〜200万円", "200万円以上"].map(
          (opt) => (
            <OptionButton key={opt} label={opt} onClick={() => handleQ1(opt)} />
          )
        )}
      </motion.div>
    </motion.div>
  );

  const renderQ2 = () => (
    <motion.div
      key="q2"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <QuestionBubble>
        その借入は、どれくらいの期間になりますか？
      </QuestionBubble>
      <motion.div
        variants={staggerChildren}
        initial="initial"
        animate="animate"
        className="grid grid-cols-2 gap-3"
      >
        {["1年未満", "1〜3年", "3〜5年", "5年以上"].map((opt) => (
          <OptionButton
            key={opt}
            label={opt}
            onClick={() => handleQ2(opt)}
            hint={opt === "5年以上" ? "過払い金が発生している可能性があります" : undefined}
          />
        ))}
      </motion.div>
    </motion.div>
  );

  const renderQ3 = () => (
    <motion.div
      key="q3"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <QuestionBubble>
        現在の返済状況はいかがですか？
      </QuestionBubble>
      <motion.div
        variants={staggerChildren}
        initial="initial"
        animate="animate"
        className="grid grid-cols-2 gap-3"
      >
        {["余裕あり", "少しきつい", "かなりきつい", "返済不可"].map((opt) => (
          <OptionButton key={opt} label={opt} onClick={() => handleQ3(opt)} />
        ))}
      </motion.div>
    </motion.div>
  );

  const renderEmpathy = () => (
    <motion.div
      key="empathy"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex flex-col items-center justify-center min-h-[240px] text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 180, damping: 12 }}
        className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mb-6"
      >
        <Heart className="w-8 h-8 text-rose-400" />
      </motion.div>

      <AnimatePresence>
        {showEmpathyText && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-[#2C3E50] font-bold text-lg mb-2">
              辛かったですね。
            </p>
            <p className="text-gray-500 text-sm leading-relaxed">
              でも、ご安心ください。
              <br />
              解決策はきっとあります。
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  const renderLoading = () => {
    const messages = ["シミュレーション中...", "過去の事例と照合中..."];
    return (
      <motion.div
        key="loading"
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="flex flex-col items-center justify-center min-h-[280px] text-center"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          className="mb-6"
        >
          <Loader2 className="w-12 h-12 text-[#27AE60]" />
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.p
            key={loadingPhase}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="text-[#2C3E50] font-medium text-base"
          >
            {messages[loadingPhase]}
          </motion.p>
        </AnimatePresence>

        {/* プログレスバー */}
        <div className="w-48 h-1.5 bg-gray-200 rounded-full mt-6 overflow-hidden">
          <motion.div
            className="h-full bg-[#27AE60] rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 3.2, ease: "easeInOut" }}
          />
        </div>
      </motion.div>
    );
  };

  const renderResult = () => {
    if (submitted) {
      return (
        <motion.div
          key="submitted"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="text-center py-10"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 180, damping: 12 }}
            className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-50 flex items-center justify-center"
          >
            <CheckCircle className="w-10 h-10 text-[#27AE60]" />
          </motion.div>
          <h2 className="text-xl font-bold text-[#2C3E50] mb-3">
            送信が完了しました
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            専門スタッフが内容を確認し、
            <br />
            24時間以内にご連絡いたします。
            <br />
            <span className="text-[#27AE60] font-medium mt-2 inline-block">
              ご相談は完全無料です。ご安心ください。
            </span>
          </p>
        </motion.div>
      );
    }

    const barMaxH = 160;
    const beforeH = (results.before / 10) * barMaxH;
    const afterH = (results.after / 10) * barMaxH;

    return (
      <motion.div
        key="result"
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {/* ── 結果ヘッダー ── */}
        <div className="text-center mb-6">
          <motion.p
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="inline-block bg-[#27AE60] text-white text-xs font-bold px-4 py-1.5 rounded-full mb-3"
          >
            診断結果
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="text-xl font-bold text-[#2C3E50] leading-snug"
          >
            月々の返済額が
            <br />
            <span className="text-[#27AE60] text-3xl">
              最大{results.savings}万円
            </span>
            <br />
            減額できる可能性があります！
          </motion.h2>
        </div>

        {/* ── 棒グラフ比較 ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6"
        >
          <div className="flex items-end justify-center gap-10" style={{ height: barMaxH + 60 }}>
            {/* 現在 */}
            <div className="flex flex-col items-center">
              <span className="text-sm text-gray-400 mb-2 font-medium">現在</span>
              <div
                className="relative w-16 flex items-end justify-center"
                style={{ height: barMaxH }}
              >
                <motion.div
                  className="w-full bg-gradient-to-t from-[#e74c3c] to-[#e74c3c]/70 rounded-t-lg"
                  initial={{ height: 0 }}
                  animate={{ height: beforeH }}
                  transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
                />
              </div>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="mt-3 text-xl font-bold text-[#2C3E50]"
              >
                {results.before}万円
              </motion.span>
            </div>

            {/* 矢印 */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.0 }}
              className="pb-8"
            >
              <ArrowDownRight className="w-8 h-8 text-[#27AE60]" />
            </motion.div>

            {/* 減額後 */}
            <div className="flex flex-col items-center">
              <span className="text-sm text-[#27AE60] mb-2 font-bold">減額後</span>
              <div
                className="relative w-16 flex items-end justify-center"
                style={{ height: barMaxH }}
              >
                <motion.div
                  className="w-full bg-gradient-to-t from-[#27AE60] to-[#27AE60]/70 rounded-t-lg"
                  initial={{ height: 0 }}
                  animate={{ height: afterH }}
                  transition={{ duration: 0.8, delay: 0.9, ease: "easeOut" }}
                />
              </div>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="mt-3 text-xl font-bold text-[#27AE60]"
              >
                {results.after}万円
              </motion.span>
            </div>
          </div>

          {/* 削減率バッジ */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.6, type: "spring" }}
            className="text-center mt-4"
          >
            <span className="inline-block bg-green-50 text-[#27AE60] text-sm font-bold px-4 py-2 rounded-full border border-green-200">
              約{results.reductionRate}%の減額の可能性
            </span>
          </motion.div>

          {results.hasOverpayment && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.8 }}
              className="text-center text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mt-3"
            >
              ※ さらに過払い金が戻ってくる可能性もあります
            </motion.p>
          )}
        </motion.div>

        {/* ── CTA導入テキスト ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8 }}
        >
          <p className="text-center text-sm text-gray-500 mb-4 leading-relaxed">
            正確な減額結果を
            <span className="font-bold text-[#2C3E50]">無料</span>
            でお伝えします。
            <br />
            以下にご連絡先をご入力ください。
          </p>

          {/* ── 入力フォーム ── */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* 名前 */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-[#2C3E50] mb-1.5">
                <User className="w-4 h-4 text-gray-400" />
                お名前
                <span className="text-[10px] text-gray-400 font-normal">
                  （苗字のみ・匿名可）
                </span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="例：田中"
                className={`w-full h-12 px-4 rounded-xl border-2 bg-white text-[15px] outline-none transition-colors ${
                  errors.name
                    ? "border-red-300 focus:border-red-400"
                    : "border-gray-200 focus:border-[#27AE60]"
                }`}
              />
              {errors.name && (
                <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                  <span>※ {errors.name}</span>
                </p>
              )}
            </div>

            {/* 電話番号 */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-[#2C3E50] mb-1.5">
                <Phone className="w-4 h-4 text-gray-400" />
                電話番号
              </label>
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={(e) =>
                  setForm((p) => ({ ...p, phone: e.target.value }))
                }
                placeholder="例：090-1234-5678"
                className={`w-full h-12 px-4 rounded-xl border-2 bg-white text-[15px] outline-none transition-colors ${
                  errors.phone
                    ? "border-red-300 focus:border-red-400"
                    : "border-gray-200 focus:border-[#27AE60]"
                }`}
              />
              {errors.phone && (
                <p className="text-red-400 text-xs mt-1">※ {errors.phone}</p>
              )}
            </div>

            {/* メールアドレス */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-[#2C3E50] mb-1.5">
                <Mail className="w-4 h-4 text-gray-400" />
                メールアドレス
              </label>
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) =>
                  setForm((p) => ({ ...p, email: e.target.value }))
                }
                placeholder="例：example@mail.com"
                className={`w-full h-12 px-4 rounded-xl border-2 bg-white text-[15px] outline-none transition-colors ${
                  errors.email
                    ? "border-red-300 focus:border-red-400"
                    : "border-gray-200 focus:border-[#27AE60]"
                }`}
              />
              {errors.email && (
                <p className="text-red-400 text-xs mt-1">※ {errors.email}</p>
              )}
            </div>

            {/* 都道府県 */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-[#2C3E50] mb-1.5">
                <MapPin className="w-4 h-4 text-gray-400" />
                都道府県
              </label>
              <select
                value={form.prefecture}
                onChange={(e) =>
                  setForm((p) => ({ ...p, prefecture: e.target.value }))
                }
                className={`w-full h-12 px-4 rounded-xl border-2 bg-white text-[15px] outline-none transition-colors appearance-none cursor-pointer ${
                  errors.prefecture
                    ? "border-red-300 focus:border-red-400"
                    : "border-gray-200 focus:border-[#27AE60]"
                } ${!form.prefecture ? "text-gray-400" : "text-[#2C3E50]"}`}
              >
                <option value="" disabled>
                  選択してください
                </option>
                {PREFECTURES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              {errors.prefecture && (
                <p className="text-red-400 text-xs mt-1">
                  ※ {errors.prefecture}
                </p>
              )}
            </div>

            {/* CVボタン */}
            <motion.button
              type="submit"
              whileTap={{ scale: 0.97 }}
              className="w-full bg-[#27AE60] hover:bg-[#219a52] active:bg-[#1e8a49] text-white font-bold text-lg py-4 rounded-2xl shadow-lg transition-colors cursor-pointer mt-2"
            >
              無料で減額結果を受け取る
            </motion.button>
          </form>

          {/* プライバシーノート */}
          <div className="flex items-start gap-2 mt-4 px-2">
            <Lock className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-gray-400 leading-relaxed">
              ご入力いただいた情報はSSL暗号化通信により保護されます。
              営業目的の連絡は一切ありません。
            </p>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  /* ─────────────────── レンダリング ─────────────────── */

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col">
      {/* ── ヘッダー ── */}
      <header className="bg-[#2C3E50] text-white py-3.5 px-4 shadow-md">
        <div className="max-w-md mx-auto flex items-center justify-center gap-2">
          <Shield className="w-4.5 h-4.5 text-green-400" />
          <span className="font-bold text-sm tracking-wide">
            借金減額シミュレーター
          </span>
        </div>
      </header>

      {/* ── プログレスバー（Q1〜Q3のみ） ── */}
      {currentQ > 0 && (
        <div className="px-4 pt-4">
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] text-gray-400 font-medium">
                質問 {currentQ} / 3
              </span>
            </div>
            <div className="flex gap-1.5">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-1.5 flex-1 rounded-full overflow-hidden bg-gray-200"
                >
                  <motion.div
                    className="h-full bg-[#27AE60] rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: i <= currentQ ? "100%" : "0%" }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── メインコンテンツ ── */}
      <main className="flex-1 flex items-start justify-center px-4 py-6">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {step === "welcome" && renderWelcome()}
            {step === "q1" && renderQ1()}
            {step === "q2" && renderQ2()}
            {step === "q3" && renderQ3()}
            {step === "empathy" && renderEmpathy()}
            {step === "loading" && renderLoading()}
            {step === "result" && renderResult()}
          </AnimatePresence>
        </div>
      </main>

      {/* ── フッター ── */}
      <footer className="py-4 text-center">
        <p className="text-[10px] text-gray-300">
          © 2025 借金減額シミュレーター All Rights Reserved.
        </p>
      </footer>
    </div>
  );
}
