# Testing and lessons

## What was tested

The supplied k6 script issues one HTTP GET to the frontend root URL, then sleeps for one second. k6 HTTP requests do not execute the page's JavaScript or automatically reproduce a browser session.

| Stage | Duration | Target at end of stage |
| --- | --- | --- |
| Initial ramp | 2 minutes | 50 virtual users |
| Second ramp | 5 minutes | 200 virtual users |
| Peak ramp | 2 minutes | 500 virtual users |
| Ramp down | 2 minutes | 0 virtual users |

These are ramps, not sustained plateaus. The configured scenario lasts 11 minutes; the summary shows approximately 11 minutes 15 seconds of elapsed execution, including finishing time.

## Recorded results

| Metric | Value |
| --- | --- |
| Total requests | 7,782 |
| Failed requests | 1,462 (18.78%) |
| Average request duration | 9.43 s |
| Median request duration | 3.91 s |
| p90 / p95 request duration | 25.81 s / 32.51 s |
| Request rate | 11.5291/s |
| Completed iterations | 7,780 |
| Interrupted iterations | 24 |
| Maximum virtual users | 500 |
| Received data | 1.3 GB |

![Recorded k6 results](../screenshots/k6-frontend-load-test.png)

The results show substantial response-time degradation and request failures. They do not establish reliable capacity at 500 concurrent users or identify a single root cause. No claim is made that changing load-balancer bandwidth alone would fix the result. A VU is a load-generator worker, not necessarily an active request at every instant.

## Autoscaling evidence

![HPA output with unavailable CPU readings](../screenshots/kubernetes-hpa-status.png)

Both HPA policies exist in the captured output, but CPU utilization is `<unknown>`. This supports “HPA configured,” not “CPU-driven autoscaling demonstrated.” Another supplied screenshot contains manual `kubectl scale` commands; manually changing replicas does not validate HPA behavior.

## Operational limitations visible in this snapshot

- HTTP exposure is shown; TLS configuration is not included.
- The admin service has a public load balancer and one configured replica.
- The managed MySQL screenshot explicitly shows high availability disabled.
- The Object Storage screenshot shows Public bucket visibility. Signed-URL configuration alone would not demonstrate private asset enforcement in this state.
- Backend migrations run at container startup, which should be reviewed before concurrent rollouts.
- Images use mutable `latest` tags. The Dockerfiles are simple builds without a demonstrated hardening process.
- The repository contains Kubernetes application configuration, not Terraform or full OCI infrastructure provisioning.

## Next investigation

1. Restore HPA CPU metrics and record HPA events, pod CPU/memory and replica count alongside request latency.
2. Correlate failed requests with backend/frontend logs and load-balancer metrics before attributing a bottleneck.
3. Test smaller steady plateaus to locate the load level where latency or failure rate first becomes unacceptable.
4. Add separate authenticated API and learning-session scenarios, checks and explicit latency/error thresholds.
5. Repeat against a documented image version and infrastructure snapshot so runs are comparable.

## Hardening priorities

Enable HTTPS and appropriate admin access restrictions; review bucket visibility; use least-privilege database credentials; run migrations once per release; adopt immutable image versions; add alerting and tested backups. These are proposed changes, not completed work represented by this snapshot.
