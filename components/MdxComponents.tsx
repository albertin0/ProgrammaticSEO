import React from "react";

/* ── Alert Box ─────────────────────────────────────────── */
type AlertType = "warning" | "danger" | "info" | "success";

const ICONS: Record<AlertType, string> = {
    warning: "⚠️",
    danger: "🚨",
    info: "💡",
    success: "✅",
};

export function AlertBox({
    type = "info",
    children,
}: {
    type?: AlertType;
    children: React.ReactNode;
}) {
    return (
        <div className={`alert-box alert-box-${type}`}>
            <span className="alert-icon">{ICONS[type]}</span>
            <div>{children}</div>
        </div>
    );
}

/* ── Bullet List ───────────────────────────────────────── */
export function BulletList({ children }: { children: React.ReactNode }) {
    return <ul className="bullet-list">{children}</ul>;
}

/* ── Score Display ─────────────────────────────────────── */
export function LungsJointsScore({ score }: { score: number }) {
    const color =
        score >= 7 ? "var(--color-primary)"
            : score >= 4 ? "var(--color-warning)"
                : "var(--color-danger)";

    return (
        <div className="score-card">
            <span className="score-label">🫁 Lungs &amp; Joints Score</span>
            <span className="score-value" style={{ color }}>
                {score}
                <span className="score-denom">/10</span>
            </span>
        </div>
    );
}
