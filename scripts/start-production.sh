#!/usr/bin/env sh
set -e

# ==============================================================================
# Startup Showcase - Production Startup Script
# ==============================================================================
# This script performs pre-flight validation on required environment variables,
# ensures standalone static asset paths are properly linked, and executes
# Next.js standalone server with PORT and HOSTNAME configured.
# ==============================================================================

echo "==> Starting Startup Showcase in Production mode..."

# 1. Environment Variable Pre-Flight Verification
MISSING_VARS=""

check_var() {
  var_name="$1"
  eval "val=\$$var_name"
  if [ -z "$val" ]; then
    MISSING_VARS="$MISSING_VARS $var_name"
  fi
}

check_var "NEXT_PUBLIC_SITE_URL"
check_var "NEXT_PUBLIC_SUPABASE_URL"
check_var "NEXT_PUBLIC_SUPABASE_ANON_KEY"
check_var "SUPABASE_SERVICE_ROLE_KEY"
check_var "DATABASE_URL"
check_var "VIEW_HASH_SECRET"
check_var "NEWSLETTER_SECRET"
check_var "RESEND_API_KEY"
check_var "EMAIL_FROM"
check_var "NEXT_PUBLIC_TURNSTILE_SITE_KEY"
check_var "TURNSTILE_SECRET_KEY"
check_var "NEXT_PUBLIC_GOOGLE_AUTH_ENABLED"
check_var "NEXT_PUBLIC_CONTACT_EMAIL"
check_var "RAZORPAY_KEY_ID"
check_var "RAZORPAY_KEY_SECRET"
check_var "RAZORPAY_WEBHOOK_SECRET"
check_var "NEXT_PUBLIC_RAZORPAY_KEY_ID"
check_var "SUBMISSION_PRICE_USD_CENTS"

if [ -z "$TRUSTED_PROXY_COUNT" ]; then
  MISSING_VARS="$MISSING_VARS TRUSTED_PROXY_COUNT"
fi

if [ -n "$MISSING_VARS" ]; then
  echo "CRITICAL CONFIGURATION ERROR: The following required environment variable(s) are missing or empty:"
  for v in $MISSING_VARS; do
    echo "  - $v"
  done
  echo "Please consult docs/DEPLOY.md and ensure all variables are defined before starting production."
  exit 1
fi

# Razorpay Test Key Production Guard
if echo "$RAZORPAY_KEY_ID" | grep -q "^rzp_test_"; then
  if [ "$ALLOW_RAZORPAY_TEST_IN_PRODUCTION" != "true" ]; then
    echo "CRITICAL SECURITY ERROR: RAZORPAY_KEY_ID starts with 'rzp_test_' in production."
    echo "Launching with test keys in production is forbidden unless ALLOW_RAZORPAY_TEST_IN_PRODUCTION=true."
    exit 1
  fi
fi

# 2. Trusted Proxy Count Warning & Verification
echo "==> TRUSTED_PROXY_COUNT is set to '$TRUSTED_PROXY_COUNT'."
echo "    Ensure this exactly matches the real count of reverse proxies in front of this container/process."

# 3. Port and Hostname Bindings
export PORT="${PORT:-3000}"
export HOSTNAME="${HOSTNAME:-0.0.0.0}"
export NODE_ENV="production"

echo "==> Binding server to http://${HOSTNAME}:${PORT}"

# 4. Standalone Server Detection & Asset Verification
if [ -f ".next/standalone/server.js" ]; then
  # Running from repository root
  if [ -d "public" ] && [ ! -d ".next/standalone/public" ]; then
    echo "==> Copying public directory into .next/standalone/public..."
    cp -r public .next/standalone/public
  fi
  if [ -d ".next/static" ] && [ ! -d ".next/standalone/.next/static" ]; then
    echo "==> Copying .next/static into .next/standalone/.next/static..."
    mkdir -p .next/standalone/.next
    cp -r .next/static .next/standalone/.next/static
  fi

  echo "==> Launching server via .next/standalone/server.js..."
  exec node .next/standalone/server.js
elif [ -f "server.js" ]; then
  # Running from within .next/standalone directory directly (e.g. Docker runner)
  echo "==> Launching server via ./server.js..."
  exec node server.js
else
  echo "ERROR: Standalone server.js not found. Please run 'npm run build' first."
  exit 1
fi
