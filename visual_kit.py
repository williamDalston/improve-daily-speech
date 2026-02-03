"""
MindCast Visual Kit - Light Clean Theme

Premium visual components and styling for Streamlit.
Inspired by Apple's design language: warm whites, subtle shadows,
refined typography, and thoughtful micro-interactions.
"""

import streamlit as st
import base64
from typing import Literal

# ════════════════════════════════════════════════════════════════════════════════
# COLOR TOKENS
# ════════════════════════════════════════════════════════════════════════════════

COLORS = {
    # Backgrounds
    "bg_primary": "#FAFAFA",      # Main background - warm off-white
    "bg_secondary": "#FFFFFF",    # Cards, elevated surfaces
    "bg_tertiary": "#F5F5F7",     # Subtle sections
    "bg_accent": "#F0EEFF",       # Accent highlights (light purple tint)

    # Text
    "text_primary": "#1D1D1F",    # Headlines, primary text
    "text_secondary": "#6E6E73",  # Body text, descriptions
    "text_tertiary": "#86868B",   # Captions, metadata
    "text_muted": "#AEAEB2",      # Disabled, placeholders

    # Brand
    "brand_primary": "#6366F1",   # Indigo - main brand
    "brand_secondary": "#8B5CF6", # Purple - accents
    "brand_gradient": "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",

    # Semantic
    "success": "#34C759",
    "warning": "#FF9F0A",
    "error": "#FF3B30",
    "info": "#5AC8FA",

    # Borders
    "border_light": "#E5E5EA",
    "border_medium": "#D1D1D6",
    "border_focus": "#6366F1",
}

# ════════════════════════════════════════════════════════════════════════════════
# TYPOGRAPHY SCALE
# ════════════════════════════════════════════════════════════════════════════════

TYPOGRAPHY = {
    "font_family": '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
    "font_mono": '"SF Mono", "Fira Code", "Consolas", monospace',

    # Scale (desktop)
    "display": "2.5rem",    # 40px - Hero headlines
    "h1": "2rem",           # 32px - Page titles
    "h2": "1.5rem",         # 24px - Section headers
    "h3": "1.25rem",        # 20px - Card titles
    "body": "1rem",         # 16px - Body text
    "small": "0.875rem",    # 14px - Captions
    "tiny": "0.75rem",      # 12px - Labels

    # Weights
    "weight_regular": "400",
    "weight_medium": "500",
    "weight_semibold": "600",
    "weight_bold": "700",
}

# ════════════════════════════════════════════════════════════════════════════════
# SPACING SCALE
# ════════════════════════════════════════════════════════════════════════════════

SPACING = {
    "xs": "0.25rem",   # 4px
    "sm": "0.5rem",    # 8px
    "md": "1rem",      # 16px
    "lg": "1.5rem",    # 24px
    "xl": "2rem",      # 32px
    "2xl": "3rem",     # 48px
    "3xl": "4rem",     # 64px
}


# ════════════════════════════════════════════════════════════════════════════════
# MASTER CSS - Inject this once at app start
# ════════════════════════════════════════════════════════════════════════════════

LIGHT_CLEAN_CSS = """
<style>
/* ═══════════════════════════════════════════════════════════════════════════
   MINDCAST VISUAL KIT - Light Clean Theme
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── CSS Variables (Design Tokens) ────────────────────────────────────────── */
:root {
    /* Backgrounds */
    --mc-bg-primary: #FAFAFA;
    --mc-bg-secondary: #FFFFFF;
    --mc-bg-tertiary: #F5F5F7;
    --mc-bg-accent: #F0EEFF;

    /* Text */
    --mc-text-primary: #1D1D1F;
    --mc-text-secondary: #6E6E73;
    --mc-text-tertiary: #86868B;
    --mc-text-muted: #AEAEB2;

    /* Brand */
    --mc-brand: #6366F1;
    --mc-brand-light: #8B5CF6;
    --mc-brand-gradient: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);

    /* Borders & Shadows */
    --mc-border: #E5E5EA;
    --mc-border-focus: #6366F1;
    --mc-shadow-sm: 0 1px 2px rgba(0,0,0,0.04);
    --mc-shadow-md: 0 4px 12px rgba(0,0,0,0.06);
    --mc-shadow-lg: 0 8px 24px rgba(0,0,0,0.08);
    --mc-shadow-xl: 0 12px 40px rgba(0,0,0,0.10);

    /* Radius */
    --mc-radius-sm: 8px;
    --mc-radius-md: 12px;
    --mc-radius-lg: 16px;
    --mc-radius-xl: 24px;

    /* Typography */
    --mc-font: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif;
    --mc-font-mono: "SF Mono", "Fira Code", Consolas, monospace;

    /* Transitions */
    --mc-transition-fast: 0.15s ease;
    --mc-transition-normal: 0.25s ease;
    --mc-transition-slow: 0.4s ease;
}

/* ── Global Reset & Base ──────────────────────────────────────────────────── */
html {
    padding: env(safe-area-inset-top) env(safe-area-inset-right)
             env(safe-area-inset-bottom) env(safe-area-inset-left);
}

html, body, [data-testid="stAppViewContainer"] {
    background: var(--mc-bg-primary) !important;
    font-family: var(--mc-font) !important;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

/* Subtle ambient gradient overlay */
[data-testid="stAppViewContainer"]::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 400px;
    background: linear-gradient(180deg,
        rgba(99, 102, 241, 0.03) 0%,
        rgba(139, 92, 246, 0.02) 50%,
        transparent 100%);
    pointer-events: none;
    z-index: 0;
}

/* ── Main Container ───────────────────────────────────────────────────────── */
.block-container {
    max-width: 800px !important;
    padding: 2rem 1.5rem !important;
}

/* Hide Streamlit branding */
#MainMenu, footer, header { visibility: hidden; }
[data-testid="stToolbar"] { display: none; }

/* ── Typography ───────────────────────────────────────────────────────────── */
h1, h2, h3, h4, h5, h6 {
    font-family: var(--mc-font) !important;
    color: var(--mc-text-primary) !important;
    letter-spacing: -0.02em;
    line-height: 1.2;
}

p, li, span {
    color: var(--mc-text-secondary);
    line-height: 1.6;
}

/* ── Hero Title ───────────────────────────────────────────────────────────── */
.mc-hero {
    text-align: center;
    padding: 1rem 0 2rem;
}

.mc-hero-title {
    font-size: 2rem;
    font-weight: 700;
    background: var(--mc-brand-gradient);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 0;
    letter-spacing: -0.03em;
}

.mc-hero-subtitle {
    font-size: 1rem;
    color: var(--mc-text-tertiary);
    margin-top: 0.5rem;
    font-weight: 400;
}

/* ── Cards ────────────────────────────────────────────────────────────────── */
.mc-card {
    background: var(--mc-bg-secondary);
    border: 1px solid var(--mc-border);
    border-radius: var(--mc-radius-lg);
    padding: 1.25rem;
    margin-bottom: 0.75rem;
    transition: all var(--mc-transition-fast);
    box-shadow: var(--mc-shadow-sm);
}

.mc-card:hover {
    border-color: var(--mc-brand);
    box-shadow: var(--mc-shadow-md);
    transform: translateY(-1px);
}

.mc-card-title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--mc-text-primary);
    margin: 0 0 0.25rem;
    line-height: 1.4;
}

.mc-card-meta {
    font-size: 0.8rem;
    color: var(--mc-text-tertiary);
}

/* ── Episode Card (Specific) ──────────────────────────────────────────────── */
.episode-card {
    background: var(--mc-bg-secondary);
    border: 1px solid var(--mc-border);
    border-radius: var(--mc-radius-md);
    padding: 1rem;
    margin-bottom: 0.5rem;
    transition: all var(--mc-transition-fast);
    cursor: pointer;
    box-shadow: var(--mc-shadow-sm);
}

.episode-card:hover {
    border-color: var(--mc-brand);
    background: var(--mc-bg-secondary);
    box-shadow: var(--mc-shadow-md);
    transform: translateY(-1px);
}

.episode-card h4 {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--mc-text-primary);
    margin: 0 0 0.25rem;
    line-height: 1.4;
}

.episode-card .meta {
    font-size: 0.75rem;
    color: var(--mc-text-tertiary);
}

/* ── Audio Player Container ───────────────────────────────────────────────── */
.audio-container, .mc-audio {
    background: var(--mc-bg-tertiary);
    border: 1px solid var(--mc-border);
    border-radius: var(--mc-radius-md);
    padding: 1.25rem;
    margin: 1rem 0;
    box-shadow: var(--mc-shadow-sm);
}

/* Style native audio element */
audio {
    width: 100%;
    height: 44px;
    border-radius: var(--mc-radius-sm);
}

audio::-webkit-media-controls-panel {
    background: var(--mc-bg-secondary);
}

/* ── Progress Stepper ─────────────────────────────────────────────────────── */
.mc-stepper {
    display: flex;
    justify-content: space-between;
    padding: 1.5rem 0;
    position: relative;
}

.mc-stepper::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--mc-border);
    transform: translateY(-50%);
    z-index: 0;
}

.mc-step {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    z-index: 1;
    flex: 1;
}

.mc-step-circle {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--mc-bg-secondary);
    border: 2px solid var(--mc-border);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--mc-text-tertiary);
    transition: all var(--mc-transition-normal);
}

.mc-step.active .mc-step-circle {
    background: var(--mc-brand-gradient);
    border-color: transparent;
    color: white;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.mc-step.completed .mc-step-circle {
    background: var(--mc-brand);
    border-color: var(--mc-brand);
    color: white;
}

.mc-step-label {
    margin-top: 0.5rem;
    font-size: 0.75rem;
    color: var(--mc-text-tertiary);
    text-align: center;
    font-weight: 500;
}

.mc-step.active .mc-step-label {
    color: var(--mc-brand);
}

.mc-step.completed .mc-step-label {
    color: var(--mc-text-secondary);
}

/* ── Progress Status (While Generating) ───────────────────────────────────── */
.mc-progress-status {
    text-align: center;
    padding: 2rem 1rem;
    background: var(--mc-bg-tertiary);
    border-radius: var(--mc-radius-lg);
    margin: 1rem 0;
}

.mc-progress-message {
    color: var(--mc-text-secondary);
    font-size: 0.95rem;
    margin-bottom: 1rem;
}

.mc-progress-spinner {
    display: inline-block;
    width: 32px;
    height: 32px;
    border: 3px solid var(--mc-border);
    border-top-color: var(--mc-brand);
    border-radius: 50%;
    animation: mc-spin 1s linear infinite;
}

@keyframes mc-spin {
    to { transform: rotate(360deg); }
}

/* ── Buttons ──────────────────────────────────────────────────────────────── */
.stButton > button {
    font-family: var(--mc-font) !important;
    font-weight: 500;
    min-height: 44px;
    border-radius: var(--mc-radius-sm);
    transition: all var(--mc-transition-fast);
}

.stButton > button[kind="primary"] {
    background: var(--mc-brand-gradient) !important;
    border: none !important;
    color: white !important;
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.25);
}

.stButton > button[kind="primary"]:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(99, 102, 241, 0.35);
}

.stButton > button[kind="secondary"] {
    background: var(--mc-bg-secondary) !important;
    border: 1px solid var(--mc-border) !important;
    color: var(--mc-text-primary) !important;
}

.stButton > button[kind="secondary"]:hover {
    border-color: var(--mc-brand) !important;
    background: var(--mc-bg-tertiary) !important;
}

/* ── Form Inputs ──────────────────────────────────────────────────────────── */
.stTextArea textarea,
.stTextInput input {
    font-family: var(--mc-font) !important;
    font-size: 16px !important; /* Prevent iOS zoom */
    background: var(--mc-bg-secondary) !important;
    border: 1px solid var(--mc-border) !important;
    border-radius: var(--mc-radius-sm) !important;
    padding: 0.875rem !important;
    transition: all var(--mc-transition-fast);
}

.stTextArea textarea:focus,
.stTextInput input:focus {
    border-color: var(--mc-brand) !important;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1) !important;
}

.stSelectbox > div > div {
    border-radius: var(--mc-radius-sm);
    border-color: var(--mc-border);
    min-height: 44px;
}

/* ── Paywall Card ─────────────────────────────────────────────────────────── */
.paywall-card, .mc-paywall {
    background: var(--mc-brand-gradient);
    border-radius: var(--mc-radius-xl);
    padding: 2.5rem 2rem;
    text-align: center;
    color: white;
    box-shadow: var(--mc-shadow-lg);
}

.paywall-card h2, .mc-paywall-title {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: white;
}

.paywall-card p {
    opacity: 0.9;
    font-size: 0.95rem;
    color: white;
}

.paywall-price, .mc-paywall-price {
    font-size: 2.5rem;
    font-weight: 700;
    margin: 1.5rem 0;
}

.paywall-price span {
    font-size: 1rem;
    font-weight: 400;
    opacity: 0.8;
}

/* ── Empty State ──────────────────────────────────────────────────────────── */
.empty-state, .mc-empty {
    text-align: center;
    padding: 3rem 2rem;
    background: var(--mc-bg-tertiary);
    border-radius: var(--mc-radius-lg);
    border: 1px dashed var(--mc-border);
}

.empty-state p, .mc-empty p {
    color: var(--mc-text-tertiary);
    margin: 0;
}

/* ── Topic Chips ──────────────────────────────────────────────────────────── */
.topic-chip, .mc-chip {
    display: inline-block;
    background: var(--mc-bg-secondary);
    border: 1px solid var(--mc-border);
    border-radius: 20px;
    padding: 0.5rem 1rem;
    margin: 0.25rem;
    font-size: 0.85rem;
    color: var(--mc-text-secondary);
    cursor: pointer;
    transition: all var(--mc-transition-fast);
    font-weight: 500;
}

.topic-chip:hover, .mc-chip:hover {
    background: var(--mc-bg-accent);
    border-color: var(--mc-brand);
    color: var(--mc-brand);
    transform: translateY(-1px);
}

/* ── Transcript Formatting ────────────────────────────────────────────────── */
.mc-transcript {
    background: var(--mc-bg-secondary);
    border: 1px solid var(--mc-border);
    border-radius: var(--mc-radius-lg);
    padding: 1.5rem;
    margin: 1rem 0;
}

.mc-transcript p {
    color: var(--mc-text-primary);
    line-height: 1.8;
    margin-bottom: 1rem;
}

.mc-transcript p:last-child {
    margin-bottom: 0;
}

/* Chapter marker */
.mc-chapter {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin: 1.5rem 0 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid var(--mc-bg-accent);
}

.mc-chapter-number {
    width: 28px;
    height: 28px;
    background: var(--mc-brand-gradient);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 0.75rem;
    font-weight: 600;
    flex-shrink: 0;
}

.mc-chapter-title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--mc-text-primary);
}

/* Pull quote */
.mc-pullquote {
    border-left: 3px solid var(--mc-brand);
    padding: 0.75rem 1rem;
    margin: 1rem 0;
    background: var(--mc-bg-accent);
    border-radius: 0 var(--mc-radius-sm) var(--mc-radius-sm) 0;
}

.mc-pullquote p {
    color: var(--mc-text-primary);
    font-style: italic;
    font-size: 1.05rem;
    margin: 0;
}

/* Takeaway box */
.mc-takeaway {
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%);
    border: 1px solid rgba(99, 102, 241, 0.2);
    border-radius: var(--mc-radius-md);
    padding: 1.25rem;
    margin: 1.5rem 0;
}

.mc-takeaway-label {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--mc-brand);
    margin-bottom: 0.5rem;
}

.mc-takeaway p {
    color: var(--mc-text-primary);
    font-weight: 500;
    margin: 0;
}

/* ── Lens/Perspective Cards ───────────────────────────────────────────────── */
.lens-category, .mc-lens-group {
    background: var(--mc-bg-secondary);
    border: 1px solid var(--mc-border);
    border-radius: var(--mc-radius-md);
    padding: 1rem;
    margin-bottom: 0.75rem;
    box-shadow: var(--mc-shadow-sm);
}

.mc-lens-title {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--mc-text-primary);
    margin-bottom: 0.5rem;
}

.lens-item, .mc-lens-item {
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--mc-bg-tertiary);
}

.lens-item:last-child, .mc-lens-item:last-child {
    border-bottom: none;
}

/* ── Badge ────────────────────────────────────────────────────────────────── */
.mc-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    background: var(--mc-bg-accent);
    color: var(--mc-brand);
    font-size: 0.7rem;
    font-weight: 600;
    padding: 0.25rem 0.6rem;
    border-radius: 12px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.mc-badge.success {
    background: rgba(52, 199, 89, 0.12);
    color: #34C759;
}

.mc-badge.premium {
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.15));
    color: var(--mc-brand);
}

/* ── Progress Bar ─────────────────────────────────────────────────────────── */
.stProgress > div > div {
    background: var(--mc-brand-gradient) !important;
    border-radius: 4px;
}

/* ── Expander ─────────────────────────────────────────────────────────────── */
.streamlit-expanderHeader {
    font-family: var(--mc-font) !important;
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--mc-text-primary);
    padding: 0.75rem 0;
    transition: color var(--mc-transition-fast);
}

.streamlit-expanderHeader:hover {
    color: var(--mc-brand);
}

/* ── Download Buttons ─────────────────────────────────────────────────────── */
.stDownloadButton > button {
    min-height: 44px;
    font-weight: 500;
    border-radius: var(--mc-radius-sm);
}

/* ═══════════════════════════════════════════════════════════════════════════
   RESPONSIVE STYLES
   ═══════════════════════════════════════════════════════════════════════════ */

/* Small phones */
@media (max-width: 480px) {
    .block-container {
        padding: 1rem 0.75rem !important;
    }

    .mc-hero-title {
        font-size: 1.5rem;
    }

    .mc-card, .episode-card {
        padding: 0.875rem;
        border-radius: var(--mc-radius-md);
    }

    .mc-stepper {
        padding: 1rem 0;
    }

    .mc-step-circle {
        width: 30px;
        height: 30px;
        font-size: 0.75rem;
    }

    .mc-step-label {
        font-size: 0.65rem;
    }

    .paywall-card, .mc-paywall {
        padding: 1.5rem 1rem;
        border-radius: var(--mc-radius-lg);
    }

    .paywall-price, .mc-paywall-price {
        font-size: 2rem;
    }

    .audio-container, .mc-audio {
        padding: 1rem;
    }

    .mc-transcript {
        padding: 1rem;
    }

    /* Stack columns on mobile */
    [data-testid="column"] {
        width: 100% !important;
        flex: 1 1 100% !important;
        min-width: 100% !important;
    }

    [data-testid="stHorizontalBlock"] {
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    /* Larger touch targets */
    .stCheckbox label {
        padding: 0.5rem 0;
        min-height: 44px;
        display: flex;
        align-items: center;
    }
}

/* Tablets */
@media (min-width: 481px) and (max-width: 768px) {
    .block-container {
        padding: 1.5rem !important;
    }

    .mc-hero-title {
        font-size: 1.75rem;
    }
}

/* Desktop */
@media (min-width: 769px) {
    .block-container {
        padding: 2.5rem 2rem !important;
    }

    .mc-hero-title {
        font-size: 2.25rem;
    }

    .mc-card, .episode-card {
        padding: 1.5rem;
    }

    .paywall-card, .mc-paywall {
        padding: 3rem 2.5rem;
    }

    .paywall-price, .mc-paywall-price {
        font-size: 3rem;
    }
}

/* ═══════════════════════════════════════════════════════════════════════════
   ANIMATIONS & MICRO-INTERACTIONS
   ═══════════════════════════════════════════════════════════════════════════ */

/* Fade in animation */
@keyframes mc-fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
}

.mc-fade-in {
    animation: mc-fadeIn 0.4s ease forwards;
}

/* Pulse for loading states */
@keyframes mc-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
}

.mc-pulse {
    animation: mc-pulse 1.5s ease-in-out infinite;
}

/* Success checkmark animation */
@keyframes mc-checkmark {
    0% { transform: scale(0); }
    50% { transform: scale(1.2); }
    100% { transform: scale(1); }
}

.mc-success-check {
    animation: mc-checkmark 0.4s ease forwards;
}
</style>
"""


# ════════════════════════════════════════════════════════════════════════════════
# COMPONENT HELPERS
# ════════════════════════════════════════════════════════════════════════════════

def inject_css():
    """Inject the MindCast visual kit CSS. Call once at app start."""
    st.markdown(LIGHT_CLEAN_CSS, unsafe_allow_html=True)


def hero(title: str, subtitle: str = None):
    """Render a hero section with gradient title."""
    html = f'''
    <div class="mc-hero">
        <h1 class="mc-hero-title">{title}</h1>
        {f'<p class="mc-hero-subtitle">{subtitle}</p>' if subtitle else ''}
    </div>
    '''
    st.markdown(html, unsafe_allow_html=True)


def card(title: str, meta: str = None, content: str = None):
    """Render a card component."""
    html = f'''
    <div class="mc-card">
        <div class="mc-card-title">{title}</div>
        {f'<div class="mc-card-meta">{meta}</div>' if meta else ''}
        {f'<p>{content}</p>' if content else ''}
    </div>
    '''
    st.markdown(html, unsafe_allow_html=True)


def stepper(steps: list[str], current: int):
    """
    Render a progress stepper.

    Args:
        steps: List of step labels
        current: Current step index (0-based), -1 for none active
    """
    steps_html = ""
    for i, label in enumerate(steps):
        if i < current:
            state = "completed"
            icon = "✓"
        elif i == current:
            state = "active"
            icon = str(i + 1)
        else:
            state = ""
            icon = str(i + 1)

        steps_html += f'''
        <div class="mc-step {state}">
            <div class="mc-step-circle">{icon}</div>
            <div class="mc-step-label">{label}</div>
        </div>
        '''

    html = f'<div class="mc-stepper">{steps_html}</div>'
    st.markdown(html, unsafe_allow_html=True)


def progress_status(message: str, show_spinner: bool = True):
    """Render a centered progress status with optional spinner."""
    spinner = '<div class="mc-progress-spinner"></div>' if show_spinner else ''
    html = f'''
    <div class="mc-progress-status">
        {spinner}
        <div class="mc-progress-message">{message}</div>
    </div>
    '''
    st.markdown(html, unsafe_allow_html=True)


def chapter_marker(number: int, title: str):
    """Render a chapter marker for transcript sections."""
    html = f'''
    <div class="mc-chapter">
        <div class="mc-chapter-number">{number}</div>
        <div class="mc-chapter-title">{title}</div>
    </div>
    '''
    st.markdown(html, unsafe_allow_html=True)


def pull_quote(text: str):
    """Render a pull quote for emphasis."""
    html = f'''
    <div class="mc-pullquote">
        <p>{text}</p>
    </div>
    '''
    st.markdown(html, unsafe_allow_html=True)


def takeaway_box(text: str, label: str = "Key Takeaway"):
    """Render a takeaway/insight box."""
    html = f'''
    <div class="mc-takeaway">
        <div class="mc-takeaway-label">{label}</div>
        <p>{text}</p>
    </div>
    '''
    st.markdown(html, unsafe_allow_html=True)


def badge(text: str, variant: Literal["default", "success", "premium"] = "default"):
    """Render an inline badge."""
    html = f'<span class="mc-badge {variant}">{text}</span>'
    return html  # Return HTML for inline use


def empty_state(message: str, icon: str = ""):
    """Render an empty state placeholder."""
    html = f'''
    <div class="mc-empty">
        {f'<div style="font-size: 2rem; margin-bottom: 0.5rem;">{icon}</div>' if icon else ''}
        <p>{message}</p>
    </div>
    '''
    st.markdown(html, unsafe_allow_html=True)


# ════════════════════════════════════════════════════════════════════════════════
# EPISODE COVER ART GENERATOR
# ════════════════════════════════════════════════════════════════════════════════

def generate_cover_svg(title: str, width: int = 400, height: int = 400) -> str:
    """
    Generate a simple, elegant cover art SVG for an episode.

    Args:
        title: Episode title (will be truncated if too long)
        width: SVG width in pixels
        height: SVG height in pixels

    Returns:
        SVG string
    """
    # Truncate title for display
    display_title = title[:40] + "..." if len(title) > 40 else title

    # Split into lines for better display
    words = display_title.split()
    lines = []
    current_line = ""
    for word in words:
        test_line = f"{current_line} {word}".strip()
        if len(test_line) <= 20:
            current_line = test_line
        else:
            if current_line:
                lines.append(current_line)
            current_line = word
    if current_line:
        lines.append(current_line)

    # Generate text elements
    text_y_start = height // 2 - (len(lines) - 1) * 15
    text_elements = ""
    for i, line in enumerate(lines[:3]):  # Max 3 lines
        text_elements += f'<text x="{width // 2}" y="{text_y_start + i * 30}" text-anchor="middle" fill="white" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="18" font-weight="600">{line}</text>'

    svg = f'''
    <svg width="{width}" height="{height}" viewBox="0 0 {width} {height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="coverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#6366F1"/>
                <stop offset="100%" style="stop-color:#8B5CF6"/>
            </linearGradient>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="4" stdDeviation="8" flood-opacity="0.15"/>
            </filter>
        </defs>

        <!-- Background -->
        <rect width="{width}" height="{height}" rx="24" fill="url(#coverGrad)" filter="url(#shadow)"/>

        <!-- Subtle pattern overlay -->
        <rect width="{width}" height="{height}" rx="24" fill="url(#coverGrad)" opacity="0.1"/>

        <!-- Decorative circles -->
        <circle cx="{width * 0.15}" cy="{height * 0.2}" r="60" fill="white" opacity="0.08"/>
        <circle cx="{width * 0.85}" cy="{height * 0.8}" r="80" fill="white" opacity="0.06"/>

        <!-- MindCast logo/icon area -->
        <circle cx="{width // 2}" cy="{height * 0.25}" r="30" fill="white" opacity="0.15"/>
        <text x="{width // 2}" y="{height * 0.25 + 8}" text-anchor="middle" fill="white" font-size="24">🎧</text>

        <!-- Title -->
        {text_elements}

        <!-- Brand -->
        <text x="{width // 2}" y="{height - 30}" text-anchor="middle" fill="white" opacity="0.7" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="12" font-weight="500">MINDCAST</text>
    </svg>
    '''
    return svg


def cover_art(title: str, size: int = 200):
    """Display episode cover art."""
    svg = generate_cover_svg(title, size, size)
    b64 = base64.b64encode(svg.encode()).decode()
    html = f'<img src="data:image/svg+xml;base64,{b64}" style="border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.12);" />'
    st.markdown(html, unsafe_allow_html=True)


# ════════════════════════════════════════════════════════════════════════════════
# CONFETTI CELEBRATION (for milestones)
# ════════════════════════════════════════════════════════════════════════════════

CONFETTI_JS = """
<script>
function launchConfetti() {
    const colors = ['#6366F1', '#8B5CF6', '#34C759', '#FF9F0A', '#5AC8FA'];
    const confettiCount = 50;

    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.style.cssText = `
            position: fixed;
            width: 10px;
            height: 10px;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            left: ${Math.random() * 100}%;
            top: -10px;
            border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
            z-index: 9999;
            pointer-events: none;
            animation: confettiFall ${2 + Math.random() * 2}s ease-out forwards;
        `;
        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 4000);
    }
}

if (!document.getElementById('confetti-style')) {
    const style = document.createElement('style');
    style.id = 'confetti-style';
    style.textContent = `
        @keyframes confettiFall {
            to {
                top: 100vh;
                transform: rotate(${Math.random() * 720}deg) translateX(${Math.random() * 200 - 100}px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

launchConfetti();
</script>
"""


def celebrate():
    """Launch confetti celebration. Use sparingly for milestones."""
    st.markdown(CONFETTI_JS, unsafe_allow_html=True)
