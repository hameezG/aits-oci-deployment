# Deployment guide

These steps explain how to adapt the recorded setup. They are not an OCI provisioning script and have not been rerun against a live cluster during preparation of this repository. Commands use Bash and the current kubectl namespace.

## Prerequisites

You need the application source containing `backend/`, `front-end/` and `admin-panel/`, Docker, OCI CLI, kubectl, permission to push OCIR images, an active OKE cluster, and a reachable MySQL DB system. The application case-study link is documentation; this repository does not assume it contains buildable application source.

OCI networking must allow the worker nodes to reach MySQL on port 3306, pull images and reach required external APIs. Application load balancers must accept their intended traffic. OCI load balancers, compute and managed databases may incur charges; no free-tier guarantee is implied.

## 1. Connect to the cluster

```bash
oci setup config
oci ce cluster create-kubeconfig \
  --cluster-id '<YOUR_CLUSTER_OCID>' \
  --file "$HOME/.kube/config" \
  --region ap-singapore-1 \
  --token-version 2.0.0 \
  --kube-endpoint PUBLIC_ENDPOINT
kubectl config current-context
kubectl get nodes
```

Use the endpoint appropriate to your cluster and network. Confirm the context before making changes. Use a fresh cluster or namespace for reproduction; do not blindly apply these historical manifests over another deployment.

## 2. Prepare application configuration

Copy `config/app-secrets.example.yaml` to `config/app-secrets.yaml`. Fill in real values locally; the populated file is ignored by Git.

- Set `DATABASE_URL` to a reachable private MySQL host and the `genius_hub` database. URL-encode reserved characters in the password.
- Set a strong JWT secret and the API credentials actually used by your application.
- Set CORS origins to the exact frontend and admin origins, including scheme and non-default ports.
- Confirm Oracle bucket, namespace, endpoint and prefix values against the application. Some values in the supplied environment excerpt were truncated; the example is not a recovered production environment.
- Preserve the application variable spelling, including `No_of_Questions_in_Quiz`, unless the application source requires otherwise.

```bash
kubectl apply -f config/app-secrets.yaml
```

Create an OCIR image pull secret using your tenancy namespace, OCI username and auth token. The prompt avoids putting the literal token in shell history; use your usual secret-management process on shared hosts.

```bash
read -rp 'OCIR username (namespace/user): ' OCIR_USER
read -rsp 'OCI auth token: ' OCIR_TOKEN
printf '\n'
kubectl create secret docker-registry ocir-secret \
  --docker-server=ap-singapore-1.ocir.io \
  --docker-username="$OCIR_USER" \
  --docker-password="$OCIR_TOKEN"
unset OCIR_TOKEN
```

If that secret already exists, update it through your normal credential-management process.

## 3. Build and publish the backend

Set paths to the application source and this repository. Dockerfiles live here, but their build contexts must be the actual application directories.

```bash
export APP_SOURCE='/absolute/path/to/application-source'
export DEPLOY_REPO='/absolute/path/to/aits-oci-deployment'
export OCIR_NAMESPACE='YOUR_OCIR_NAMESPACE'
export REGISTRY="ap-singapore-1.ocir.io/$OCIR_NAMESPACE/aits"

docker login ap-singapore-1.ocir.io
docker build -f "$DEPLOY_REPO/docker/Dockerfile.backend" \
  -t "$REGISTRY/backend:latest" "$APP_SOURCE/backend"
docker push "$REGISTRY/backend:latest"
```

Before building, ensure each application directory has a `.dockerignore` excluding `.env`, keys, Git history and generated files. Merge the example in `docker/.dockerignore.example` into existing ignore rules. This matters because all three historical Dockerfiles use `COPY . .`.

Replace `YOUR_OCIR_NAMESPACE` in every `k8s/*.yaml` image reference. The historical manifests use `latest`; immutable release tags or digests are a recommended subsequent improvement.

## 4. Initialize MySQL and deploy the API

The optional `db-init` pod creates an empty `genius_hub` database if it does not exist. It does not import application data. Skip it if the schema already exists. Its credentials need database-creation permission; use a separate bootstrap credential where possible and a restricted account for normal application operation.

```bash
kubectl apply -f k8s/db-init.yaml
kubectl wait --for=jsonpath='{.status.phase}'=Succeeded pod/db-init --timeout=180s
kubectl logs db-init
kubectl apply -f k8s/backend-deployment.yaml
kubectl rollout status deployment/backend --timeout=180s
kubectl get service backend-service
```

If the initialization pod fails, inspect its logs and fix connectivity or privileges before proceeding. Do not continue just because the manifest was accepted.

The backend Dockerfile runs `alembic upgrade head` before Uvicorn starts. This matches the supplied code. With multiple backend replicas, concurrent migration attempts are a deployment risk; move migrations into one controlled job before hardening this setup.

Wait for the backend service to receive an external endpoint. Use its public API URL for the browser-facing builds below, e.g. `http://BACKEND_HOST:8000/api/v1` for the recorded HTTP configuration.

## 5. Build and deploy the frontend and admin panel

```bash
export PUBLIC_API_URL='http://BACKEND_HOST:8000/api/v1'

docker build -f "$DEPLOY_REPO/docker/Dockerfile.frontend" \
  --build-arg NEXT_PUBLIC_API_URL="$PUBLIC_API_URL" \
  -t "$REGISTRY/frontend:latest" "$APP_SOURCE/front-end"
docker push "$REGISTRY/frontend:latest"

docker build -f "$DEPLOY_REPO/docker/Dockerfile.admin" \
  --build-arg NEXT_PUBLIC_API_URL="$PUBLIC_API_URL" \
  -t "$REGISTRY/admin:latest" "$APP_SOURCE/admin-panel"
docker push "$REGISTRY/admin:latest"

kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/admin-deployment.yaml
kubectl rollout status deployment/frontend --timeout=180s
kubectl rollout status deployment/admin --timeout=180s
kubectl get services
```

`NEXT_PUBLIC_API_URL` is set before `npm run build` in both Dockerfiles. Next.js inlines public environment variables into browser bundles at build time; changing only a pod's runtime environment does not rebuild that bundle. Use a browser-reachable address, not `backend-service` DNS. See the [Next.js environment-variable documentation](https://nextjs.org/docs/app/guides/environment-variables).

Once frontend/admin service endpoints are assigned, update CORS origins in the local secret file, apply it again, and restart the backend so it receives the changed environment:

```bash
kubectl apply -f config/app-secrets.yaml
kubectl rollout restart deployment/backend
kubectl rollout status deployment/backend --timeout=180s
```

## 6. Verify workloads and scaling

```bash
kubectl get nodes
kubectl get pods -o wide
kubectl get deployments
kubectl get services
kubectl logs deployment/backend --tail=100
kubectl apply -f k8s/hpa.yaml
kubectl get hpa
kubectl top pods
kubectl top nodes
kubectl describe hpa backend-hpa
kubectl describe hpa frontend-hpa
```

Check the frontend, admin login page and `/api/v1/health` at their assigned endpoints. Verify an authenticated workflow and asset access separately; a successful root-page response does not validate all application features.

The supplied HPA YAML names are `backend-hpa` and `frontend-hpa`. The screenshots show objects named `backend` and `frontend`, with the same target Deployments and replica ranges. Treat these as different configuration snapshots. On an existing cluster, inspect and reconcile the names first; do not create two HPAs controlling the same Deployment.

If CPU targets show `<unknown>`, inspect HPA events and the metrics API before claiming autoscaling works. After metrics are available, observe replica changes during a controlled test. HPA scales pods, not worker nodes, and the configured maximum is not evidence that all replicas can be scheduled.

## 7. Run the recorded load profile

Install k6 separately, then run against a target you own or are authorized to test:

```bash
k6 run -e TARGET_URL=http://YOUR_FRONTEND_HOST/ tests/load-test.js
```

This starts the full profile reaching 500 virtual users. Choose a suitable test environment and monitor it. The script has no acceptance thresholds or business-flow checks, matching the original test scope. Read [testing and lessons](testing-and-lessons.md) before interpreting results.
