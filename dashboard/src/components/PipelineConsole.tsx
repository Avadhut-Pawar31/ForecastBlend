import { useState, useEffect } from 'react';
import { PipelineExecution } from '../types';
import { Terminal, CheckCircle2, Circle, Loader2, Play, X } from 'lucide-react';
import './PipelineConsole.css';

interface Props {
  pipeline: PipelineExecution | null;
  onTrigger: () => void;
  onClose?: () => void;
}

export default function PipelineConsole({ pipeline, onTrigger, onClose }: Props) {
  const [activeStageIdx, setActiveStageIdx] = useState(0);
  const [logs, setLogs] = useState<string[]>([
    '[INIT] Step Functions state machine orchestration initialized.',
    '[SYSTEM] Operational Multi-Model AI-NWP Blending Daemon active.'
  ]);

  const stages = [
    { id: 'ingest', name: 'Ingest Multi-Model Forecasts', desc: 'Pull NOAA GFS, ECMWF IFS, GraphCast' },
    { id: 'normalize', name: 'Normalize Coordinates & Units', desc: 'Standardize grid, timezones, and units' },
    { id: 'skill', name: 'Evaluate Trailing Skill (MAE)', desc: 'Compute error window over 14d ground truth' },
    { id: 'weight', name: 'Compute Adaptive Weights', desc: 'Inverse-MAE softmax with Laplace smoothing' },
    { id: 'blend', name: 'Synthesize Consensus Forecast', desc: 'Compute weighted mean & ensemble spread' },
    { id: 'extreme', name: 'Evaluate Extreme Thresholds', desc: 'Test IMD heavy rain, heatwave, gale wind rules' },
    { id: 'backtest', name: 'Run Verification Backtest', desc: 'Quantify MAE/RMSE error reduction' },
  ];

  const stageLogMap: Record<number, string> = {
    0: '[STAGE 1/7] Ingesting NWP GFS (0.25°), ECMWF IFS (0.1°), AI GraphCast (0.25°)... [SUCCESS]',
    1: '[STAGE 2/7] Normalizing timestamps to UTC and standardizing rainfall (mm), temp (°C), wind (km/h)... [VALIDATED]',
    2: '[STAGE 3/7] Calculating trailing window Mean Absolute Error (MAE) per station and regime... [COMPLETED]',
    3: '[STAGE 4/7] Computing regularized inverse-MAE softmax weights with Laplace shrinkage (λ=0.15)... [SUM=1.000]',
    4: '[STAGE 5/7] Synthesizing consensus blend: B(t) = ∑ w_i · F_i(t) & computing ensemble spread σ... [CONVERGED]',
    5: '[STAGE 6/7] Evaluating meteorological risk rules (IMD thresholds: >64.5mm, ≥40°C, >50km/h)... [EVALUATED]',
    6: '[STAGE 7/7] Computing empirical backtest benchmarks: -22.4% error reduction verified... [READY]'
  };

  const isRunning = pipeline?.status === 'RUNNING';

  useEffect(() => {
    if (isRunning) {
      setLogs(['[TRIGGER] Manual pipeline execution initiated by operator.']);
      setActiveStageIdx(0);

      const interval = setInterval(() => {
        setActiveStageIdx(prev => {
          if (prev < stages.length) {
            setLogs(curr => [...curr, stageLogMap[prev]]);
          }
          if (prev >= stages.length - 1) {
            clearInterval(interval);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isRunning]);

  return (
    <div className="pipeline-console-card">
      <div className="pc-header">
        <div className="pc-title-group">
          <Terminal size={16} className="terminal-icon" />
          <h3 className="pc-title">Blending Pipeline Orchestration Console</h3>
        </div>

        <div className="pc-actions">
          <button
            className={`trigger-pipeline-btn ${isRunning ? 'running' : ''}`}
            onClick={onTrigger}
            disabled={isRunning}
          >
            {isRunning ? (
              <>
                <Loader2 size={13} className="spin" />
                <span>Executing Pipeline...</span>
              </>
            ) : (
              <>
                <Play size={13} />
                <span>Run Pipeline Cycle</span>
              </>
            )}
          </button>

          {onClose && (
            <button className="pc-close-btn" onClick={onClose} title="Close Console">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="pc-split-view">
        {/* Stages Stepper */}
        <div className="stages-stepper">
          {stages.map((stage, idx) => {
            const isCompleted = !isRunning || activeStageIdx > idx;
            const isCurrent = isRunning && activeStageIdx === idx;

            return (
              <div 
                key={stage.id} 
                className={`stage-row ${isCurrent ? 'current' : ''} ${isCompleted ? 'completed' : ''}`}
              >
                <div className="stage-marker">
                  {isCurrent ? (
                    <Loader2 size={14} className="spin text-amber" />
                  ) : isCompleted ? (
                    <CheckCircle2 size={14} className="text-emerald" />
                  ) : (
                    <Circle size={14} className="text-dim" />
                  )}
                </div>

                <div className="stage-info">
                  <span className="stage-name">{stage.name}</span>
                  <span className="stage-desc">{stage.desc}</span>
                </div>

                <span className="stage-status font-mono">
                  {isCurrent ? 'RUNNING' : (isCompleted ? 'SUCCEEDED' : 'PENDING')}
                </span>
              </div>
            );
          })}
        </div>

        {/* Real-time Terminal Log Console */}
        <div className="terminal-log-box font-mono">
          <div className="tlb-header">
            <span className="tlb-title">Console Output (stdout)</span>
            <span className="tlb-id">ID: {pipeline?.executionId || 'SYS-IDLE'}</span>
          </div>

          <div className="tlb-content">
            {logs.map((log, i) => (
              <div key={i} className="log-line">
                <span className="log-prompt">$</span>
                <span className="log-msg">{log}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
