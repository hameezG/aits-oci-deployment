# Source notes and corrections

The implementation baseline is the supplied `deployment_code.txt`. The screenshots provide observed state. The original `files.zip` was treated as a draft because it disagreed with both.

The external AITS case-study URL could not be retrieved during this review. It is retained as the project link supplied by the author; no unverified content from it is used to establish deployment behavior.

## Corrections to the draft

| Draft item | Corrected record |
| --- | --- |
| Registry path `genius-hub/...` | Actual supplied image paths use `aits/...` |
| Backend `ClusterIP` service | Actual service is `LoadBalancer` on port 8000 |
| Backend probe `/health` | `/api/v1/health` |
| Backend requests 250m CPU | 100m CPU in supplied deployment |
| Frontend requests 250m CPU | 100m CPU in supplied deployment |
| Backend initial replicas 3 | Deployment sets 1; HPA minimum is 3 |
| Load-balancer range 10–100 Mbps | Supplied annotations set both minimum and maximum to 10 |
| E3 Flex nodes with 8 GB RAM | Later pool screenshot shows Standard2.2, 2 OCPUs, 30 GB, two nodes |
| Runtime `NEXT_PUBLIC_API_URL` using service DNS | Removed; actual Dockerfiles supply the public URL during the build |
| Missing backend Dockerfile / initialization pod | Included from actual deployment code |
| HPA successfully scales with CPU | Policies visible, CPU metrics unknown in screenshots |
| No single point of failure | Removed; DB HA disabled and admin has one replica |
| Load balancer identified as bottleneck | Removed; evidence does not isolate the cause |
| 500 users successfully supported | Replaced with peak VUs and complete error/latency results |
| Five-minute sustained 200-VU stage | Corrected to a ramp ending at 200 VUs |

## Publication changes to the supplied code

- Copied all three Dockerfiles without changing their instructions.
- Copied all five Kubernetes files (three app manifests, HPA and db-init), replacing the original registry namespace with `YOUR_OCIR_NAMESPACE`.
- Parameterized the k6 target as `TARGET_URL` and added a missing/invalid URL guard. Stages, GET behavior and sleep remain unchanged.
- Built a placeholder-only secret example. The truncated environment excerpt is not a complete specification; application-specific values must be confirmed.
- Added `.gitignore` and a Docker build-context ignore example.
- Omitted the development Compose file from the deployment package. It uses development servers, reload, bind mounts and passwordless local MySQL; it is not the OKE deployment definition.
- Excluded raw credential-bearing material, account/billing screenshots and admin-seeder output. Selected images were cropped and identifying fields redacted without changing operational results.

The code and screenshots are not perfectly synchronized: HPA names differ, and node-pool configuration evolved during setup. Those differences are documented rather than silently rewritten into a false single snapshot.

## Validation performed

YAML parsing, Deployment/Service selector and port checks, HPA target checks, relative Markdown link checks, image existence checks and comparison with the supplied deployment code were performed locally. The images were visually reviewed. No cloud deployment, image build, application integration test or new load test was executed as part of this packaging work.
