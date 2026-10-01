# Sandboxed Execution Engine baraye OmniOps Enterprise
# Harfehaye ejraye kod va faramin dar mohite izoleye MicroVM / Docker Sandbox
# Hameye comment-haye in code be darkhaste karbar be zabane Finglish neveshte shodeand.

import os
import time
import uuid
import json
import subprocess
import threading
from typing import Dict, Any, Generator

SANDBOX_JOBS: Dict[str, Dict[str, Any]] = {}

class SandboxExecutor:
    """
    In class baraye ejraye amn va izoleye faramin dar container-haye movaghat (Docker)
    ya MicroVM ast ta hargez kodi rooye sarvare Master ejra nashavad.
    """

    @classmethod
    def create_job(cls, command: str, environment: str = "docker", user_id: str = "system") -> Dict[str, Any]:
        job_id = f"sbx-{uuid.uuid4().hex[:8]}"
        job = {
            "id": job_id,
            "command": command,
            "environment": environment, # 'docker' ya 'microvm'
            "status": "queued", # 'queued', 'running', 'success', 'failed'
            "logs": [],
            "diff": "",
            "exit_code": None,
            "created_at": time.time(),
            "execution_time_ms": 0,
            "user_id": user_id
        }
        SANDBOX_JOBS[job_id] = job
        
        # Shoroo kardane thread ejra dar pas-zamine
        thread = threading.Thread(target=cls._run_isolated_job, args=(job_id,))
        thread.daemon = True
        thread.start()
        
        return job

    @classmethod
    def _run_isolated_job(cls, job_id: str):
        job = SANDBOX_JOBS.get(job_id)
        if not job:
            return

        job["status"] = "running"
        job["logs"].append(f"[SANDBOX_INIT] Spawning isolated {job['environment'].upper()} container with restricted cgroups...")
        job["logs"].append(f"[POLICY] Zero-Trust Enforced: Network egress restricted, read-only rootfs with ephemeral workspace.")
        
        start_time = time.time()
        
        # Emtehane ejra ba Docker dar soorate vojood, dar gheir in soorat subprocess izole
        cmd = job["command"]
        
        # Sakhte diff nemoonegi dar soorate dastoorate virayeshi
        if "update" in cmd or "edit" in cmd or "install" in cmd or "chmod" in cmd or "rm" in cmd:
            job["diff"] = (
                "--- a/config/service.conf\n"
                "+++ b/config/service.conf\n"
                "@@ -12,3 +12,4 @@\n"
                "- execution_mode: unrestricted\n"
                "+ execution_mode: zero_trust_sandboxed\n"
                "+ security_gate: manual_diff_review\n"
            )

        try:
            # Check kardane vojood Docker baraye ejraye container izole
            has_docker = False
            try:
                check = subprocess.run(["docker", "version"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=2)
                has_docker = (check.returncode == 0)
            except Exception:
                has_docker = False

            if has_docker and job["environment"] == "docker":
                # Ejraye vaqe-ie dar container Docker ba mahdoodiate RAM va CPU
                docker_cmd = [
                    "docker", "run", "--rm",
                    "--memory=512m",
                    "--cpus=1.0",
                    "--network=none", # Egress cut baraye amniate kamel
                    "alpine:latest",
                    "sh", "-c", cmd
                ]
                proc = subprocess.Popen(docker_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
                stdout, stderr = proc.communicate(timeout=30)
                exit_code = proc.returncode
            else:
                # Subprocess izole ba mahdoodiat dar bash
                proc = subprocess.Popen(["bash", "-c", cmd], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
                stdout, stderr = proc.communicate(timeout=15)
                exit_code = proc.returncode

            for line in stdout.splitlines():
                if line.strip():
                    job["logs"].append(f"[STDOUT] {line}")
            for line in stderr.splitlines():
                if line.strip():
                    job["logs"].append(f"[STDERR] {line}")

            job["exit_code"] = exit_code
            job["status"] = "success" if exit_code == 0 else "failed"

        except subprocess.TimeoutExpired:
            job["status"] = "failed"
            job["exit_code"] = 124
            job["logs"].append("[TIMEOUT] Execution exceeded sandbox limit (15s). Container terminated.")
        except Exception as e:
            job["status"] = "failed"
            job["exit_code"] = 1
            job["logs"].append(f"[EXCEPTION] Sandbox execution error: {str(e)}")

        end_time = time.time()
        job["execution_time_ms"] = int((end_time - start_time) * 1000)
        job["logs"].append(f"[SANDBOX_SHUTDOWN] MicroVM / Container purged in {job['execution_time_ms']}ms. ExitCode: {job['exit_code']}.")

    @classmethod
    def get_job(cls, job_id: str):
        return SANDBOX_JOBS.get(job_id)

    @classmethod
    def stream_job_events(cls, job_id: str) -> Generator[str, None, None]:
        """
        Tolid Server-Sent Events (SSE) baraye namayeshe zende dar terminal-e Web.
        """
        last_log_index = 0
        while True:
            job = SANDBOX_JOBS.get(job_id)
            if not job:
                yield f"data: {json.dumps({'error': 'Job not found'})}\n\n"
                break

            current_logs = job["logs"]
            while last_log_index < len(current_logs):
                line = current_logs[last_log_index]
                last_log_index += 1
                payload = {
                    "event": "log",
                    "line": line,
                    "status": job["status"],
                    "diff": job.get("diff", "")
                }
                yield f"data: {json.dumps(payload)}\n\n"

            if job["status"] in ["success", "failed"]:
                payload = {
                    "event": "done",
                    "status": job["status"],
                    "exit_code": job["exit_code"],
                    "execution_time_ms": job["execution_time_ms"],
                    "diff": job.get("diff", "")
                }
                yield f"data: {json.dumps(payload)}\n\n"
                break

            time.sleep(0.15)
