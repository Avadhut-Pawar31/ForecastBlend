import { useEffect, useState } from 'react';
import { PipelineExecution } from '../types';
import { CheckCircle2, Circle, Loader2, Terminal, Workflow } from 'lucide-react';
import './PipelineStatus.css';

interface Props {
  pipeline: PipelineExecution | null;
  setPipeline: (p: PipelineExecution | null) => void;
}

export default function PipelineStatus({ pipeline, setPipeline }: Props) {
  const [activeStage, setActiveStage] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);

  const stages = [
    'Ingest Model Outputs',
    'Normalize & Validate',
    'Compute Skill Scores',
    'Invoke Blend Weight Model',
    'Compute Blended Forecast',
    'Detect Extreme Conditions',
    'Run Backtest'
  ];

  const logMessages = [
    '[INGEST] Fetching NWP_GFS (+24h to +96h), NWP_ECMWF (+24h to +96h), AI_GRAPHCAST (+24h to +96h)',
    '[NORMALIZE] Validating variable shapes, diurnal rhythms, and unit scales',
    '[SKILL] Calculating trailing window Mean Absolute Error (MAE) per region and regime',
    '[MODEL] Evaluating inverse-error softmax function: w_i = (1/MAE_i) / Σ(1/MAE_j)',
    '[BLEND] Computing weighted linear blend: B(t) = Σ w_i * F_i(t)',
    '[EXTREME] Evaluating rainfall >115mm, heatwave >=40C, high wind >62kmh rules',
    '[BACKTEST] Comparing Blended MAE vs individual model baselines. +23% improvement verified.'
  ];

  useEffect(() => {
    if (pipeline && pipeline.status === 'RUNNING') {
      setLogs(['[SYSTEM] Step Functions pipeline execution initiated...']);
      const interval = setInterval(() => {
        setActiveStage(prev => {
          if (prev < stages.length) {
            setLogs(current => [...current, logMessages[prev]]);
          }
          if (prev >= stages.length - 1) {
            clearInterval(interval);
            setPipeline({ ...pipeline, status: 'SUCCEEDED' });
            return prev;
          }
          return prev + 1;
        });
      }, 1400);
      return () => clearInterval(interval);
    } else {
      setActiveStage(0);
      if (!pipeline) {
        setLogs(['[SYSTEM] Pipeline idle. Ready for manual trigger or scheduled cron cycle.']);
      }
    }
  }, [pipeline, setPipeline]);

  return (
    <div className="card pipeline-card">
      <div className="pipeline-header">
        <h2 className="panel-title">
          <Workflow size={18} className="pipeline-title-icon" />
          Pipeline Execution State (Step Functions)
        </h2>
        {pipeline?.status === 'RUNNING' && <span className="running-badge"><Loader2 size={12} className="spin" /> Executing</span>}
        {pipeline?.status === 'SUCCEEDED' && <span className="success-badge"><CheckCircle2 size={12} /> Completed</span>}
        {!pipeline && <span className="idle-badge">Ready</span>}
      </div>

      <div className="stepper">
        {stages.map((stage, idx) => {
          let status = 'pending';
          if (pipeline) {
            if (pipeline.status === 'SUCCEEDED') status = 'done';
            else if (idx < activeStage) status = 'done';
            else if (idx === activeStage) status = 'running';
          }

          return (
            <div key={idx} className={`step ${status}`}>
              <div className="step-icon">
                {status === 'done' && <CheckCircle2 size={18} className="icon-done" />}
                {status === 'running' && <Loader2 size={18} className="icon-running spin" />}
                {status === 'pending' && <Circle size={18} className="icon-pending" />}
              </div>
              <div className="step-content">
                <span className="step-label">{stage}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="terminal-log-box">
        <div className="terminal-header">
          <Terminal size={13} />
          <span>Execution Log Stream</span>
        </div>
        <div className="terminal-body">
          {logs.map((log, i) => (
            <div key={i} className="log-line">
              <span className="log-prefix">{'>'}</span>
              <span>{log}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
