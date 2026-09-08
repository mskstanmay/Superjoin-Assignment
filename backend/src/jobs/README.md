# Durable runner boundary

`processing_runs` is the durable job store. The foundation migration includes
attempts, heartbeat, retry scheduling, lease tokens and checkpoints. Execution,
atomic claims, recovery and publication are Milestone 2; no background runner is
started in Milestone 1. An in-memory wake-up must never replace persisted jobs.
