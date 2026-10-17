# Screenshot sources

All seven published screenshots are displayed in the root README. They were selected from the 60 supplied captures, cropped to remove browser chrome and unused space, and redacted to hide account details and selected identifiers. Status fields and test results are preserved.

| Published image | | Evidence |
| --- | --- | --- |
| [aits-student-dashboard.png](../screenshots/aits-student-dashboard.png) | | Deployed student interface |
| [oci-oke-worker-pool.png](../screenshots/oci-oke-worker-pool.png) |  | Worker count, shape and configuration |
| [kubernetes-running-workloads.png](../screenshots/kubernetes-running-workloads.png) | | Ready nodes, Running pods and services |
| [oci-public-load-balancers.png](../screenshots/oci-public-load-balancers.png) | | Three Active load balancers with OK health |
| [oci-managed-mysql.png](../screenshots/oci-managed-mysql.png) | | Active DB system; HA and HeatWave disabled |
| [kubernetes-hpa-status.png](../screenshots/kubernetes-hpa-status.png) |  | HPA policies with unavailable CPU readings |
| [k6-frontend-load-test.png](../screenshots/k6-frontend-load-test.png) |  | Recorded request totals, latency and failures |

The cluster-list image was omitted because the node-pool and workload captures provide more useful evidence. The separate storage-console image was also removed from this concise presentation; its original capture, Screenshot (241).png, showed the asset bucket with Public visibility. That observation remains documented, but the source image is not included in this package.

Other setup captures, duplicates, account/billing screens and credential-bearing output are excluded. Screenshots establish historical state, not current uptime.

## Displaying images on GitHub

Upload the contents of the extracted repository folder with `README.md` and `screenshots/` at the same level. The README uses case-sensitive relative paths beginning with `./screenshots/`. Uploading only the README, renaming its image folder, or placing it at a different level breaks those references.

The two diagrams are fenced `mermaid` blocks in the README. Use a Markdown viewer with Mermaid support to render them; plain-text editors show their source code.
