#!/bin/bash

# Test script for Gemini API endpoint
# Usage: ./test-gemini-endpoint.sh [server-url]
# Example: ./test-gemini-endpoint.sh https://nem-server-rhdb.onrender.com

SERVER_URL="${1:-http://localhost:3001}"
ENDPOINT="$SERVER_URL/api/gemini/generate"

echo "========================================="
echo "Gemini API Endpoint Test"
echo "========================================="
echo "Server URL: $SERVER_URL"
echo "Endpoint: $ENDPOINT"
echo ""

# Test 1: Check if endpoint is accessible
echo "Test 1: Endpoint Accessibility"
echo "-------------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"test"}]}]}')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo "HTTP Status Code: $HTTP_CODE"
echo "Response Body:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

# Check if response is JSON
if echo "$BODY" | jq '.' >/dev/null 2>&1; then
  echo "✅ Response is valid JSON"
else
  echo "❌ Response is NOT valid JSON (might be HTML)"
  echo ""
  echo "First 200 characters of response:"
  echo "$BODY" | head -c 200
  echo ""
fi

# Check for HTML DOCTYPE
if echo "$BODY" | grep -q "<!DOCTYPE"; then
  echo "❌ CRITICAL: Response contains HTML DOCTYPE"
  echo "   This indicates the endpoint is returning an HTML error page"
  echo "   instead of JSON. Check server logs and environment variables."
else
  echo "✅ Response does not contain HTML DOCTYPE"
fi

echo ""

# Test 2: Check for API key configuration
echo "Test 2: API Key Configuration"
echo "------------------------------"
if echo "$BODY" | grep -q "Gemini API key not configured"; then
  echo "❌ API key is NOT configured"
  echo "   Action: Set GEMINI_API_KEY environment variable in production"
  echo "   Get key from: https://makersuite.google.com/app/apikey"
elif echo "$BODY" | grep -q "Invalid API key"; then
  echo "❌ API key is INVALID"
  echo "   Action: Generate a new key from https://makersuite.google.com/app/apikey"
elif [ "$HTTP_CODE" = "200" ]; then
  echo "✅ API key appears to be configured correctly"
else
  echo "⚠️  Unable to determine API key status"
  echo "   HTTP Status: $HTTP_CODE"
fi

echo ""

# Test 3: Check Content-Type header
echo "Test 3: Content-Type Header"
echo "---------------------------"
CONTENT_TYPE=$(curl -s -I -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"test"}]}]}' | grep -i "content-type")

echo "Content-Type: $CONTENT_TYPE"

if echo "$CONTENT_TYPE" | grep -q "application/json"; then
  echo "✅ Content-Type is application/json"
else
  echo "❌ Content-Type is NOT application/json"
  echo "   This might cause parsing errors in the frontend"
fi

echo ""
echo "========================================="
echo "Test Summary"
echo "========================================="

if [ "$HTTP_CODE" = "200" ] && echo "$BODY" | jq '.' >/dev/null 2>&1; then
  echo "✅ ALL TESTS PASSED"
  echo "   The Gemini endpoint is working correctly!"
elif echo "$BODY" | grep -q "Gemini API key not configured"; then
  echo "⚠️  CONFIGURATION NEEDED"
  echo "   Set GEMINI_API_KEY environment variable"
elif echo "$BODY" | grep -q "<!DOCTYPE"; then
  echo "❌ CRITICAL ISSUE"
  echo "   Endpoint is returning HTML instead of JSON"
  echo "   Check server deployment and routing"
else
  echo "⚠️  PARTIAL SUCCESS"
  echo "   Endpoint is accessible but may have issues"
  echo "   Check the response details above"
fi

echo ""
echo "For more help, see: GEMINI_DEPLOYMENT_GUIDE.md"
echo "========================================="
