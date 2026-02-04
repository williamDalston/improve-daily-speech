/**
 * MindCast Flight Control Agents
 * Post-launch operational tools for quality, growth, and optimization
 */

// Episode Quality Auditor - Content scoring and quality gates
export * from './quality-auditor';

// Performance & Cost Controller - Cost tracking and optimization
export * from './cost-controller';

// Growth Loop Agent - Share moment detection and asset generation
export * from './growth-loop';

// Content Programming - Topic packs, challenges, and retention
export * from './content-programming';

// Voice & Audio Studio - Pronunciation, narration standards
export * from './audio-studio';

// Funnel & Retention Detective - Analytics and churn detection
export * from './funnel-detective';

// Experiment Architect - A/B testing framework
export * from './experiment-architect';

// Monetization Optimizer - Pricing, upgrades, and subscription health
export * from './monetization-optimizer';

// Journey QA - E2E testing and accessibility
export * from './journey-qa';

/**
 * Agent Summary
 * =============
 *
 * 1. Quality Auditor
 *    - analyzeTranscript(transcript) -> QualityScore
 *    - generateQualityReport(score) -> string
 *    - meetsQualityBar(score, minScore) -> boolean
 *
 * 2. Cost Controller
 *    - estimateEpisodeCost(params) -> CostBreakdown
 *    - calculateMargin(price, episodes, length) -> MarginInfo
 *    - getOptimizationSuggestions(breakdown) -> string[]
 *
 * 3. Growth Loop
 *    - extractShareableMoments(transcript) -> ShareableMoment[]
 *    - generateThread(transcript, title) -> string[]
 *    - calculateSharePotential(transcript) -> ShareAnalysis
 *
 * 4. Content Programming
 *    - TOPIC_PACKS - Curated topic pack definitions
 *    - generateDailyChallenges(userId, episodes) -> Challenge[]
 *    - getRecommendedPacks(prefs) -> TopicPack[]
 *
 * 5. Audio Studio
 *    - PRONUNCIATION_DICTIONARY - Word pronunciation guide
 *    - NARRATION_RULES - Text formatting for TTS
 *    - preprocessForTTS(text) -> string
 *    - analyzeForAudioIssues(transcript) -> AudioIssue[]
 *
 * 6. Funnel Detective
 *    - CORE_FUNNEL_STAGES - User journey stages
 *    - calculateFunnelMetrics(events, stages) -> FunnelMetrics[]
 *    - detectChurnRisk(users) -> ChurnSignal[]
 *    - generateWeeklySummary(...) -> string
 *
 * 7. Experiment Architect
 *    - EXPERIMENT_TEMPLATES - Ready-to-run experiment configs
 *    - assignVariant(userId, experiment) -> Variant | null
 *    - analyzeExperiment(experiment, data) -> ExperimentResults
 *    - generateDecisionMemo(experiment) -> string
 *
 * 8. Monetization Optimizer
 *    - PRICING_PLANS - Plan definitions
 *    - UPGRADE_TRIGGERS - Contextual upgrade prompts
 *    - evaluateUpgradeTriggers(context, action) -> Trigger | null
 *    - calculateSubscriptionHealth(subs) -> HealthMetrics
 *
 * 9. Journey QA
 *    - CORE_JOURNEY_TESTS - E2E test definitions
 *    - MOBILE_STABILITY_TESTS - Mobile-specific tests
 *    - ACCESSIBILITY_TESTS - A11y test definitions
 *    - generateQAReport(results, env) -> QAReport
 */
