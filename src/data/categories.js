export const CATEGORIES = [
  {
    id: 'ai',
    name: 'Artificial Intelligence',
    slug: 'ai',
    iconName: 'Sparkles',
    count: 142,
    trending: true,
    color: 'from-cyan-500/20 to-teal-500/20 text-cyan-400 border-cyan-500/30',
    description: 'Autonomous agents, generative models, multimodal intelligence, and AI-powered workflows.',
    subcategories: ['Autonomous Agents', 'LLM Infrastructure', 'Code Generation', 'Creative AI', 'Voice & Audio', 'Computer Vision']
  },
  {
    id: 'devtools',
    name: 'Developer Tools',
    slug: 'devtools',
    iconName: 'Terminal',
    count: 118,
    trending: true,
    color: 'from-blue-500/20 to-indigo-500/20 text-blue-400 border-blue-500/30',
    description: 'IDEs, API gateways, database orchestration, CI/CD pipelines, and cloud observability.',
    subcategories: ['Databases & ORMs', 'API Platforms', 'DevOps & CI/CD', 'Testing & QA', 'Observability', 'Frameworks']
  },
  {
    id: 'productivity',
    name: 'Productivity',
    slug: 'productivity',
    iconName: 'Zap',
    count: 96,
    trending: false,
    color: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30',
    description: 'Smart workspaces, knowledge bases, task management, calendar automation, and focus tools.',
    subcategories: ['Notes & Docs', 'Time Management', 'Email Clients', 'Search & Retrieval', 'Automation', 'Task Trackers']
  },
  {
    id: 'design',
    name: 'Design & Creative',
    slug: 'design',
    iconName: 'Palette',
    count: 74,
    trending: false,
    color: 'from-fuchsia-500/20 to-pink-500/20 text-fuchsia-400 border-fuchsia-500/30',
    description: 'Design systems, 3D engines, motion design, icon repositories, and generative canvas tools.',
    subcategories: ['UI/UX Kits', 'Motion & 3D', 'Generative Assets', 'Color & Typography', 'Design Systems', 'Mockup Engines']
  },
  {
    id: 'fintech',
    name: 'FinTech & Commerce',
    slug: 'fintech',
    iconName: 'CreditCard',
    count: 65,
    trending: true,
    color: 'from-emerald-500/20 to-green-500/20 text-emerald-400 border-emerald-500/30',
    description: 'Global payment rails, revenue intelligence, banking APIs, and decentralized finance primitives.',
    subcategories: ['Payment Infrastructure', 'Revenue Ops', 'Accounting & Tax', 'Expense Cards', 'Crypto & Web3', 'Invoicing']
  },
  {
    id: 'collaboration',
    name: 'Team Collaboration',
    slug: 'collaboration',
    iconName: 'Users',
    count: 58,
    trending: false,
    color: 'from-violet-500/20 to-purple-500/20 text-violet-400 border-violet-500/30',
    description: 'Async video, virtual standups, collaborative whiteboards, and remote team rituals.',
    subcategories: ['Async Standups', 'Virtual Offices', 'Interactive Canvases', 'Feedback & Reviews', 'Handoff Tools']
  },
  {
    id: 'marketing',
    name: 'Marketing & Sales',
    slug: 'marketing',
    iconName: 'TrendingUp',
    count: 52,
    trending: false,
    color: 'from-rose-500/20 to-red-500/20 text-rose-400 border-rose-500/30',
    description: 'Outbound sales automation, programmatic SEO, newsletter platforms, and buyer intent analytics.',
    subcategories: ['Outbound AI', 'Content Engines', 'Analytics & Attribution', 'SEO Optimization', 'Lead Intelligence']
  },
  {
    id: 'security',
    name: 'Security & Privacy',
    slug: 'security',
    iconName: 'ShieldCheck',
    count: 43,
    trending: true,
    color: 'from-teal-500/20 to-emerald-500/20 text-teal-400 border-teal-500/30',
    description: 'Zero-trust architecture, automated compliance, vulnerability scanners, and identity verification.',
    subcategories: ['Compliance Automation', 'Secrets Management', 'Cloud Security', 'Auth & Identity', 'Data Encryption']
  }
];

export const TRENDING_TAGS = [
  'All',
  'Autonomous Agents',
  'Local LLM',
  'Developer Experience',
  'Zero-Config',
  'Vector Search',
  'Open Source',
  'Async Video',
  'Design Tokens',
  'Solopreneur',
  'Micro-SaaS',
  'Privacy-First',
  'Real-Time Sync'
];
