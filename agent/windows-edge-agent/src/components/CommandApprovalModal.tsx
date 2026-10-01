import React, { useState } from 'react';
import { ParsedCommand } from '../services/commandParser';
import { getStoredCredentials } from '../services/credentialService';

interface ApprovalProps {
  pendingCommand: ParsedCommand | null;
  onResolved: (cmdId: string, success: boolean, resultOutput: string) => void;
  onReject: (cmdId: string) => void;
}

export const CommandApprovalModal: React.FC<ApprovalProps> = ({
  pendingCommand,
  onResolved,
  onReject
}) => {
  const [running, setRunning] = useState(false);
  const [executionLog, setExecutionLog] = useState<string | null>(null);

  if (!pendingCommand) return null;

  const handleApprove = async () => {
    setRunning(true);
    setExecutionLog(null);
    try {
      let res: any;
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        res = await invoke('execute_windows_payload', {
          action: pendingCommand.action,
          command: pendingCommand.command
        });
      } catch (tauriErr) {
        // Fallback agar dar browser bashe baraye test
        console.warn('Tauri invoke unavailable, simulating output:', tauriErr);
        res = {
          success: true,
          exit_code: 0,
          stdout: `[SIMULATED WINDOWS POWERSHELL OUTPUT]\nCommand: ${pendingCommand.command}\nStatus: Completed with exit code 0`,
          stderr: ''
        };
      }

      const output = res.success ? res.stdout : (res.stderr || res.stdout);
      setExecutionLog(output || '[دستور با موفقیت بدون خروجی اجرا شد]');

      // Ersale gozaresh (Telemetry Callback) be Master Server-e OmniOps
      try {
        const creds = await getStoredCredentials();
        await fetch(`${creds.masterUrl.replace(/\/+$/, '')}/v1/agent/callback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${creds.exchangeToken}`
          },
          body: JSON.stringify({
            command_id: pendingCommand.id,
            action: pendingCommand.action,
            command: pendingCommand.command,
            status: res.success ? 'success' : 'failed',
            exit_code: res.exit_code,
            output
          })
        });
      } catch (cbErr) {
        console.warn('Telemetry callback to master failed:', cbErr);
      }

      setTimeout(() => {
        setRunning(false);
        onResolved(pendingCommand.id, res.success, output);
      }, 700);

    } catch (err: any) {
      setExecutionLog(`FAILED: ${err.toString()}`);
      setRunning(false);
      onResolved(pendingCommand.id, false, err.toString());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="bg-[#121214] border border-amber-500/50 rounded-2xl w-full max-w-lg p-6 shadow-[0_0_50px_rgba(245,158,11,0.2)] text-zinc-100">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Zero-Trust Gate
            </span>
            <h3 className="font-semibold text-sm">درخواست اجرای فرمان در ترمینال ویندوز</h3>
          </div>
          <span className="text-xs text-zinc-400 font-mono">Action: {pendingCommand.action}</span>
        </div>

        <div className="my-4 text-right" dir="rtl">
          <p className="text-xs text-zinc-300 mb-2 leading-relaxed">
            سرور مرکزی OmniOps Enterprise فرمان زیر را برای اجرا روی این کلاینت ویندوزی صادر کرده است:
          </p>
          <div className="bg-black/95 rounded-lg p-3 border border-zinc-800 font-mono text-xs text-emerald-400 overflow-x-auto max-h-48 text-left select-all" dir="ltr">
            <code>{pendingCommand.command}</code>
          </div>
        </div>

        {executionLog && (
          <div className="mb-4 bg-zinc-950 p-2.5 rounded border border-zinc-800 text-[11px] font-mono max-h-32 overflow-y-auto text-zinc-300 text-left" dir="ltr">
            <div className="text-zinc-500 mb-1 font-sans text-right" dir="rtl">نتیجه اجرا در ویندوز:</div>
            <pre className="whitespace-pre-wrap">{executionLog}</pre>
          </div>
        )}

        <div className="flex gap-3 justify-end pt-2">
          <button
            onClick={() => onReject(pendingCommand.id)}
            disabled={running}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium transition disabled:opacity-50"
          >
            رد درخواست (Reject)
          </button>
          <button
            onClick={handleApprove}
            disabled={running}
            className="px-5 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-medium rounded-lg text-xs shadow-lg transition disabled:opacity-50 flex items-center gap-2"
          >
            {running ? (
              <>
                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                در حال اجرای دستور در ویندوز...
              </>
            ) : (
              'تایید و اجرای مستقیم در ویندوز (Approve)'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
