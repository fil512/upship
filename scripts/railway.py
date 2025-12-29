#!/usr/bin/env python3
"""
Railway API client for the Upship project.

Usage:
    python scripts/railway.py status              # Show deployment status
    python scripts/railway.py logs [-n 50]        # Show deployment logs
    python scripts/railway.py deployments         # List recent deployments
    python scripts/railway.py setvar KEY VALUE    # Set environment variable
    python scripts/railway.py getvar [KEY]        # Get environment variable(s)
    python scripts/railway.py redeploy            # Trigger a new deployment
    python scripts/railway.py health              # Check health endpoint
    python scripts/railway.py projects            # List all projects
    python scripts/railway.py raw 'query {...}'   # Execute raw GraphQL query
"""

import os
import sys
import json
import argparse
import urllib.request
import urllib.error

RAILWAY_API_URL = "https://backboard.railway.com/graphql/v2"

# Upship project constants (from Railway dashboard)
UPSHIP_PROJECT_ID = "3eb48405-c292-4c4e-a1a0-59f42a94fcfb"
UPSHIP_ENVIRONMENT_ID = "b33bbf9d-05a8-451d-a2b6-16f6d56b4d81"  # production
UPSHIP_SERVICE_ID = "22fd253c-5243-4a50-a0b7-06efe95373c3"      # upship app
UPSHIP_POSTGRES_ID = "67603638-0da9-43b8-bc59-08416ed7ea27"     # postgres
UPSHIP_URL = "https://upship-production.up.railway.app"


def get_token():
    """Get Railway API token from environment."""
    token = os.environ.get("RAILWAY_TOKEN")
    if not token:
        print("Error: RAILWAY_TOKEN environment variable not set", file=sys.stderr)
        print("Create a token at: https://railway.com/account/tokens", file=sys.stderr)
        sys.exit(1)
    return token


def graphql_query(query, variables=None):
    """Execute a GraphQL query against the Railway API using Bearer auth."""
    token = get_token()

    payload = {"query": query}
    if variables:
        payload["variables"] = variables

    data = json.dumps(payload).encode("utf-8")

    req = urllib.request.Request(
        RAILWAY_API_URL,
        data=data,
        headers={
            "Content-Type": "application/json",
            "User-Agent": "upship-railway-client/1.0",
            "Accept": "application/json",
            "Authorization": f"Bearer {token}",
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode("utf-8"))
            if "errors" in result:
                for error in result["errors"]:
                    print(f"GraphQL Error: {error['message']}", file=sys.stderr)
                if not result.get("data"):
                    sys.exit(1)
            return result.get("data")
    except urllib.error.HTTPError as e:
        print(f"HTTP Error {e.code}: {e.reason}", file=sys.stderr)
        try:
            error_body = e.read().decode("utf-8")
            try:
                error_json = json.loads(error_body)
                print(json.dumps(error_json, indent=2), file=sys.stderr)
            except json.JSONDecodeError:
                print(error_body, file=sys.stderr)
        except Exception:
            pass
        sys.exit(1)


def get_deployments(limit=5):
    """Get recent deployments for the upship service."""
    query = """
    query ListDeployments($serviceId: String!, $environmentId: String!, $limit: Int!) {
        deployments(first: $limit, input: {serviceId: $serviceId, environmentId: $environmentId}) {
            edges {
                node {
                    id
                    status
                    createdAt
                }
            }
        }
    }
    """
    return graphql_query(query, {
        "serviceId": UPSHIP_SERVICE_ID,
        "environmentId": UPSHIP_ENVIRONMENT_ID,
        "limit": limit
    })


def get_deployment_logs(deployment_id, limit=100):
    """Get logs for a specific deployment."""
    query = """
    query DeploymentLogs($deploymentId: String!, $limit: Int) {
        deploymentLogs(deploymentId: $deploymentId, limit: $limit) {
            timestamp
            message
            severity
        }
    }
    """
    return graphql_query(query, {"deploymentId": deployment_id, "limit": limit})


def get_variables():
    """Get all variables for the upship service."""
    query = """
    query GetVariables($projectId: String!, $environmentId: String!, $serviceId: String!) {
        variablesForServiceDeployment(
            projectId: $projectId,
            environmentId: $environmentId,
            serviceId: $serviceId
        )
    }
    """
    return graphql_query(query, {
        "projectId": UPSHIP_PROJECT_ID,
        "environmentId": UPSHIP_ENVIRONMENT_ID,
        "serviceId": UPSHIP_SERVICE_ID
    })


def set_variable(name, value):
    """Set an environment variable for the upship service."""
    query = """
    mutation SetVariable($input: VariableUpsertInput!) {
        variableUpsert(input: $input)
    }
    """
    return graphql_query(query, {
        "input": {
            "projectId": UPSHIP_PROJECT_ID,
            "environmentId": UPSHIP_ENVIRONMENT_ID,
            "serviceId": UPSHIP_SERVICE_ID,
            "name": name,
            "value": value
        }
    })


def delete_variable(name):
    """Delete an environment variable."""
    query = """
    mutation DeleteVariable($input: VariableDeleteInput!) {
        variableDelete(input: $input)
    }
    """
    return graphql_query(query, {
        "input": {
            "projectId": UPSHIP_PROJECT_ID,
            "environmentId": UPSHIP_ENVIRONMENT_ID,
            "serviceId": UPSHIP_SERVICE_ID,
            "name": name
        }
    })


def trigger_deployment():
    """Trigger a new deployment by updating a dummy variable."""
    query = """
    mutation TriggerDeploy($input: EnvironmentTriggersDeployInput!) {
        environmentTriggersDeploy(input: $input)
    }
    """
    return graphql_query(query, {
        "input": {
            "environmentId": UPSHIP_ENVIRONMENT_ID,
            "projectId": UPSHIP_PROJECT_ID,
            "serviceId": UPSHIP_SERVICE_ID
        }
    })


# ============ Command Handlers ============

def cmd_status(args):
    """Show current deployment status."""
    data = get_deployments(1)
    if not data:
        print("No data returned")
        return

    edges = data.get("deployments", {}).get("edges", [])
    if not edges:
        print("No deployments found")
        return

    dep = edges[0]["node"]
    status = dep["status"]
    created = dep["createdAt"][:19].replace("T", " ")

    # Status emoji
    status_icon = {
        "SUCCESS": "✓",
        "FAILED": "✗",
        "BUILDING": "⟳",
        "DEPLOYING": "⟳",
        "INITIALIZING": "⟳",
        "CRASHED": "✗",
        "REMOVED": "−"
    }.get(status, "?")

    print(f"Upship Production: {status_icon} {status}")
    print(f"  Deployment: {dep['id'][:8]}...")
    print(f"  Created: {created} UTC")

    # Quick health check
    if status == "SUCCESS":
        try:
            req = urllib.request.Request(f"{UPSHIP_URL}/health", method="GET")
            req.add_header("User-Agent", "upship-railway-client/1.0")
            with urllib.request.urlopen(req, timeout=5) as resp:
                health = json.loads(resp.read().decode("utf-8"))
                db_status = health.get("database", "unknown")
                print(f"  Health: ✓ healthy (db: {db_status})")
        except Exception as e:
            print(f"  Health: ✗ unreachable ({e})")


def cmd_logs(args):
    """Show deployment logs."""
    # Get latest deployment
    dep_data = get_deployments(1)
    if not dep_data:
        print("No deployments found")
        return

    edges = dep_data.get("deployments", {}).get("edges", [])
    if not edges:
        print("No deployments found")
        return

    dep = edges[0]["node"]
    print(f"=== Logs for deployment {dep['id'][:8]}... ({dep['status']}) ===\n")

    logs_data = get_deployment_logs(dep["id"], args.lines)
    if not logs_data:
        print("No logs returned")
        return

    logs = logs_data.get("deploymentLogs", [])
    if not logs:
        print("No log entries")
        return

    # Sort by timestamp and dedupe
    seen = set()
    for log in sorted(logs, key=lambda x: x.get("timestamp", "")):
        msg = log.get("message", "")
        if not msg or msg in seen:
            continue
        seen.add(msg)

        severity = log.get("severity", "info").lower()
        timestamp = log.get("timestamp", "")[:19].replace("T", " ")

        # Color coding for terminal
        if severity == "error":
            print(f"[{timestamp}] ERROR: {msg}")
        else:
            print(f"[{timestamp}] {msg}")


def cmd_deployments(args):
    """List recent deployments."""
    data = get_deployments(args.limit)
    if not data:
        print("No data returned")
        return

    edges = data.get("deployments", {}).get("edges", [])
    if not edges:
        print("No deployments found")
        return

    print(f"Recent deployments (showing {len(edges)}):\n")
    for edge in edges:
        dep = edge["node"]
        status = dep["status"]
        created = dep["createdAt"][:19].replace("T", " ")

        status_icon = {"SUCCESS": "✓", "FAILED": "✗", "BUILDING": "⟳", "DEPLOYING": "⟳"}.get(status, "?")
        print(f"  {status_icon} {dep['id'][:12]}  {status:12}  {created}")


def cmd_setvar(args):
    """Set an environment variable."""
    result = set_variable(args.key, args.value)
    if result and result.get("variableUpsert"):
        print(f"✓ Set {args.key}={args.value}")
        print("  (This will trigger a new deployment)")
    else:
        print(f"✗ Failed to set {args.key}")


def cmd_getvar(args):
    """Get environment variable(s)."""
    data = get_variables()
    if not data:
        print("No data returned")
        return

    variables = data.get("variablesForServiceDeployment", {})

    if args.key:
        # Show specific variable
        if args.key in variables:
            print(f"{args.key}={variables[args.key]}")
        else:
            print(f"Variable '{args.key}' not found")
    else:
        # Show all variables
        print("Environment variables:\n")
        for key in sorted(variables.keys()):
            value = variables[key]
            # Mask sensitive values
            if any(s in key.lower() for s in ["secret", "password", "token", "key"]):
                display = value[:4] + "..." if len(value) > 4 else "***"
            else:
                display = value if len(value) < 50 else value[:47] + "..."
            print(f"  {key}={display}")


def cmd_delvar(args):
    """Delete an environment variable."""
    result = delete_variable(args.key)
    if result and result.get("variableDelete"):
        print(f"✓ Deleted {args.key}")
        print("  (This will trigger a new deployment)")
    else:
        print(f"✗ Failed to delete {args.key}")


def cmd_redeploy(args):
    """Trigger a new deployment."""
    print("Triggering deployment...")
    result = trigger_deployment()
    if result:
        print("✓ Deployment triggered")
        print("  Run 'railway.py status' to check progress")
    else:
        print("✗ Failed to trigger deployment")


def cmd_health(args):
    """Check the health endpoint."""
    try:
        req = urllib.request.Request(f"{UPSHIP_URL}/health", method="GET")
        req.add_header("User-Agent", "upship-railway-client/1.0")
        with urllib.request.urlopen(req, timeout=10) as resp:
            health = json.loads(resp.read().decode("utf-8"))
            print(json.dumps(health, indent=2))
    except urllib.error.HTTPError as e:
        print(f"HTTP Error {e.code}: {e.reason}")
        sys.exit(1)
    except urllib.error.URLError as e:
        print(f"Connection Error: {e.reason}")
        sys.exit(1)


def cmd_projects(args):
    """List all projects."""
    query = """
    query {
        projects(first: 20) {
            edges {
                node {
                    id
                    name
                    environments { edges { node { id name } } }
                    services { edges { node { id name } } }
                }
            }
        }
    }
    """
    data = graphql_query(query)
    if not data:
        print("No data returned")
        return

    for proj_edge in data.get("projects", {}).get("edges", []):
        proj = proj_edge["node"]
        print(f"\n=== {proj['name']} ===")
        print(f"ID: {proj['id']}")

        envs = proj.get("environments", {}).get("edges", [])
        if envs:
            print("Environments:")
            for env_edge in envs:
                env = env_edge["node"]
                print(f"  - {env['name']} ({env['id']})")

        svcs = proj.get("services", {}).get("edges", [])
        if svcs:
            print("Services:")
            for svc_edge in svcs:
                svc = svc_edge["node"]
                print(f"  - {svc['name']} ({svc['id']})")


def cmd_raw(args):
    """Execute a raw GraphQL query."""
    data = graphql_query(args.query)
    if data:
        print(json.dumps(data, indent=2))


def cmd_schema(args):
    """Inspect a GraphQL schema type."""
    query = """
    query IntrospectType($name: String!) {
        __type(name: $name) {
            name
            kind
            fields { name type { name kind ofType { name } } }
            inputFields { name type { name kind ofType { name } } }
        }
    }
    """
    data = graphql_query(query, {"name": args.type})
    if data and data.get("__type"):
        print(json.dumps(data["__type"], indent=2))
    else:
        print(f"Type '{args.type}' not found")


def main():
    parser = argparse.ArgumentParser(
        description="Railway API client for Upship",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  railway.py status              # Check deployment status
  railway.py logs -n 50          # View last 50 log lines
  railway.py setvar FOO bar      # Set environment variable
  railway.py getvar              # List all variables
  railway.py redeploy            # Trigger new deployment
"""
    )
    subparsers = parser.add_subparsers(dest="command", help="Command")

    # status
    subparsers.add_parser("status", help="Show deployment status")

    # logs
    logs_p = subparsers.add_parser("logs", help="Show deployment logs")
    logs_p.add_argument("-n", "--lines", type=int, default=100, help="Number of lines (default: 100)")

    # deployments
    dep_p = subparsers.add_parser("deployments", help="List recent deployments")
    dep_p.add_argument("-n", "--limit", type=int, default=10, help="Number to show (default: 10)")

    # setvar
    setvar_p = subparsers.add_parser("setvar", help="Set environment variable")
    setvar_p.add_argument("key", help="Variable name")
    setvar_p.add_argument("value", help="Variable value")

    # getvar
    getvar_p = subparsers.add_parser("getvar", help="Get environment variable(s)")
    getvar_p.add_argument("key", nargs="?", help="Variable name (optional, shows all if omitted)")

    # delvar
    delvar_p = subparsers.add_parser("delvar", help="Delete environment variable")
    delvar_p.add_argument("key", help="Variable name")

    # redeploy
    subparsers.add_parser("redeploy", help="Trigger a new deployment")

    # health
    subparsers.add_parser("health", help="Check health endpoint")

    # projects
    subparsers.add_parser("projects", help="List all projects")

    # raw
    raw_p = subparsers.add_parser("raw", help="Execute raw GraphQL query")
    raw_p.add_argument("query", help="GraphQL query string")

    # schema
    schema_p = subparsers.add_parser("schema", help="Inspect GraphQL schema type")
    schema_p.add_argument("type", help="Type name to inspect")

    args = parser.parse_args()

    commands = {
        "status": cmd_status,
        "logs": cmd_logs,
        "deployments": cmd_deployments,
        "setvar": cmd_setvar,
        "getvar": cmd_getvar,
        "delvar": cmd_delvar,
        "redeploy": cmd_redeploy,
        "health": cmd_health,
        "projects": cmd_projects,
        "raw": cmd_raw,
        "schema": cmd_schema,
    }

    if args.command in commands:
        commands[args.command](args)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
