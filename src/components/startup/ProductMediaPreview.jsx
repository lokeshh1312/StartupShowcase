import React from 'react';
import { Terminal, Shield, Database, Waves, Activity, Layers, Play, CheckCircle2, Copy } from 'lucide-react';

export const ProductMediaPreview = ({ startup }) => {
  if (!startup) return null;

  const type = startup.mediaPreview?.type || 'interface';

  return (
    <div className="relative w-full rounded-2xl bg-gradient-to-br from-[#0c101a] via-[#0f1526] to-[#0a0d14] border border-slate-800 shadow-2xl overflow-hidden aspect-[16/10] sm:aspect-[16/9] flex flex-col">
      {/* Top OS Window chrome bar */}
      <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500/80" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>
          <div className="ml-3 px-3 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
            <span>https://{startup.slug}.app</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-medium text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/20">
            {startup.mediaPreview?.badge || 'Live Production Build'}
          </span>
        </div>
      </div>

      {/* Main Interactive Mockup Canvas */}
      <div className="relative flex-1 p-6 flex flex-col justify-between overflow-hidden">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-25" />

        {/* Dynamic visual representation based on startup type */}
        {type === 'interface' && (
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-teal-400" />
                <span className="text-xs font-mono text-slate-200">Repository AST Drift Map</span>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                +42.3% Optimization
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-[11px] text-slate-400">AST Nodes Audited</div>
                <div className="text-lg font-bold font-mono text-teal-300">148,920</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-[11px] text-slate-400">Sub-second Latency</div>
                <div className="text-lg font-bold font-mono text-cyan-300">34ms</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-[11px] text-slate-400">Auto-Fix PRs</div>
                <div className="text-lg font-bold font-mono text-emerald-300">12 Ready</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 font-mono text-xs text-slate-300 space-y-1">
              <div className="text-slate-500">// Automated PR patch preview</div>
              <div><span className="text-rose-400">- await query.executeUnbuffered();</span></div>
              <div><span className="text-emerald-400">{'+ await query.streamWithCursor({ batchSize: 500 });'}</span></div>
            </div>
          </div>
        )}

        {type === 'canvas' && (
          <div className="relative z-10 flex flex-col items-center justify-center h-full text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-xl shadow-cyan-500/10">
              <Layers className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Spatial Engineering Canvas</h4>
              <p className="text-xs text-slate-400 max-w-xs mt-1">
                WebGL 2.0 multi-threaded infinite zoom with 120 FPS node rendering
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-300">
              <span>● 4 Engineers live in session</span>
            </div>
          </div>
        )}

        {type === 'security' && (
          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
              <div className="flex items-center gap-2 text-emerald-400">
                <Shield className="w-4 h-4" />
                <span className="text-xs font-mono font-medium">Hardware Enclave Sealed</span>
              </div>
              <span className="text-xs font-mono text-slate-400">AES-256-GCM</span>
            </div>

            <div className="space-y-2 font-mono text-xs">
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-slate-300">
                <span>STRIPE_SECRET_KEY</span>
                <span className="text-emerald-400">● Injected in 2.1ms</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-slate-300">
                <span>OPENAI_ORGANIZATION_ID</span>
                <span className="text-emerald-400">● Enclave Verified</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-slate-300">
                <span>DATABASE_URL</span>
                <span className="text-teal-400">● Wireguard Tunneled</span>
              </div>
            </div>
          </div>
        )}

        {type === 'sql' && (
          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
              <div className="flex items-center gap-2 text-blue-400">
                <Database className="w-4 h-4" />
                <span className="text-xs font-mono">Query Execution Explainer</span>
              </div>
              <span className="text-xs font-mono text-teal-400">Cost: 0.04ms</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-blue-300">
              <code>SELECT id, name, ARR FROM enterprises WHERE active_since &gt; NOW() - INTERVAL '30 days';</code>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-slate-400">Index Scan</div>
                <div className="font-semibold text-emerald-400 font-mono">idx_enterprises_active</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-slate-400">Buffer Hit</div>
                <div className="font-semibold text-teal-400 font-mono">99.8% Cached</div>
              </div>
            </div>
          </div>
        )}

        {type === 'ai-voice' && (
          <div className="relative z-10 flex flex-col justify-center items-center text-center space-y-3 py-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Waves className="w-6 h-6 animate-pulse" />
            </div>
            <div className="font-mono text-xs text-slate-300">
              Apple Silicon Neural Engine Active (38.4 TFLOPS)
            </div>
            <div className="w-full max-w-sm p-3 rounded-xl bg-slate-950/90 border border-slate-800 text-xs font-mono text-teal-300 text-left">
              &quot;The launch metrics show 3x higher retention when onboarding via the CLI...&quot;
            </div>
          </div>
        )}

        {/* Fallback default */}
        {!['interface', 'canvas', 'security', 'sql', 'ai-voice'].includes(type) && (
          <div className="relative z-10 flex flex-col items-center justify-center h-full text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Terminal className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-white">{startup.name} Core Engine</h4>
            <p className="text-xs text-slate-400 max-w-xs">{startup.tagline}</p>
          </div>
        )}

        {/* Bottom Banner Stats */}
        <div className="relative z-10 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-1.5 text-teal-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{startup.mediaPreview?.primaryStat || 'Verified Public Beta'}</span>
          </div>
          <div className="text-slate-400">
            {startup.mediaPreview?.subStat || 'Ready for evaluation'}
          </div>
        </div>
      </div>
    </div>
  );
};
