import {
    Shield,
    Zap,
    Wallet,
    ArrowUpRight,
    ArrowDownLeft,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Euro,
    JapaneseYen,
    SwissFranc,
    RussianRuble,
    SaudiRiyal,
    Landmark,
} from "lucide-react";

// ─────────────────────────────────────────────
// ORBIT SYSTEM
// ─────────────────────────────────────────────

const VIEWBOX_WIDTH = 560;
const VIEWBOX_HEIGHT = 520;
const ORBIT_NODES = {
    cardTop: { x: 300, y: 170 },
    vault: { x: 307, y: 50 },
    bankRight: { x: 550, y: 110 },
    wallet: { x: 350, y: 460 },
    bankLeft: { x: 6, y: 400 },
    statsTrendLine: { x: 0, y: 160 },
};

function TransactionOrbitSystem() {
    const N = ORBIT_NODES;

    const vaultToLandmarkRight = `
        M ${N.vault.x} ${N.vault.y}
        C 400 10, 490 30, ${N.bankRight.x} ${N.bankRight.y}
    `;

    const landmarkRightToWallet = `
        M ${N.bankRight.x} ${N.bankRight.y}
        C 620 150, 600 400, ${N.wallet.x} ${N.wallet.y}
    `;

    const walletToLandmarkLeft = `
        M ${N.wallet.x} ${N.wallet.y}
        C 320 480, 140 520, ${N.bankLeft.x} ${N.bankLeft.y}
    `;

    const landmarkToStatsTrendline = `
        M ${N.bankLeft.x} ${N.bankLeft.y}
        C -40 300, -50 280, ${N.statsTrendLine.x} ${N.statsTrendLine.y}
    `;

    const growthTrendPath = `
        M ${N.statsTrendLine.x} ${N.statsTrendLine.y}
        L 20 120
        L 40 160
        L 80 80
        L 110 140
        L 200 10
    `;


    return (
        // preserveAspectRatio="xMidYMid meet" keeps all curves undistorted as the
        // container resizes across lg → xl → 2xl → ultrawide.
        <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox="0 0 560 520"
            preserveAspectRatio="xMidYMid meet"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <defs>
                {/* Card Animation */}
                <style>
                    {`
                        @keyframes floatSlow {
                            0%, 100% {
                                transform: translateY(0px) rotate(-2deg);
                            }
                            50% {
                                transform: translateY(-12px) rotate(1deg);
                            }
                        }

                        @keyframes floatFast {
                            0%, 100% {
                                transform: translateY(0px) rotate(2deg);
                            }
                            50% {
                                transform: translateY(-18px) rotate(-1deg);
                            }
                        }

                        .card-front {
                            animation: floatSlow 9s ease-in-out infinite;
                            transform-origin: center;
                        }

                        .card-back {
                            animation: floatFast 6s ease-in-out infinite;
                            animation-delay: 0.4s;
                            transform-origin: center;
                        }
                    `}
                </style>

                {/* ================ Path Glow ================ */}
                <filter id="silverRouteBlur" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="8" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>

                {/* =================== Path Gradient =================== */}
                <linearGradient id="routeSilver" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#8A8F98" stopOpacity="0.25" />
                    <stop offset="50%" stopColor="#C3C7CC" stopOpacity="0.55" />
                    <stop offset="100%" stopColor="#8A8F98" stopOpacity="0.25" />
                </linearGradient>

                {/* =================== Card Gradiants =================== */}
                {/* Gold Glow */}
                <filter id="goldGlow">
                    <feGaussianBlur stdDeviation="4" result="blur" />

                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>

                {/* Gold Gradient */}
                <linearGradient
                    id="goldGradient"
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="1"
                >
                    <stop offset="0%" stopColor="#E5C76B" />
                    <stop offset="100%" stopColor="#C1A050" />
                </linearGradient>
                {/* ========================= XXXX ========================= */}

                {/* TREND GOLD */}
                <linearGradient id="goldTrend" x1="0" y1="100" x2="390" y2="-10">
                    <stop offset="0%" stopColor="#fde047" stopOpacity="0.60" />
                    <stop offset="35%" stopColor="#fef08a" stopOpacity="0.72" />
                    <stop offset="70%" stopColor="#fff176" stopOpacity="0.84" />
                    <stop offset="100%" stopColor="#fff9c4" stopOpacity="0.96" />
                </linearGradient>

                {/* ================= COIN GRADIENT ================= */}
                <radialGradient
                    id="coinGradient"
                    cx="35%"
                    cy="30%"
                    r="70%"
                >
                    <stop offset="0%" stopColor="#FFE9A8" />
                    <stop offset="45%" stopColor="#E5C76B" />
                    <stop offset="100%" stopColor="#B8892D" />
                </radialGradient>

                {/* Coin Edge */}
                <linearGradient
                    id="coinEdge"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                >
                    <stop offset="0%" stopColor="#8B6A22" />
                    <stop offset="100%" stopColor="#F5D77A" />
                </linearGradient>

                {/* ====================== Arrow markers ====================== */}
                {/* ORBIT ARROWS */}
                <marker
                    id="arrowSilver"
                    viewBox="0 0 10 10"
                    refX="8"
                    refY="5"
                    markerWidth="5"
                    markerHeight="5"
                    orient="auto"
                >
                    <path
                        d="M1 1 L8 5 L1 9"
                        stroke="#B8BEC5"
                        strokeWidth="1.8"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.8"
                    />
                </marker>

                {/* BIG TREND ARROW */}
                <marker
                    id="trendArrow"
                    viewBox="0 0 20 20"
                    refX="15"
                    refY="10"
                    markerWidth="14"
                    markerHeight="14"
                    orient="auto"
                >
                    <path
                        d="M2 2 L18 10 L2 18 L7 10 Z"
                        fill="#fde047"
                        opacity="0.96"
                    />
                </marker>

                {/* Motion paths */}
                <path id="p-vault-landmarkRight" d={vaultToLandmarkRight} />
                <path id="p-landmarkRight-wallet" d={landmarkRightToWallet} />
                <path id="p-wallet-landmarkLeft" d={walletToLandmarkLeft} />
                <path id="p-landmarkLeft-out" d={landmarkToStatsTrendline} />
                <path id="p-growthTrend" d={growthTrendPath} />
            </defs>

            {/* VAULT → LANDMARK (right) */}
            <path
                d={vaultToLandmarkRight}
                stroke="url(#routeSilver)"
                strokeWidth="2"
                strokeLinecap="round"
                markerEnd="url(#arrowSilver)"
                opacity="0.9"
                filter="url(#silverRouteBlur)"
            >
            </path>

            {/* LANDMARK (right) → WALLET */}
            <path
                d={landmarkRightToWallet}
                stroke="url(#routeSilver)"
                strokeWidth="2.2"
                strokeLinecap="round"
                markerEnd="url(#arrowSilver)"
                opacity="0.95"
                filter="url(#silverRouteBlur)"
            >
            </path>

            {/* WALLET → LANDMARK (left) */}
            <path
                d={walletToLandmarkLeft}
                stroke="url(#routeSilver)"
                strokeWidth="2.2"
                strokeLinecap="round"
                markerEnd="url(#arrowSilver)"
                opacity="0.95"
                filter="url(#silverRouteBlur)"
            >
            </path>

            {/* LANDMARK (left) → STATSTRENDLINE */}
            <path
                d={landmarkToStatsTrendline}
                stroke="url(#routeSilver)"
                strokeWidth="2"
                strokeLinecap="round"
                markerEnd="url(#arrowSilver)"
                opacity="0.9"
                filter="url(#silverRouteBlur)"
            >
            </path>

            {/* ───────────────────────────────────────────── */}
            {/* GREEN TREND GRAPH */}
            {/* ───────────────────────────────────────────── */}
            {/* Glow layer */}
            <path
                d={growthTrendPath}
                stroke="#fbbf24"
                strokeWidth="10"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.15"
                filter="url(#trendGlow)"
            />

            {/* Main trend line */}
            <path
                d={growthTrendPath}
                stroke="url(#goldTrend)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                markerEnd="url(#trendArrow)"
                filter="url(#trendGlow)"
            >
                {/* Soft breathing pulse */}
                <animate
                    attributeName="opacity"
                    values="0.82;1;0.82"
                    dur="2.4s"
                    repeatCount="indefinite"
                />
            </path>

            {/* ───────────────────────────────────────────── */}
            {/* CARD 1 */}
            {/* ───────────────────────────────────────────── */}
            <g transform="translate(40 180) rotate(2)">
                <g className="card-front">
                    {/* Card Shadow */}
                    <rect
                        x="8"
                        y="8"
                        width="340"
                        height="200"
                        rx="18"
                        fill="#000000"
                        opacity="0.35"
                        filter="url(#goldGlow)"
                    />

                    {/* Main Card */}
                    <rect
                        width="340"
                        height="200"
                        rx="18"
                        fill="#151517"
                        stroke="url(#goldGradient)"
                        strokeWidth="2"
                    />

                    {/* Top Highlight */}
                    <line
                        x1="20"
                        y1="20"
                        x2="320"
                        y2="20"
                        stroke="#E5C76B"
                        strokeOpacity="0.4"
                    />

                    {/* Chip */}
                    <rect
                        x="24"
                        y="42"
                        width="68"
                        height="40"
                        rx="6"
                        fill="#C1A050"
                    />

                    {/* Chip Lines */}
                    <line
                        x1="42"
                        y1="42"
                        x2="42"
                        y2="82"
                        stroke="#8B6F2D"
                    />

                    <line
                        x1="24"
                        y1="57"
                        x2="92"
                        y2="57"
                        stroke="#8B6F2D"
                    />

                    {/* Card Number */}
                    <text
                        x="24"
                        y="120"
                        fill="#C0C0C0"
                        fontSize="20"
                        letterSpacing="1.5"
                        fontFamily="monospace"
                    >
                        4242 4242 4242 4242
                    </text>

                    {/* Valid Text */}
                    <text
                        x="24"
                        y="160"
                        fill="#C0C0C0"
                        fontSize="12"
                        opacity="0.8"
                        fontFamily="Arial"
                    >
                        VALID THRU
                    </text>

                    {/* Expiry */}
                    <text
                        x="24"
                        y="180"
                        fill="#C0C0C0"
                        fontSize="12"
                        fontFamily="Arial"
                    >
                        12/28
                    </text>

                    {/* VISA TEXT */}
                    <text
                        x="250"
                        y="180"
                        fill="#C0C0C0"
                        fontSize="28"
                        fontWeight="700"
                        fontStyle="italic"
                        fontFamily="Arial"
                    >
                        VISA
                    </text>
                </g>
            </g>

            {/* ───────────────────────────────────────────── */}
            {/* CARD 2 */}
            {/* ───────────────────────────────────────────── */}
            <g transform="translate(170 130) rotate(2)">
                <g className="card-back">
                    {/* Card Shadow */}
                    <rect
                        x="8"
                        y="8"
                        width="340"
                        height="200"
                        rx="18"
                        fill="#000000"
                        opacity="0.35"
                        filter="url(#goldGlow)"
                    />

                    {/* Main Card */}
                    <rect
                        width="340"
                        height="200"
                        rx="18"
                        fill="#0F172A"
                        stroke="url(#goldGradient)"
                        strokeWidth="2"
                    />

                    {/* Top Highlight */}
                    <line
                        x1="20"
                        y1="20"
                        x2="320"
                        y2="20"
                        stroke="#E5C76B"
                        strokeOpacity="0.4"
                    />

                    {/* Chip */}
                    <rect
                        x="24"
                        y="42"
                        width="68"
                        height="40"
                        rx="6"
                        fill="#C1A050"
                    />

                    {/* Chip Lines */}
                    <line
                        x1="42"
                        y1="42"
                        x2="42"
                        y2="82"
                        stroke="#8B6F2D"
                    />

                    <line
                        x1="24"
                        y1="57"
                        x2="92"
                        y2="57"
                        stroke="#8B6F2D"
                    />

                    {/* Card Number */}
                    <text
                        x="24"
                        y="120"
                        fill="#C0C0C0"
                        fontSize="20"
                        letterSpacing="1.5"
                        fontFamily="monospace"
                    >
                        4242 4242 4242 4242
                    </text>

                    {/* Valid Text */}
                    <text
                        x="24"
                        y="160"
                        fill="#C0C0C0"
                        fontSize="12"
                        opacity="0.8"
                        fontFamily="Arial"
                    >
                        VALID THRU
                    </text>

                    {/* Expiry */}
                    <text
                        x="24"
                        y="180"
                        fill="#C0C0C0"
                        fontSize="12"
                        fontFamily="Arial"
                    >
                        12/28
                    </text>

                    {/* MASTERCARD LOGO  */}

                    {/* Left Circle */}
                    <circle
                        cx="260"
                        cy="150"
                        r="10"
                        fill="#EB001B"
                        opacity="0.9"
                    />

                    {/* Right Circle */}
                    <circle
                        cx="274"
                        cy="150"
                        r="10"
                        fill="#F79E1B"
                        opacity="0.85"
                    />

                    {/* Mastercard Text */}
                    <text
                        x="215"
                        y="180"
                        fill="#C0C0C0"
                        fontSize="20"
                        fontFamily="Arial"
                    >
                        mastercard
                    </text>
                </g>
            </g>

            {/* VAULT NODE */}
            <g transform={`translate(${ORBIT_NODES.vault.x} ${ORBIT_NODES.vault.y})`}>

                {/* Bottom Thickness */}
                <ellipse
                    cx="2"
                    cy="8"
                    rx="34"
                    ry="34"
                    fill="#8B6A22"
                />

                {/* Main Coin */}
                <circle
                    cx="0"
                    cy="0"
                    r="34"
                    fill="url(#coinGradient)"
                    stroke="url(#coinEdge)"
                    strokeWidth="4"
                />

                {/* Inner Ring */}
                <circle
                    cx="0"
                    cy="0"
                    r="24"
                    fill="none"
                    stroke="#F8E7AE"
                    strokeWidth="2"
                    opacity="0.8"
                />

                {/* Dollar Symbol */}
                <text
                    x="-10"
                    y="10"
                    fill="#8B6A22"
                    fontSize="32"
                    fontWeight="700"
                    fontFamily="Arial"
                >
                    $
                </text>

                {/* Top Highlight */}
                <ellipse
                    cx="-10"
                    cy="-12"
                    rx="10"
                    ry="6"
                    fill="#FFF4CC"
                    opacity="0.65"
                />
            </g>


            {/* BANK RIGHT NODE */}
            <g
                transform={`translate(${ORBIT_NODES.bankRight.x} ${ORBIT_NODES.bankRight.y})`}
                filter="url(#silverRouteBlur)"
            >
                {/* Soft glow */}
                <circle
                    r="40"
                    fill="rgba(168,85,247,0.10)"
                />

                {/* Main orb */}
                <circle
                    r="40"
                    fill="rgba(15,23,42,0.82)"
                    stroke="rgba(255,255,255,0.14)"
                    strokeWidth="1.2"
                />

                {/* Inner tint */}
                <circle
                    r="30"
                    fill="url(#routePurple)"
                    opacity="0.16"
                />

                {/* Landmark icon */}
                <foreignObject
                    x="-30"
                    y="-30"
                    width="60"
                    height="60"
                >
                    <div className="flex h-full w-full items-center justify-center">
                        <Landmark className="h-8 w-8 text-white/90" />
                    </div>
                </foreignObject>
            </g>

            {/* WALLET NODE */}
            <g
                transform={`translate(${ORBIT_NODES.wallet.x} ${ORBIT_NODES.wallet.y})`}
                filter="url(#silverRouteBlur)"
            >
                {/* Soft glow */}
                <circle
                    r="40"
                    fill="rgba(74,222,128,0.10)"
                />

                {/* Main orb */}
                <circle
                    r="40"
                    fill="rgba(15,23,42,0.82)"
                    stroke="rgba(255,255,255,0.14)"
                    strokeWidth="1.2"
                />

                {/* Inner tint */}
                <circle
                    r="30"
                    fill="url(#routeSilver)"
                    opacity="0.16"
                />

                {/* Wallet icon */}
                <foreignObject
                    x="-30"
                    y="-30"
                    width="60"
                    height="60"
                >
                    <div className="flex h-full w-full items-center justify-center">
                        <Wallet className="h-8 w-8 text-white/90" />
                    </div>
                </foreignObject>
            </g>


            {/* BANK LEFT NODE */}
            <g
                transform={`translate(${ORBIT_NODES.bankLeft.x} ${ORBIT_NODES.bankLeft.y})`}
                filter="url(#silverRouteBlur)"
            >
                {/* Soft glow */}
                <circle
                    r="40"
                    fill="rgba(168,85,247,0.10)"
                />

                {/* Main orb */}
                <circle
                    r="40"
                    fill="rgba(15,23,42,0.82)"
                    stroke="rgba(255,255,255,0.14)"
                    strokeWidth="1.2"
                />

                {/* Inner tint */}
                <circle
                    r="30"
                    fill="url(#routePurple)"
                    opacity="0.16"
                />

                {/* Landmark icon */}
                <foreignObject
                    x="-30"
                    y="-30"
                    width="60"
                    height="60"
                >
                    <div className="flex h-full w-full items-center justify-center">
                        <Landmark className="h-8 w-8 text-white/90" />
                    </div>
                </foreignObject>
            </g>

            {/* =================================== */}
            {/* PARTICLES */}
            {/* =================================== */}
            {/* Vault To Landmarkright */}
            <g filter="url(#trendGlow)">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    width="36"
                    height="36"
                    x="-18"
                    y="-18"
                    overflow="visible"
                >
                    <g transform="translate(12 12) scale(1) translate(-12 -12)">
                        <path
                            fill="#E5C76B"
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M12 21c4.99 0 9-4.01 9-9s-4.01-9-9-9s-9 4.01-9 9s4.01 9 9 9m2.475-7.578c0-1.31-.787-1.76-2.362-1.946c-1.125-.152-1.35-.45-1.35-.978c0-.523.377-.86 1.125-.86c.675 0 1.052.224 1.237.787c.04.112.152.185.265.185h.596a.256.256 0 0 0 .264-.259v-.039c-.152-.827-.827-1.614-1.687-1.687v-.827c0-.152-.113-.265-.298-.298h-.495c-.152 0-.293.112-.332.298v.827c-1.125.151-1.873 1.012-1.873 1.951c0 1.238.748 1.722 2.323 1.913c1.052.185 1.39.41 1.39 1.012c0 .597-.53 1.013-1.238 1.013c-.98 0-1.316-.416-1.429-.979c-.034-.146-.146-.225-.259-.225h-.641a.256.256 0 0 0-.259.264v.04c.146.934.748 1.575 1.986 1.76v.833c0 .152.112.253.298.293h.54c.146 0 .248-.102.287-.293v-.833c1.125-.185 1.912-.939 1.912-1.952m-6.262 2.803a5.6 5.6 0 0 0 1.875 1.135c.112.079.225.225.225.338v.528c0 .073 0 .113-.04.146c-.033.152-.185.225-.337.152a6.751 6.751 0 0 1 0-12.864c.04-.034.112-.034.152-.034c.152.034.225.147.225.298v.524c0 .19-.073.303-.225.376a5.55 5.55 0 0 0-3.336 3.336a5.59 5.59 0 0 0 1.46 6.065m5.514-10.413c.034-.152.186-.225.338-.152a6.8 6.8 0 0 1 4.387 4.427c1.125 3.56-.827 7.352-4.387 8.477c-.04.033-.113.033-.152.033c-.152-.033-.225-.146-.225-.298v-.523c0-.191.073-.303.225-.377a5.55 5.55 0 0 0 3.335-3.335a5.585 5.585 0 0 0-3.335-7.2c-.113-.079-.225-.225-.225-.377v-.523c0-.079 0-.113.04-.152"
                        />
                    </g>
                </svg>


                <animateMotion
                    dur="3s"
                    repeatCount="indefinite"
                    rotate="auto"
                >
                    <mpath href="#p-vault-landmarkRight" />
                </animateMotion>
            </g>

            {/* Landmarkright To Wallet */}
            <g filter="url(#trendGlow)">
                {/* Coin body */}
                <circle
                    r="13"
                    fill="rgba(193, 160, 80, 0.18)"
                    stroke="#D6B86A"
                    strokeWidth="1.5"
                />

                {/* Inner fill */}
                <circle
                    r="7"
                    fill="rgba(229, 199, 107, 0.12)"
                />

                {/* Currency symbol */}
                <text
                    textAnchor="middle"
                    dy="4"
                    fontSize="14"
                    fontWeight="700"
                    fill="#E5C76B"
                >
                    $
                </text>

                <animateMotion
                    dur="5s"
                    repeatCount="indefinite"
                    rotate="auto"
                >
                    <mpath href="#p-landmarkRight-wallet" />
                </animateMotion>
            </g>

            {/* Wallet To LandmarkLeft */}
            <g filter="url(#trendGlow)">
                {/* Coin */}
                <circle
                    r="13"
                    fill="rgba(193, 160, 80, 0.15)"
                    stroke="#D6B86A"
                    strokeWidth="1.5"
                />

                {/* Inner Fill */}
                <circle
                    r="7"
                    fill="rgba(229, 199, 107, 0.10)"
                />

                {/* $ */}
                <text
                    textAnchor="middle"
                    dy="4"
                    fontSize="14"
                    fontWeight="700"
                    fill="#E5C76B"
                >
                    <animate
                        attributeName="opacity"
                        values="1;0;0;0;0;0"
                        dur="5s"
                        repeatCount="indefinite"
                    />
                    $
                </text>

                {/* € */}
                <text
                    textAnchor="middle"
                    dy="4"
                    fontSize="14"
                    fontWeight="700"
                    fill="#E5C76B"
                    opacity="0"
                >
                    <animate
                        attributeName="opacity"
                        values="0;1;0;0;0;0"
                        dur="5s"
                        repeatCount="indefinite"
                    />
                    €
                </text>

                {/* ¥ */}
                <text
                    textAnchor="middle"
                    dy="4"
                    fontSize="14"
                    fontWeight="700"
                    fill="#E5C76B"
                    opacity="0"
                >
                    <animate
                        attributeName="opacity"
                        values="0;0;1;0;0;0"
                        dur="5s"
                        repeatCount="indefinite"
                    />
                    ¥
                </text>

                {/* £ */}
                <text
                    textAnchor="middle"
                    dy="4"
                    fontSize="14"
                    fontWeight="700"
                    fill="#E5C76B"
                    opacity="0"
                >
                    <animate
                        attributeName="opacity"
                        values="0;0;0;1;0;0"
                        dur="5s"
                        repeatCount="indefinite"
                    />
                    £
                </text>

                {/* ₹ */}
                <text
                    textAnchor="middle"
                    dy="4"
                    fontSize="14"
                    fontWeight="700"
                    fill="#E5C76B"
                    opacity="0"
                >
                    <animate
                        attributeName="opacity"
                        values="0;0;0;0;1;0"
                        dur="5s"
                        repeatCount="indefinite"
                    />
                    ₹
                </text>

                {/* ( $ ) */}
                <text
                    textAnchor="middle"
                    dy="4"
                    fontSize="11"
                    fontWeight="700"
                    fill="#E5C76B"
                    opacity="0"
                >
                    <animate
                        attributeName="opacity"
                        values="0;0;0;0;0;1"
                        dur="5s"
                        repeatCount="indefinite"
                    />
                    ($)
                </text>

                {/* Motion */}
                <animateMotion
                    dur="5s"
                    repeatCount="indefinite"
                    rotate="auto"
                >
                    <mpath href="#p-wallet-landmarkLeft" />
                </animateMotion>
            </g>


            {/* LandmarkLeft To StatsTrendLine */}
            <g filter="url(#trendGlow)">
                {/* Coin */}
                <circle
                    r="13"
                    fill="rgba(193, 160, 80, 0.15)"
                    stroke="#D6B86A"
                    strokeWidth="1.5"
                />

                {/* Inner fill */}
                <circle
                    r="7"
                    fill="rgba(229, 199, 107, 0.10)"
                />

                {/* $ */}
                <text
                    textAnchor="middle"
                    dy="4"
                    fontSize="14"
                    fontWeight="700"
                    fill="#E5C76B"
                >
                    <animate
                        attributeName="opacity"
                        values="1;0;0;0;0;0"
                        dur="5s"
                        repeatCount="indefinite"
                    />
                    $
                </text>

                {/* € */}
                <text
                    textAnchor="middle"
                    dy="4"
                    fontSize="14"
                    fontWeight="700"
                    fill="#E5C76B"
                    opacity="0"
                >
                    <animate
                        attributeName="opacity"
                        values="0;1;0;0;0;0"
                        dur="5s"
                        repeatCount="indefinite"
                    />
                    €
                </text>

                {/* ¥ */}
                <text
                    textAnchor="middle"
                    dy="4"
                    fontSize="14"
                    fontWeight="700"
                    fill="#E5C76B"
                    opacity="0"
                >
                    <animate
                        attributeName="opacity"
                        values="0;0;1;0;0;0"
                        dur="5s"
                        repeatCount="indefinite"
                    />
                    ¥
                </text>

                {/* £ */}
                <text
                    textAnchor="middle"
                    dy="4"
                    fontSize="14"
                    fontWeight="700"
                    fill="#E5C76B"
                    opacity="0"
                >
                    <animate
                        attributeName="opacity"
                        values="0;0;0;1;0;0"
                        dur="5s"
                        repeatCount="indefinite"
                    />
                    £
                </text>

                {/* ₽ */}
                <text
                    textAnchor="middle"
                    dy="4"
                    fontSize="14"
                    fontWeight="700"
                    fill="#E5C76B"
                    opacity="0"
                >
                    <animate
                        attributeName="opacity"
                        values="0;0;0;0;1;0"
                        dur="5s"
                        repeatCount="indefinite"
                    />
                    ₽
                </text>

                {/* ($) */}
                <text
                    textAnchor="middle"
                    dy="4"
                    fontSize="11"
                    fontWeight="700"
                    fill="#E5C76B"
                    opacity="0"
                >
                    <animate
                        attributeName="opacity"
                        values="0;0;0;0;0;1"
                        dur="5s"
                        repeatCount="indefinite"
                    />
                    ($)
                </text>

                {/* Motion */}
                <animateMotion
                    dur="5s"
                    repeatCount="indefinite"
                    rotate="auto"
                >
                    <mpath href="#p-landmarkLeft-out" />
                </animateMotion>
            </g>
        </svg>
    );
}


// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────
export default function BrandingComponent() {
    return (
        <div className="relative h-full w-full bg-transparent text-white">

            {/* ── Content layout ── */}
            <div className="relative z-10 grid h-full grid-rows-[auto_minmax(0,1fr)_auto] gap-4 py-10! px-8! lg:px-10!">

                {/* TOP: Heading */}
                <div className="w-full animate-[rise_0.8s_cubic-bezier(0.22,1,0.36,1)_both] flex flex-col justify-center items-center">
                    <h1 className="text-2xl font-bold leading-tight tracking-normal lg:text-3xl xl:text-4xl text-[#C0C0C0]">
                        Future of{" "}
                        <span className="bg-[linear-gradient(135deg,#E5C76B,#C1A050,#BB9847)] bg-clip-text text-transparent">
                            crypto Payments
                        </span>
                    </h1>
                    <p className="mt-3 text-sm text-center leading-relaxed text-[#C0C0C0] lg:text-[14px] xl:text-[15px] font-semibold">
                        Institutional-grade digital finance for borderless crypto and fiat transactions.
                    </p>
                </div>

                <div className="relative my-4 min-h-0">

                    {/* ── ORBIT SYSTEM — z-0, behind everything ── */}
                    <div className="absolute inset-0 z-0">
                        <TransactionOrbitSystem />
                    </div>

                    {/* Soft center spotlight */}
                    <div className="pointer-events-none absolute left-1/2 top-1/2 h-[22rem] w-[22rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[oklch(0.9_0.05_240)] opacity-[0.06] blur-3xl z-[1]" />

                    {/* ── Decorative edge coin orbs — percentage positions (not SVG-anchored) ── */}
                    <CoinOrb className="absolute left-[-4%] top-[0%] z-10 animate-[float_6s_ease-in-out_infinite_0.2s]" >
                        <EthereumIcon />
                    </CoinOrb>
                    <CoinOrb className="absolute right-[-6%] top-[-16%] z-10 animate-[float_9s_ease-in-out_infinite_0.6s]" size="sm">
                        <UsdtIcon />
                    </CoinOrb>
                    <CoinOrb className="absolute left-[-4%] bottom-[0%] z-10 animate-[float_9s_ease-in-out_infinite_1.4s]" size="sm">
                        <UsdcIcon />
                    </CoinOrb>
                    {/* <CoinOrb className="absolute left-[50%] top-[6%] -translate-x-1/2 z-10 animate-[float_9s_ease-in-out_infinite_0.8s]" bg="oklch(0.55 0.22 295)" size="sm">
                            <SolanaIcon />
                        </CoinOrb> */}
                    <CoinOrb className="absolute right-[-1%] top-[50%] z-10 animate-[float_9s_ease-in-out_infinite_0.5s]" size="sm">
                        <XrpIcon />
                    </CoinOrb>
                    <CoinOrb className="absolute right-[-2%] bottom-[4%] z-10 animate-[float_6s_ease-in-out_infinite_1.8s]" size="sm">
                        <BnbIcon />
                    </CoinOrb>

                    {/* ── Currency symbol particles ── */}
                    <CurrencySymbol className="absolute left-[14%] top-[0%] z-10" delay="0s" currencySymbol={"DOLLAR"} />
                    <CurrencySymbol className="absolute left-[36%] top-[18%] z-10" delay="0.6s" currencySymbol={"EURO"} />
                    <CurrencySymbol className="absolute right-[-2%] top-[28%] z-10" delay="1.2s" currencySymbol={"SWISSFRANC"} />
                    <CurrencySymbol className="absolute right-[10%] bottom-[0%] z-10" delay="1.8s" currencySymbol={"YEN"} />
                    <CurrencySymbol className="absolute left-[-4%] top-[60%] z-10" delay="0.3s" currencySymbol={"RUBLE"} />
                    <CurrencySymbol className="absolute left-[40%] bottom-[14%] z-10" delay="0.3s" currencySymbol={"RIAL"} />

                    {/* ── Stat / Tx pills ── */}
                    <div className="absolute left-[-4%] top-[18%] z-10 animate-[float_9s_ease-in-out_infinite_0.9s]">
                        <TxPill type="out" amount="-180 USDC" />
                    </div>
                    <div className="absolute right-[-6%] top-[6%] z-10 animate-[float_6s_ease-in-out_infinite_1.3s]">
                        <StatPill icon={<TrendingUp className="h-3 w-3" />} label="+50.4%" positive />
                    </div>
                    <div className="absolute left-[24%] bottom-[14%] z-10 animate-[float_6s_ease-in-out_infinite_0.2s]">
                        <StatPill icon={<TrendingUp className="h-3 w-3" />} label="+12.4%" positive />
                    </div>
                    <div className="absolute right-[14%] bottom-[16%] z-10 animate-[float_6s_ease-in-out_infinite_0.2s]">
                        <TxPill type="in" amount="+2.45 ETH" />
                    </div>
                    {/* <div className="absolute left-[32%] bottom-[6%] z-10 animate-[float_9s_ease-in-out_infinite_1.1s]">
                            <StatPill icon={<TrendingDown className="h-3 w-3" />} label="-11.1%" positive={false} />
                        </div> */}

                    {/* BANK fiat badge */}
                    {/* <div className="absolute left-[2%] bottom-[35%] z-10 animate-[float_9s_ease-in-out_infinite_0.6s]">
                            <FiatBadge label="BANK" />
                        </div> */}
                </div>

                {/* BOTTOM: Feature badges */}
                <div className="space-y-5! animate-[rise_0.8s_cubic-bezier(0.22,1,0.36,1)_both_0.3s] flex justify-center items-center gap-4">
                    <div className="grid grid-cols-3 gap-3 max-w-full">
                        <FeatureBadge icon={<Shield className="h-4 w-4" />} label="Secure" />
                        <FeatureBadge icon={<Zap className="h-4 w-4" />} label="Instant" />
                        <FeatureBadge icon={<Wallet className="h-4 w-4" />} label="Web3" />
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

type CoinOrbSize = "sm" | "md" | "lg";

// Added optional `style` prop so SVG-anchored orbs can receive inline % positions
function CoinOrb({ children, className = "", size = "md", style }: { children: React.ReactNode; className?: string; size?: CoinOrbSize; style?: React.CSSProperties; }) {
    const dimMap: Record<CoinOrbSize, string> = {
        sm: "h-12 w-12",
        md: "h-14 w-14",
        lg: "h-16 w-16",
    };
    return (
        <div className={`flex ${dimMap[size]} items-center justify-center rounded-full border border-[#C1A050]/20 backdrop-blur-[18px] shadow-[0_8px_30px_rgba(0,0,0,0.45)] ${className}`}
            style={{
                background:
                    "linear-gradient(180deg, rgba(40,40,43,0.92), rgba(15,23,42,0.95))",
                ...style,
            }}
        >
            <div className="absolute inset-0 rounded-full bg-[#C1A050]/5" />

            <div className="relative z-10 text-[#CBAB58]">
                {children}
            </div>
        </div>
    );
}

function FeatureBadge({ icon, label, }: { icon: React.ReactNode; label: string; }) {
    return (
        <div className="flex justify-center items-center gap-2 rounded-xl bg-[linear-gradient(180deg,rgba(40,40,43,0.88),rgba(15,23,42,0.92))] border border-[#C1A050]/15 px-16! py-2! text-xs font-bold backdrop-blur-[18px] shadow-[0_8px_32px_rgba(0,0,0,0.45)]"
        >
            <span className="text-[#CBAB58]">
                {icon}
            </span>
            <span className="text-[#C0C0C0]">
                {label}
            </span>
        </div>
    );
}

function EthereumIcon() {
    return (
        <svg viewBox="0 0 256 417" className="h-6 w-6" fill="currentColor">
            <polygon opacity="0.85" points="127.9,0 125.2,9.5 125.2,285.2 127.9,287.9 255.8,212.3" />
            <polygon points="127.9,0 0,212.3 127.9,287.9 127.9,154.1" opacity="0.6" />
            <polygon opacity="0.85" points="127.9,312.2 126.4,314 126.4,412.3 127.9,416.9 255.9,236.6" />
            <polygon points="127.9,416.9 127.9,312.2 0,236.6" opacity="0.6" />
        </svg>
    );
}
function UsdtIcon() { return <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-base font-bold">₮</div>; }
function UsdcIcon() { return <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-[9px] font-bold tracking-wide">USDC</div>; }
function SolanaIcon() {
    return (
        <svg viewBox="0 0 397 311" className="h-5 w-5" fill="currentColor">
            <path d="M64 237l-58 58c-3 3-1 8 4 8h322c2 0 4-1 5-2l58-58c3-3 1-8-4-8H68c-2 0-3 1-4 2z" opacity="0.9" />
            <path d="M64 6L6 64c-3 3-1 8 4 8h322c2 0 4-1 5-2l58-58c3-3 1-8-4-8H68c-2 0-3 1-4 2z" opacity="0.7" />
            <path d="M333 121H11c-5 0-7 5-4 8l58 58c1 1 3 2 5 2h322c5 0 7-5 4-8l-58-58c-1-1-3-2-5-2z" opacity="0.8" />
        </svg>
    );
}
function BnbIcon() { return <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-base font-bold">◆</div>; }
function XrpIcon() { return <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-[9px] font-bold tracking-wide">XRP</div>; }

type CurrencyType = "DOLLAR" | "EURO" | "YEN" | "SWISSFRANC" | "RIAL" | "RUBLE";
function CurrencySymbol({ className = "", delay = "0s", currencySymbol }: {
    className?: string; delay?: string; currencySymbol: CurrencyType;
}) {
    const iconMap: Record<CurrencyType, React.ElementType> = {
        DOLLAR: DollarSign, EURO: Euro, YEN: JapaneseYen,
        SWISSFRANC: SwissFranc, RIAL: SaudiRiyal, RUBLE: RussianRuble,
    };
    const Icon = iconMap[currencySymbol];
    return (
        <div className={`pointer-events-none ${className} animate-[pulseGlow_4s_ease-in-out_infinite]`}
            style={{ animationDelay: delay } as React.CSSProperties}>
            <Icon className="h-3 w-3 text-white/90 drop-shadow-[0_0_6px_#023e8a]" />
        </div>
    );
}

function TxPill({ type, amount }: { type: "in" | "out"; amount: string }) {
    const isIn = type === "in";
    return (
        <div className="flex items-center gap-2 rounded-full bg-[linear-gradient(180deg,rgba(40,40,43,0.88),rgba(15,23,42,0.92))] backdrop-blur-[18px] border border-[#C1A050]/20 px-3! py-1.5! text-[11px] font-semibold shadow-[0_8px_32px_rgba(0,0,0,0.45)] ring-1 ring-[#C1A050]/10">
            <span className={isIn ? "text-[#CBAB58]" : "text-[#A6A6A6]"}>
                {isIn ? <ArrowDownLeft className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
            </span>
            <span className="text-white">{amount}</span>
        </div>
    );
}

function StatPill({ icon, label, positive }: { icon: React.ReactNode; label: string; positive: boolean }) {
    return (
        <div className="flex items-center gap-2 rounded-full bg-[linear-gradient(180deg,rgba(40,40,43,0.88),rgba(15,23,42,0.92))] backdrop-blur-[18px] border border-[#C1A050]/20 px-3! py-1.5! text-[11px] font-semibold shadow-[0_8px_32px_rgba(0,0,0,0.45)] ring-1 ring-[#C1A050]/10">
            <span className={positive ? "text-[#CBAB58]" : "text-[#A6A6A6]"}>{icon}</span>
            <span className="text-white/90">{label}</span>
        </div>
    );
}